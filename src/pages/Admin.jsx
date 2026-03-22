import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './css/Admin.module.css';
import clsx from 'clsx';
import logos from '../images/logo-site4.png';
import { useAuth } from '../context/AuthContext';
import {
    SimplePieChart,
    SimpleLineChart,
    SimpleBarChart,
    StatCard
} from '../components/SimpleCharts.jsx';

const Admin = () => {
    const [activeTab, setActiveTab] = useState('sites');
    const [sites, setSites] = useState([]);
    const [users, setUsers] = useState([]);
    const [favorites] = useState([]); // Gardé car utilisé dans dashboardStats
    const [reviews] = useState([]); // Gardé car utilisé dans dashboardStats
    const [isLoading, setIsLoading] = useState(true);
    const [editingSite, setEditingSite] = useState(null);
    const [showSiteForm, setShowSiteForm] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [uploading, setUploading] = useState(false);
    const [regions, setRegions] = useState([]);
    const [siteTypes, setSiteTypes] = useState([]);
    const [dashboardStats, setDashboardStats] = useState({
        totalSites: 0,
        totalUsers: 0,
        totalReviews: 0,
        totalFavorites: 0,
        activeUsers: 0,
        sitesThisMonth: 0,
        revenueEstimate: 0,
        avgRating: 0
    });

    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const statsRef = useRef(null);

    // Formulaire site avec image
    const [siteForm, setSiteForm] = useState({
        nom: '',
        description: '',
        type: '',
        id_region: '',
        cout_estime: '',
        duree_visite: '',
        latitude: '',
        longitude: '',
        image: null
    });

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');

            const [sitesRes, usersRes, regionsRes, typesRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_BACK_URL}/api/site`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${process.env.REACT_APP_BACK_URL}/api/admin/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${process.env.REACT_APP_BACK_URL}/api/user/regions/`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${process.env.REACT_APP_BACK_URL}/api/type`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setSites(sitesRes.data);
            setUsers(usersRes.data);
            setRegions(regionsRes.data);
            setSiteTypes(typesRes.data);
        } catch (err) {
            setError('Erreur lors du chargement des données');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchDashboardStats = useCallback(() => {
        try {
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);

            const activeUsersCount = users.filter(u => u.actif).length;
            const sitesThisMonthCount = sites.filter(site => {
                const siteDate = new Date(site.date_creation || now);
                return siteDate >= thirtyDaysAgo;
            }).length;

            const revenueEstimate = sites.reduce((sum, site) =>
                sum + (parseFloat(site.cout_estime) || 0), 0
            );

            const avgRating = reviews.length > 0
                ? reviews.reduce((sum, review) => sum + (review.note || 0), 0) / reviews.length
                : 0;

            setDashboardStats({
                totalSites: sites.length,
                totalUsers: users.length,
                totalReviews: reviews.length,
                totalFavorites: favorites.length,
                activeUsers: activeUsersCount,
                sitesThisMonth: sitesThisMonthCount,
                revenueEstimate: revenueEstimate,
                avgRating: parseFloat(avgRating.toFixed(1))
            });
        } catch (err) {
            console.error('Erreur lors du chargement des statistiques:', err);
        }
    }, [sites, users, reviews, favorites]);

    // Vérifier si l'utilisateur est admin et charger les données initiales
    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
            return;
        }
        fetchData();
    }, [user, navigate, fetchData]);

    // Mettre à jour les statistiques lorsque les données changent
    useEffect(() => {
        if (sites.length > 0 || users.length > 0) {
            fetchDashboardStats();
        }
    }, [sites, users, fetchDashboardStats]);

    // Données de test pour les graphiques
    const getSitesByTypeData = useCallback(() => {
        return siteTypes.map(type => ({
            name: type.libele,
            value: Math.floor(Math.random() * 20) + 5,
            color: getRandomColor()
        }));
    }, [siteTypes]);

    const getNewUsersByDayData = useCallback(() => {
        return ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => ({
            day,
            count: Math.floor(Math.random() * 20) + 5
        }));
    }, []);

    const getVisitsByRegionData = useCallback(() => {
        return regions.slice(0, 5).map(region => ({
            region: region.nom,
            visits: Math.floor(Math.random() * 200) + 50,
            color: getRandomColor()
        }));
    }, [regions]);

    const getRandomColor = () => {
        const colors = ['#2a6f97', '#468faf', '#00b4d8', '#28a745', '#f77f00', '#6f42c1'];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setError('La taille de l\'image ne doit pas dépasser 10MB');
                return;
            }

            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                setError('Format d\'image non supporté. Utilisez JPG, PNG ou GIF');
                return;
            }

            setSiteForm({ ...siteForm, image: file });
        }
    };

    const handleSiteSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            setUploading(true);
            setError('');
            setSuccess('');

            const formData = new FormData();
            Object.keys(siteForm).forEach(key => {
                if (key === 'image' && siteForm[key]) {
                    formData.append('image', siteForm[key]);
                } else if (siteForm[key] !== null && siteForm[key] !== undefined) {
                    formData.append(key, siteForm[key]);
                }
            });

            if (editingSite) {
                await axios.put(
                    `${process.env.REACT_APP_BACK_URL}/api/admin/sites/${editingSite.id_site}`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
                setSuccess('Site mis à jour avec succès');
            } else {
                await axios.post(
                    `${process.env.REACT_APP_BACK_URL}/api/admin/sites`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
                setSuccess('Site créé avec succès');
            }

            fetchData();
            fetchDashboardStats();
            resetForm();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
        } finally {
            setUploading(false);
        }
    };

    const handleEditSite = (site) => {
        setEditingSite(site);
        setSiteForm({
            nom: site.nom,
            description: site.description,
            type: site.id_type,
            id_region: site.id_region,
            cout_estime: site.cout_estime,
            duree_visite: site.duree_visite,
            latitude: site.latitude,
            longitude: site.longitude,
            image: null
        });
        setShowSiteForm(true);
    };

    const handleDeleteSite = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce site ?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${process.env.REACT_APP_BACK_URL}/api/admin/sites/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Site supprimé avec succès');
            fetchData();
            fetchDashboardStats();
        } catch (err) {
            setError('Erreur lors de la suppression');
        }
    };

    const resetForm = () => {
        setSiteForm({
            nom: '',
            description: '',
            type: '',
            id_region: '',
            cout_estime: '',
            duree_visite: '',
            latitude: '',
            longitude: '',
            image: null
        });
        setEditingSite(null);
        setShowSiteForm(false);
        setError('');
    };

    const sitesByTypeData = useMemo(() => getSitesByTypeData(), [getSitesByTypeData]);
    const newUsersByDayData = useMemo(() => getNewUsersByDayData(), [getNewUsersByDayData]);
    const visitsByRegionData = useMemo(() => getVisitsByRegionData(), [getVisitsByRegionData]);

    if (isLoading) {
        return (
            <div className={styles["admin-loading"]}>
                <div className={styles["loading-spinner"]}></div>
                <p>Chargement de l'interface administrateur...</p>
            </div>
        );
    }

    return (
        <div className={styles["admin-container"]}>
            {/* Header */}
            <header className={styles["admin-header"]}>
                <div className={styles["logo"]}>
                    <img src={logos} alt="Logo MadaTour" />
                    <span>MadaTour Admin</span>
                </div>
                <nav className={styles["admin-nav"]}>
                    <div className={styles["user-info"]}>
                        <i className="fas fa-user-shield"></i>
                        <span>Administrateur</span>
                        <span className={styles["user-email"]}>{user?.email}</span>
                    </div>
                    <button onClick={() => navigate('/')} className={styles["admin-button"]}>
                        <i className="fas fa-home"></i> Site public
                    </button>
                    <button onClick={handleLogout} className={styles["logout-button"]}>
                        <i className="fas fa-sign-out-alt"></i> Déconnexion
                    </button>
                </nav>
            </header>

            <div className={styles["admin-main"]}>
                {/* Sidebar */}
                <aside className={clsx(styles["admin-sidebar"], styles["sticky-sidebar"])}>
                    <div className={styles["admin-profile"]}>
                        <div className={styles["admin-avatar"]}>
                            <i className="fas fa-user-cog"></i>
                        </div>
                        <h3>Panel Admin</h3>
                        <p>Gestion du contenu</p>
                        <div className={styles["profile-stats"]}>
                            <span><i className="fas fa-users"></i> {users.length} utilisateurs</span>
                            <span><i className="fas fa-map-marker-alt"></i> {sites.length} sites</span>
                        </div>
                    </div>

                    <nav className={styles["admin-menu"]}>
                        <button
                            className={clsx(styles['menu-item'], { [styles['active']]: activeTab === 'dashboard' })}
                            onClick={() => setActiveTab('dashboard')}
                        >
                            <i className="fas fa-tachometer-alt"></i> Tableau de bord
                        </button>
                        <button
                            className={clsx(styles['menu-item'], { [styles['active']]: activeTab === 'sites' })}
                            onClick={() => setActiveTab('sites')}
                        >
                            <i className="fas fa-map-marked-alt"></i> Sites touristiques
                        </button>
                        <button
                            className={clsx(styles['menu-item'], { [styles['active']]: activeTab === 'users' })}
                            onClick={() => setActiveTab('users')}
                        >
                            <i className="fas fa-users"></i> Utilisateurs
                        </button>
                        <button
                            className={clsx(styles['menu-item'], { [styles['active']]: activeTab === 'stats' })}
                            onClick={() => setActiveTab('stats')}
                        >
                            <i className="fas fa-chart-bar"></i> Statistiques
                        </button>
                        <button
                            className={clsx(styles['menu-item'], { [styles['active']]: activeTab === 'analytics' })}
                            onClick={() => setActiveTab('analytics')}
                        >
                            <i className="fas fa-chart-pie"></i> Analytics
                        </button>
                    </nav>

                    {/* Quick Stats Sidebar */}
                    <div className={styles["sidebar-stats"]}>
                        <h4>Statistiques rapides</h4>
                        <div className={styles["stat-item"]}>
                            <span>Sites ce mois</span>
                            <span className={styles["stat-value"]}>{dashboardStats.sitesThisMonth}</span>
                        </div>
                        <div className={styles["stat-item"]}>
                            <span>Utilisateurs actifs</span>
                            <span className={styles["stat-value"]}>{dashboardStats.activeUsers}</span>
                        </div>
                        <div className={styles["stat-item"]}>
                            <span>Note moyenne</span>
                            <span className={styles["stat-value"]}>{dashboardStats.avgRating}/5</span>
                        </div>
                    </div>
                </aside>

                {/* Content Area */}
                <section className={styles["admin-content"]}>
                    <div className={styles["admin-header-section"]}>
                        <h1>
                            {activeTab === 'dashboard' && <><i className="fas fa-tachometer-alt"></i> Tableau de bord</>}
                            {activeTab === 'sites' && <><i className="fas fa-map-marked-alt"></i> Gestion des sites</>}
                            {activeTab === 'users' && <><i className="fas fa-users"></i> Gestion des utilisateurs</>}
                            {activeTab === 'stats' && <><i className="fas fa-chart-bar"></i> Statistiques détaillées</>}
                            {activeTab === 'analytics' && <><i className="fas fa-chart-pie"></i> Analytics avancés</>}
                        </h1>

                        {activeTab === 'sites' && (
                            <button
                                className={styles["add-button"]}
                                onClick={() => setShowSiteForm(true)}
                            >
                                <i className="fas fa-plus"></i> Ajouter un site
                            </button>
                        )}
                    </div>

                    {/* Messages d'alerte */}
                    {error && (
                        <div className={styles["admin-error"]}>
                            <i className="fas fa-exclamation-circle"></i>
                            {error}
                            <button onClick={() => setError('')} className={styles["close-alert"]}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    )}

                    {success && (
                        <div className={styles["admin-success"]}>
                            <i className="fas fa-check-circle"></i>
                            {success}
                            <button onClick={() => setSuccess('')} className={styles["close-alert"]}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    )}

                    {/* Formulaire d'ajout/modification de site */}
                    {showSiteForm && (
                        <div className={styles["site-form-modal"]}>
                            <div className={styles["site-form-content"]}>
                                <div className={styles["form-header"]}>
                                    <h2>{editingSite ? 'Modifier le site' : 'Ajouter un nouveau site'}</h2>
                                    <button onClick={resetForm} className={styles["close-form"]}>
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>

                                <form onSubmit={handleSiteSubmit}>
                                    <div className={styles["form-row"]}>
                                        <div className={styles["form-group"]}>
                                            <label>Nom du site *</label>
                                            <input
                                                type="text"
                                                value={siteForm.nom}
                                                onChange={(e) => setSiteForm({ ...siteForm, nom: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className={styles["form-group"]}>
                                            <label>Type *</label>
                                            <select
                                                value={siteForm.type}
                                                onChange={(e) => setSiteForm({ ...siteForm, type: e.target.value })}
                                                required
                                            >
                                                <option value="">Sélectionner un type</option>
                                                {siteTypes.map(type => (
                                                    <option key={type.id_type} value={type.id_type}>{type.libele}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className={styles["form-group"]}>
                                        <label>Description *</label>
                                        <textarea
                                            value={siteForm.description}
                                            onChange={(e) => setSiteForm({ ...siteForm, description: e.target.value })}
                                            required
                                            rows="4"
                                        ></textarea>
                                    </div>

                                    <div className={styles["form-row"]}>
                                        <div className={styles["form-group"]}>
                                            <label>Région *</label>
                                            <select
                                                value={siteForm.id_region}
                                                onChange={(e) => setSiteForm({ ...siteForm, id_region: e.target.value })}
                                                required
                                            >
                                                <option value="">Sélectionner une région</option>
                                                {regions.map(region => (
                                                    <option key={region.id_region} value={region.id_region}>
                                                        {region.nom}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className={styles["form-group"]}>
                                            <label>Coût estimé (€) *</label>
                                            <input
                                                type="number"
                                                value={siteForm.cout_estime}
                                                onChange={(e) => setSiteForm({ ...siteForm, cout_estime: e.target.value })}
                                                required
                                                min="0"
                                            />
                                        </div>
                                    </div>

                                    <div className={styles["form-row"]}>
                                        <div className={styles["form-group"]}>
                                            <label>Durée de visite</label>
                                            <input
                                                type="text"
                                                value={siteForm.duree_visite}
                                                onChange={(e) => setSiteForm({ ...siteForm, duree_visite: e.target.value })}
                                                placeholder="Ex: 2-3 heures, 1 journée"
                                            />
                                        </div>

                                        <div className={styles["form-group"]}>
                                            <label>Latitude</label>
                                            <input
                                                type="text"
                                                value={siteForm.latitude}
                                                onChange={(e) => setSiteForm({ ...siteForm, latitude: e.target.value })}
                                            />
                                        </div>

                                        <div className={styles["form-group"]}>
                                            <label>Longitude</label>
                                            <input
                                                type="text"
                                                value={siteForm.longitude}
                                                onChange={(e) => setSiteForm({ ...siteForm, longitude: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles["form-group"]}>
                                        <label>Image du site</label>
                                        <div className={styles["file-upload"]}>
                                            <input
                                                type="file"
                                                id="site-image"
                                                accept=".jpg,.jpeg,.png,.gif"
                                                onChange={handleImageChange}
                                            />
                                            <label htmlFor="site-image" className={styles["upload-btn"]}>
                                                <i className="fas fa-upload"></i>
                                                {siteForm.image ? siteForm.image.name : 'Choisir une image'}
                                            </label>
                                        </div>
                                        <small>Formats acceptés: JPG, PNG, GIF (max 10MB)</small>
                                        {editingSite && siteForm.image === null && (
                                            <div className={styles["current-image"]}>
                                                <p>Image actuelle:</p>
                                                <img
                                                    src={`${process.env.REACT_APP_BACK_URL}${editingSite.image}`}
                                                    alt={editingSite.nom}
                                                    className={styles["preview-image"]}
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles["form-actions"]}>
                                        <button type="button" onClick={resetForm} className={styles["cancel-button"]}>
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            className={styles["save-button"]}
                                            disabled={uploading}
                                        >
                                            {uploading ? (
                                                <><i className="fas fa-spinner fa-spin"></i> Chargement...</>
                                            ) : (
                                                editingSite ? 'Mettre à jour' : 'Créer le site'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Contenu des onglets */}
                    {activeTab === 'dashboard' && (
                        <div className={styles["dashboard-overview"]}>
                            {/* Statistiques principales */}
                            <div className={styles["stats-grid"]}>
                                <StatCard
                                    icon="fas fa-map-marked-alt"
                                    value={dashboardStats.totalSites}
                                    label="Sites touristiques"
                                    trend={<><i className="fas fa-arrow-up"></i> +{dashboardStats.sitesThisMonth} ce mois</>}
                                    type="primary"
                                />

                                <StatCard
                                    icon="fas fa-users"
                                    value={dashboardStats.totalUsers}
                                    label="Utilisateurs"
                                    trend={<><i className="fas fa-user-check"></i> {dashboardStats.activeUsers} actifs</>}
                                    type="success"
                                />

                                <StatCard
                                    icon="fas fa-star"
                                    value={dashboardStats.totalReviews}
                                    label="Avis publiés"
                                    trend={<><i className="fas fa-chart-line"></i> {dashboardStats.avgRating}/5</>}
                                    type="warning"
                                />

                                <StatCard
                                    icon="fas fa-heart"
                                    value={dashboardStats.totalFavorites}
                                    label="Favoris"
                                    trend={<><i className="fas fa-arrow-up"></i> +12% cette semaine</>}
                                    type="danger"
                                />
                            </div>

                            {/* Graphiques rapides */}
                            <div className={styles["quick-charts"]}>
                                <div className={styles["chart-card"]}>
                                    <h3><i className="fas fa-map-marked-alt"></i> Sites par type</h3>
                                    <div className={styles["chart-container"]}>
                                        <SimplePieChart
                                            data={sitesByTypeData}
                                            title="Répartition des sites par type"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sites' && (
                        <div className={styles["sites-management"]}>
                            <div className={styles["table-container"]}>
                                <table className={styles["admin-table"]}>
                                    <thead>
                                        <tr>
                                            <th>Nom</th>
                                            <th>Type</th>
                                            <th>Région</th>
                                            <th>Coût</th>
                                            <th>Durée</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sites.length > 0 ? (
                                            sites.map(site => (
                                                <tr key={site.id_site}>
                                                    <td>
                                                        <div className={styles["site-info"]}>
                                                            {site.image && (
                                                                <img
                                                                    src={`${process.env.REACT_APP_BACK_URL}${site.image}`}
                                                                    alt={site.nom}
                                                                    className={styles["site-thumbnail"]}
                                                                />
                                                            )}
                                                            <span className={styles["site-name"]}>{site.nom}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={styles["type-badge"]}>{site.libele_type}</span>
                                                    </td>
                                                    <td>
                                                        <span className={styles["region-badge"]}>
                                                            {site.libele_region}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={styles["cost-badge"]}>
                                                            <i className="fas fa-euro-sign"></i> {site.cout_estime} €
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={styles["duration-badge"]}>
                                                            <i className="fas fa-clock"></i> {site.duree_visite || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className={styles["action-buttons"]}>
                                                            <button
                                                                onClick={() => navigate(`/site/${site.id_site}`)}
                                                                className={styles["view-button"]}
                                                                title="Voir"
                                                            >
                                                                <i className="fas fa-eye"></i>
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditSite(site)}
                                                                className={styles["edit-button"]}
                                                                title="Modifier"
                                                            >
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSite(site.id_site)}
                                                                className={styles["delete-button"]}
                                                                title="Supprimer"
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className={styles["no-data"]}>
                                                    <i className="fas fa-inbox"></i>
                                                    <p>Aucun site touristique enregistré</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className={styles["users-management"]}>
                            <div className={styles["table-container"]}>
                                <table className={styles["admin-table"]}>
                                    <thead>
                                        <tr>
                                            <th>Nom</th>
                                            <th>Email</th>
                                            <th>Rôle</th>
                                            <th>Date d'inscription</th>
                                            <th>Statut</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.length > 0 ? (
                                            users.map(user => (
                                                <tr key={user.id_user}>
                                                    <td>
                                                        <div className={styles["user-info"]}>
                                                            <div className={styles["user-avatar"]}>
                                                                <i className="fas fa-user"></i>
                                                            </div>
                                                            <span>{user.nom}</span>
                                                        </div>
                                                    </td>
                                                    <td>{user.email}</td>
                                                    <td>
                                                        <span className={clsx(styles['role-badge'], user.role ? styles[user.role] : '')}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td>{new Date(user.date_inscription).toLocaleDateString()}</td>
                                                    <td>
                                                        <span className={clsx(styles['status-badge'], user.actif ? styles['active'] : styles['inactive'])}>
                                                            {user.actif ? 'Actif' : 'Inactif'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className={styles["action-buttons"]}>
                                                            <button
                                                                className={styles["message-button"]}
                                                                title="Envoyer message"
                                                            >
                                                                <i className="fas fa-envelope"></i>
                                                            </button>
                                                            <button
                                                                className={styles["edit-button"]}
                                                                title="Modifier"
                                                            >
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className={styles["no-data"]}>
                                                    <i className="fas fa-users-slash"></i>
                                                    <p>Aucun utilisateur enregistré</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'stats' && (
                        <div className={styles["stats-container"]} ref={statsRef}>
                            {/* Cartes de statistiques */}
                            <div className={styles["stats-cards"]}>
                                <div className={styles["stat-card"]}>
                                    <div className={styles["stat-icon"]}>
                                        <i className="fas fa-map-marked-alt"></i>
                                    </div>
                                    <div className={styles["stat-info"]}>
                                        <h3>{sites.length}</h3>
                                        <p>Sites touristiques</p>
                                        <div className={styles["stat-detail"]}>
                                            <span>+{dashboardStats.sitesThisMonth} ce mois</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles["stat-card"]}>
                                    <div className={styles["stat-icon"]}>
                                        <i className="fas fa-users"></i>
                                    </div>
                                    <div className={styles["stat-info"]}>
                                        <h3>{users.length}</h3>
                                        <p>Utilisateurs</p>
                                        <div className={styles["stat-detail"]}>
                                            <span>{dashboardStats.activeUsers} actifs</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles["stat-card"]}>
                                    <div className={styles["stat-icon"]}>
                                        <i className="fas fa-star"></i>
                                    </div>
                                    <div className={styles["stat-info"]}>
                                        <h3>{reviews.length}</h3>
                                        <p>Avis publiés</p>
                                        <div className={styles["stat-detail"]}>
                                            <span>Moyenne: {dashboardStats.avgRating}/5</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles["stat-card"]}>
                                    <div className={styles["stat-icon"]}>
                                        <i className="fas fa-heart"></i>
                                    </div>
                                    <div className={styles["stat-info"]}>
                                        <h3>{favorites.length}</h3>
                                        <p>Favoris</p>
                                        <div className={styles["stat-detail"]}>
                                            <span>+12% cette semaine</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Graphiques détaillés */}
                            <div className={styles["charts-section"]}>
                                <div className={styles["chart-card"]}>
                                    <h3><i className="fas fa-chart-pie"></i> Répartition des sites par type</h3>
                                    <div className={styles["chart-container"]}>
                                        <SimplePieChart
                                            data={sitesByTypeData}
                                            title="Sites par type"
                                        />
                                    </div>
                                </div>

                                <div className={styles["chart-card"]}>
                                    <h3><i className="fas fa-globe-africa"></i> Visites par région</h3>
                                    <div className={styles["chart-container"]}>
                                        <SimpleBarChart
                                            data={visitsByRegionData}
                                            title="Top régions visitées"
                                        />
                                    </div>
                                </div>

                                <div className={styles["chart-card"]}>
                                    <h3><i className="fas fa-chart-area"></i> Vue d'ensemble</h3>
                                    <div className={styles["summary-stats"]}>
                                        <div className={styles["summary-item"]}>
                                            <i className="fas fa-calendar"></i>
                                            <div>
                                                <h4>Activité ce mois</h4>
                                                <p>{dashboardStats.sitesThisMonth} nouveaux sites</p>
                                            </div>
                                        </div>
                                        <div className={styles["summary-item"]}>
                                            <i className="fas fa-user-plus"></i>
                                            <div>
                                                <h4>Nouveaux utilisateurs</h4>
                                                <p>+15% par rapport au mois dernier</p>
                                            </div>
                                        </div>
                                        <div className={styles["summary-item"]}>
                                            <i className="fas fa-euro-sign"></i>
                                            <div>
                                                <h4>Revenu estimé</h4>
                                                <p>{dashboardStats.revenueEstimate.toFixed(2)} €</p>
                                            </div>
                                        </div>
                                        <div className={styles["summary-item"]}>
                                            <i className="fas fa-tachometer-alt"></i>
                                            <div>
                                                <h4>Taux d'engagement</h4>
                                                <p>68% d'utilisateurs actifs</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div className={styles["analytics-container"]}>
                            <div className={styles["analytics-header"]}>
                                <h2>Analytics avancés</h2>
                                <div className={styles["date-range"]}>
                                    <select defaultValue="30days">
                                        <option value="7days">7 derniers jours</option>
                                        <option value="30days">30 derniers jours</option>
                                        <option value="90days">90 derniers jours</option>
                                        <option value="1year">1 an</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles["analytics-grid"]}>
                                <div className={styles["analytics-card"]}>
                                    <h3><i className="fas fa-chart-line"></i> Tendance d'engagement</h3>
                                    <div className={styles["chart-container"]}>
                                        <SimpleLineChart
                                            data={newUsersByDayData}
                                            title="Tendance d'engagement"
                                        />
                                    </div>
                                </div>

                                <div className={styles["analytics-card"]}>
                                    <h3><i className="fas fa-map"></i> Top 5 régions</h3>
                                    <div className={styles["regions-list"]}>
                                        {visitsByRegionData.map((region, index) => (
                                            <div key={index} className={styles["region-item"]}>
                                                <div className={styles["region-info"]}>
                                                    <span className={styles["region-name"]}>{region.region}</span>
                                                    <div className={styles["progress-bar"]}>
                                                        <div
                                                            className={styles["progress-fill"]}
                                                            style={{
                                                                width: `${(region.visits / 300) * 100}%`,
                                                                backgroundColor: region.color
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <span className={styles["region-count"]}>{region.visits} visites</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles["analytics-card"]}>
                                    <h3><i className="fas fa-star"></i> Performance des sites</h3>
                                    <div className={styles["sites-performance"]}>
                                        {sites.slice(0, 5).map((site) => (
                                            <div key={site.id_site} className={styles["performance-item"]}>
                                                <span className={styles["site-name"]}>{site.nom}</span>
                                                <div className={styles["performance-stats"]}>
                                                    <span className={styles["stat"]}>
                                                        <i className="fas fa-eye"></i> {Math.floor(Math.random() * 1000) + 100}
                                                    </span>
                                                    <span className={styles["stat"]}>
                                                        <i className="fas fa-heart"></i> {Math.floor(Math.random() * 50) + 10}
                                                    </span>
                                                    <span className={styles["rating"]}>
                                                        {((Math.random() * 2) + 3).toFixed(1)} <i className="fas fa-star"></i>
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles["analytics-card"]}>
                                    <h3><i className="fas fa-chart-bar"></i> Statistiques avancées</h3>
                                    <div className={styles["advanced-stats"]}>
                                        <div className={styles["advanced-stat"]}>
                                            <div className={styles["stat-header"]}>
                                                <i className="fas fa-retweet"></i>
                                                <span>Taux de conversion</span>
                                            </div>
                                            <div className={styles["stat-value"]}>2.3%</div>
                                            <div className={styles["stat-progress"]}>
                                                <div className={styles["progress-bar"]}>
                                                    <div className={styles["progress-fill"]} style={{ width: '23%' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles["advanced-stat"]}>
                                            <div className={styles["stat-header"]}>
                                                <i className="fas fa-clock"></i>
                                                <span>Temps moyen</span>
                                            </div>
                                            <div className={styles["stat-value"]}>4m 32s</div>
                                            <div className={styles["stat-progress"]}>
                                                <div className={styles["progress-bar"]}>
                                                    <div className={styles["progress-fill"]} style={{ width: '65%' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles["advanced-stat"]}>
                                            <div className={styles["stat-header"]}>
                                                <i className="fas fa-share-alt"></i>
                                                <span>Partages</span>
                                            </div>
                                            <div className={styles["stat-value"]}>248</div>
                                            <div className={styles["stat-progress"]}>
                                                <div className={styles["progress-bar"]}>
                                                    <div className={styles["progress-fill"]} style={{ width: '48%' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles["advanced-stat"]}>
                                            <div className={styles["stat-header"]}>
                                                <i className="fas fa-comments"></i>
                                                <span>Commentaires</span>
                                            </div>
                                            <div className={styles["stat-value"]}>156</div>
                                            <div className={styles["stat-progress"]}>
                                                <div className={styles["progress-bar"]}>
                                                    <div className={styles["progress-fill"]} style={{ width: '78%' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Admin;