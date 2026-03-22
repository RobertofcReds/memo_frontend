import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import styles from './css/Favorites.module.css';
import clsx from 'clsx';
import logos from '../images/logo-site4.png';
import axios from 'axios';
import { useNotification } from '../components/Notification/NotificationProvider';
import { useAuth } from '../context/AuthContext';

// Composant IA de recommandation (chargement différé)
const RecommendationAI = React.lazy(() => import('../components/recommendation/RecommendationAI'));

// Données pour les animations des favoris
const favoriteAnimations = {
    heartParticles: ['❤️', '💖', '💗', '💓', '💞', '💕', '💘', '💝', '✨', '🌟'],
    floatingElements: [
        { type: 'heart', emoji: '❤️', size: 'small' },
        { type: 'heart', emoji: '💖', size: 'medium' },
        { type: 'heart', emoji: '💗', size: 'large' },
        { type: 'star', emoji: '⭐', size: 'small' },
        { type: 'star', emoji: '🌟', size: 'medium' },
        { type: 'sparkle', emoji: '✨', size: 'small' },
    ]
};

// Témoignages pour les favoris
const favoritesTestimonials = [
    {
        id: 1,
        name: 'Marie L.',
        comment: "J'adore la fonction favoris ! Je peux sauvegarder tous mes coups de cœur et les retrouver facilement pour planifier mon voyage.",
        avatar: '👩',
        rating: 5,
        location: 'Paris, France',
        date: 'Décembre 2024'
    },
    {
        id: 2,
        name: 'Pierre D.',
        comment: "La séparation entre sites et régions est très pratique. Je peux organiser mes découvertes par catégorie.",
        avatar: '👨',
        rating: 4,
        location: 'Lyon, France',
        date: 'Novembre 2024'
    },
    {
        id: 3,
        name: 'Sophie M.',
        comment: "Les animations rendent l'expérience vraiment agréable. C'est un plaisir de consulter mes favoris !",
        avatar: '👩',
        rating: 5,
        location: 'Marseille, France',
        date: 'Octobre 2024'
    }
];

const Favorites = () => {
    const [allFavorites, setAllFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [removingId, setRemovingId] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [shareModal, setShareModal] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [siteActiveFilter, setSiteActiveFilter] = useState('all');
    const [regionActiveFilter, setRegionActiveFilter] = useState('all');
    const [showRecommendationAI, setShowRecommendationAI] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [heartParticles, setHeartParticles] = useState([]);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
    const [favoritesStats, setFavoritesStats] = useState({
        total: 0,
        sites: 0,
        regions: 0,
        categories: 0
    });

    const {user, logout} = useAuth();

    const navigate = useNavigate();
    const testimonialsRef = useRef(null);
    const autoScrollRef = useRef(null);

    // Utilisation du hook Notification
    const { showNotification } = useNotification();

    const token = localStorage.getItem('token');
    const userId = user.id;

    // Vérifier si l'utilisateur est connecté
    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);

        // Gestion du bouton retour en haut
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Défilement automatique des témoignages
    useEffect(() => {
        const startAutoScroll = () => {
            if (autoScrollRef.current) {
                clearInterval(autoScrollRef.current);
            }

            autoScrollRef.current = setInterval(() => {
                if (testimonialsRef.current) {
                    const container = testimonialsRef.current;
                    const cardWidth = 320;
                    const maxScroll = container.scrollWidth - container.clientWidth;

                    if (container.scrollLeft >= maxScroll - 10) {
                        container.scrollTo({
                            left: 0,
                            behavior: 'smooth'
                        });
                        setCurrentTestimonialIndex(0);
                    } else {
                        const newScrollLeft = container.scrollLeft + cardWidth;
                        container.scrollTo({
                            left: newScrollLeft,
                            behavior: 'smooth'
                        });
                        setCurrentTestimonialIndex(prev =>
                            (prev + 1) % Math.ceil(container.scrollWidth / cardWidth)
                        );
                    }
                }
            }, 4000);
        };

        startAutoScroll();

        return () => {
            if (autoScrollRef.current) {
                clearInterval(autoScrollRef.current);
            }
        };
    }, []);

    // Fonction pour créer des particules de cœur
    const createHeartParticle = () => {
        const emoji = favoriteAnimations.heartParticles[
            Math.floor(Math.random() * favoriteAnimations.heartParticles.length)
        ];

        return {
            id: Date.now() + Math.random(),
            emoji,
            x: Math.random() * 100,
            y: 100,
            size: Math.random() * 20 + 10,
            speed: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.5
        };
    };

    // Fonction pour lancer des particules
    const launchHeartParticles = (count = 5) => {
        const newParticles = [];
        for (let i = 0; i < count; i++) {
            newParticles.push(createHeartParticle());
        }
        setHeartParticles(prev => [...prev, ...newParticles]);

        // Nettoyer les particules après l'animation
        setTimeout(() => {
            setHeartParticles(prev => prev.slice(count));
        }, 2000);
    };

    // Fonction pour afficher une boîte de confirmation
    const showConfirmDialog = (message, onConfirm, onCancel = () => { }) => {
        setConfirmDialog({
            message,
            onConfirm: () => {
                onConfirm();
                setConfirmDialog(null);
            },
            onCancel: () => {
                onCancel();
                setConfirmDialog(null);
            }
        });
    };

    // Fonction pour partager un site
    const handleShare = (item) => {
        if (item.entite_type === 'site') {
            setShareModal({
                name: item.nom,
                id: item.entite_id,
                image: item.image,
                region: item.nom_region,
                type: 'site'
            });
        } else {
            setShareModal({
                name: item.nom,
                id: item.entite_id,
                image: item.image,
                region: item.nom_province,
                type: 'region'
            });
        }
    };

    // Fonction pour copier le lien de partage
    const copyShareLink = () => {
        if (shareModal) {
            const shareUrl = shareModal.type === 'site'
                ? `${window.location.origin}/site/${shareModal.id}`
                : `${window.location.origin}/region/${shareModal.id}`;

            navigator.clipboard.writeText(shareUrl)
                .then(() => {
                    showNotification('Lien copié dans le presse-papier !', 'success');
                    setShareModal(null);
                })
                .catch(err => {
                    console.error('Erreur lors de la copie:', err);
                    showNotification('Erreur lors de la copie du lien', 'error');
                });
        }
    };

    // Fonction pour partager sur les réseaux sociaux
    const shareOnSocialMedia = (platform) => {
        if (!shareModal) return;

        const shareUrl = shareModal.type === 'site'
            ? `${window.location.origin}/site/${shareModal.id}`
            : `${window.location.origin}/region/${shareModal.id}`;

        const shareText = `Découvrez ${shareModal.name} ${shareModal.type === 'site' ? 'à' : 'dans'} ${shareModal.region} sur MadaTour !`;

        let shareLink = '';

        switch (platform) {
            case 'facebook':
                shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                break;
            case 'twitter':
                shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
                break;
            case 'whatsapp':
                shareLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
                break;
            case 'email':
                shareLink = `mailto:?subject=${encodeURIComponent(shareModal.name)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
                break;
            default:
                return;
        }

        window.open(shareLink, '_blank');
        setShareModal(null);
    };

    // Fonction pour ouvrir le modal IA
    const handleOpenAI = () => {
        window.scrollTo(0, 0);
        requestAnimationFrame(() => {
            setShowRecommendationAI(true);
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');
        });
    };

    // Fonction pour fermer le modal IA
    const handleCloseAI = () => {
        setShowRecommendationAI(false);
        document.body.style.overflow = 'auto';
        document.body.classList.remove('modal-open');
    };

    // Récupérer tous les favoris
    useEffect(() => {
        fetchAllFavorites();
    }, []);

    const fetchAllFavorites = async () => {
        try {
            // Utilisez la route correcte pour tous les favoris
            const response = await axios.get(`${process.env.REACT_APP_BACK_URL}/api/user/favorites-all/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('📥 Tous les favoris reçus:', response.data);
            setAllFavorites(response.data);

            // Calculer les statistiques
            const sites = response.data.filter(item => item.entite_type === 'site');
            const regions = response.data.filter(item => item.entite_type === 'region');
            const siteTypes = [...new Set(sites.map(item => item.type).filter(Boolean))];
            const regionTypes = [...new Set(regions.map(item => item.type).filter(Boolean))];

            setFavoritesStats({
                total: response.data.length,
                sites: sites.length,
                regions: regions.length,
                categories: siteTypes.length + regionTypes.length
            });

        } catch (error) {
            console.error('Erreur:', error);
            showNotification('Erreur lors du chargement des favoris', 'error');

            // Fallback: charger séparément sites et régions
            try {
                // Charger les sites favoris
                const sitesResponse = await axios.get(`${process.env.REACT_APP_BACK_URL}/api/user/favorites/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Charger les régions favorites
                const regionsResponse = await axios.get(`${process.env.REACT_APP_BACK_URL}/api/user/favorites-regions/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const sites = sitesResponse.data.map(item => ({ ...item, entite_type: 'site' }));
                const regions = regionsResponse.data.map(item => ({ ...item, entite_type: 'region' }));

                const allFavs = [...sites, ...regions];
                setAllFavorites(allFavs);

                // Calculer les statistiques pour le fallback
                const siteTypes = [...new Set(sites.map(item => item.type).filter(Boolean))];
                const regionTypes = [...new Set(regions.map(item => item.type).filter(Boolean))];

                setFavoritesStats({
                    total: allFavs.length,
                    sites: sites.length,
                    regions: regions.length,
                    categories: siteTypes.length + regionTypes.length
                });

            } catch (fallbackError) {
                console.error('Erreur fallback:', fallbackError);
                showNotification('Impossible de charger vos favoris', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const removeFavorite = async (favoriteId, entiteType, entiteId) => {
        showConfirmDialog(
            `Êtes-vous sûr de vouloir retirer cet élément de vos favoris ?`,
            async () => {
                console.log('🔴 Tentative suppression - favoriteId:', favoriteId, 'type:', entiteType);
                setRemovingId(favoriteId);

                try {
                    let response;

                    if (entiteType === 'site') {
                        // Supprimer un site des favoris
                        response = await axios.delete(`${process.env.REACT_APP_BACK_URL}/api/user/favorites/${userId}/${entiteId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                    } else if (entiteType === 'region') {
                        // Supprimer une région des favoris
                        response = await axios.delete(`${process.env.REACT_APP_BACK_URL}/api/user/favorites-regions/${userId}/${entiteId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                    } else {
                        // Route générique
                        response = await axios.delete(`${process.env.REACT_APP_BACK_URL}/api/user/favorite/${userId}/${favoriteId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                    }

                    console.log('✅ Réponse suppression:', response.data);

                    // Mettre à jour localement sans recharger
                    setAllFavorites(prev => prev.filter(item => item.id !== favoriteId));

                    // Mettre à jour les statistiques
                    setFavoritesStats(prev => ({
                        ...prev,
                        total: prev.total - 1,
                        [entiteType === 'site' ? 'sites' : 'regions']: prev[entiteType === 'site' ? 'sites' : 'regions'] - 1
                    }));

                    // Mettre à jour le localStorage si c'est une région
                    if (entiteType === 'region') {
                        const currentFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
                        const updatedFavorites = currentFavorites.filter(id => id !== parseInt(entiteId));
                        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
                    }

                    showNotification('Élément retiré des favoris avec succès', 'success');
                    launchHeartParticles(3); // Lancer des particules pour la suppression

                } catch (error) {
                    console.error('❌ Erreur suppression:', error.response?.data || error.message);
                    showNotification('Erreur lors de la suppression du favori', 'error');
                } finally {
                    setRemovingId(null);
                }
            },
            () => {
                console.log('Suppression annulée');
                showNotification('Suppression annulée', 'info');
            }
        );
    };

    // Défilement manuel des témoignages
    const scrollTestimonials = (direction) => {
        if (testimonialsRef.current) {
            const scrollAmount = 320;
            testimonialsRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });

            if (direction === 'right') {
                setCurrentTestimonialIndex(prev =>
                    (prev + 1) % Math.ceil(testimonialsRef.current.scrollWidth / scrollAmount)
                );
            } else {
                setCurrentTestimonialIndex(prev =>
                    prev === 0 ? Math.ceil(testimonialsRef.current.scrollWidth / scrollAmount) - 1 : prev - 1
                );
            }
        }
    };

    // Fonction pour retourner en haut de la page
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // Générer les étoiles de notation
    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <i
                    key={`full-${i}`}
                    className={`fas fa-star ${styles.starAnimation}`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                ></i>
            );
        }

        if (hasHalfStar) {
            stars.push(
                <i
                    key="half"
                    className={`fas fa-star-half-alt ${styles.starAnimation}`}
                    style={{ animationDelay: `${fullStars * 0.1}s` }}
                ></i>
            );
        }

        const emptyStars = 5 - stars.length;
        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <i
                    key={`empty-${i}`}
                    className={`far fa-star ${styles.starAnimation}`}
                    style={{ animationDelay: `${(fullStars + (hasHalfStar ? 1 : 0) + i) * 0.1}s` }}
                ></i>
            );
        }

        return stars;
    };

    // Filtrer les sites et régions
    const siteFavorites = allFavorites.filter(item => item.entite_type === 'site');
    const regionFavorites = allFavorites.filter(item => item.entite_type === 'region');

    // Filtrer les sites selon la catégorie active
    const filteredSiteFavorites = siteActiveFilter === 'all'
        ? siteFavorites
        : siteFavorites.filter(item => item.type === siteActiveFilter);

    // Filtrer les régions selon la catégorie active
    const filteredRegionFavorites = regionActiveFilter === 'all'
        ? regionFavorites
        : regionFavorites.filter(item => item.type === regionActiveFilter);

    // Types uniques pour les filtres
    const siteTypes = [...new Set(siteFavorites.map(item => item.type).filter(Boolean))];
    const regionTypes = [...new Set(regionFavorites.map(item => item.type).filter(Boolean))];

    // Formater le prix selon la devise de l'utilisateur
    const formatPrice = (price) => {
        const currency = localStorage.getItem('userCurrency') || 'EUR';

        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(price || 0);
    };

    // Formater la date
    const formatDate = (dateString) => {
        if (!dateString) return 'Date inconnue';

        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className={styles["loading-container"]}>
                <div className={styles["loading-spinner"]}></div>
                <p>Chargement de vos favoris...</p>
            </div>
        );
    }

    return (
        <div className={styles["favorites-page"]}>
            {/* Particules de cœur animées */}
            {heartParticles.map(particle => (
                <div
                    key={particle.id}
                    className={styles["heart-particle"]}
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        fontSize: `${particle.size}px`,
                        opacity: particle.opacity,
                        transform: `translateY(-${particle.speed * 100}px) rotate(${Math.random() * 360}deg)`
                    }}
                >
                    {particle.emoji}
                </div>
            ))}

            {/* Assistant IA de recommandation */}
            {showRecommendationAI && (
                <React.Suspense fallback={<div className={styles["loading-ai"]}>Chargement de l'assistant IA...</div>}>
                    <RecommendationAI onClose={handleCloseAI} />
                </React.Suspense>
            )}

            {/* Boîte de confirmation */}
            {confirmDialog && (
                <div className={styles["confirm-overlay"]}>
                    <div className={styles["confirm-dialog"]}>
                        <div className={styles["confirm-header"]}>
                            <i className="fas fa-question-circle"></i>
                            <h3>Confirmation</h3>
                        </div>
                        <div className={styles["confirm-body"]}>
                            <p>{confirmDialog.message}</p>
                        </div>
                        <div className={styles["confirm-actions"]}>
                            <button
                                className={styles["confirm-button"]}
                                onClick={confirmDialog.onConfirm}
                            >
                                <i className="fas fa-check"></i> Oui, supprimer
                            </button>
                            <button
                                className={styles["cancel-button"]}
                                onClick={confirmDialog.onCancel}
                            >
                                <i className="fas fa-times"></i> Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de partage */}
            {shareModal && (
                <div className={styles["share-overlay"]}>
                    <div className={styles["share-dialog"]}>
                        <div className={styles["share-header"]}>
                            <i className="fas fa-share-alt"></i>
                            <h3>Partager {shareModal.type === 'site' ? 'ce site' : 'cette région'}</h3>
                            <button
                                className={styles["share-close"]}
                                onClick={() => setShareModal(null)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className={styles["share-body"]}>
                            <div className={styles["share-preview"]}>
                                <img
                                    src={shareModal.image?.startsWith('http') ? shareModal.image : `${process.env.REACT_APP_BACK_URL}${shareModal.image}`}
                                    alt={shareModal.name}
                                    onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80';
                                    }}
                                />
                                <div className={styles["share-preview-info"]}>
                                    <h4>{shareModal.name}</h4>
                                    <p><i className="fas fa-map-marker-alt"></i> {shareModal.region}</p>
                                    <small>{shareModal.type === 'site' ? 'Site touristique' : 'Région'}</small>
                                </div>
                            </div>

                            <div className={styles["share-options"]}>
                                <p className={styles["share-label"]}>Partager via :</p>
                                <div className={styles["share-buttons"]}>
                                    <button
                                        className={styles["share-option-btn"]}
                                        onClick={() => shareOnSocialMedia('facebook')}
                                    >
                                        <i className="fab fa-facebook-f"></i>
                                        <span>Facebook</span>
                                    </button>
                                    <button
                                        className={styles["share-option-btn"]}
                                        onClick={() => shareOnSocialMedia('twitter')}
                                    >
                                        <i className="fab fa-twitter"></i>
                                        <span>Twitter</span>
                                    </button>
                                    <button
                                        className={styles["share-option-btn"]}
                                        onClick={() => shareOnSocialMedia('whatsapp')}
                                    >
                                        <i className="fab fa-whatsapp"></i>
                                        <span>WhatsApp</span>
                                    </button>
                                    <button
                                        className={styles["share-option-btn"]}
                                        onClick={() => shareOnSocialMedia('email')}
                                    >
                                        <i className="fas fa-envelope"></i>
                                        <span>Email</span>
                                    </button>
                                </div>
                            </div>

                            <div className={styles["share-link"]}>
                                <p className={styles["share-label"]}>Lien direct :</p>
                                <div className={styles["link-container"]}>
                                    <input
                                        type="text"
                                        value={shareModal.type === 'site'
                                            ? `${window.location.origin}/site/${shareModal.id}`
                                            : `${window.location.origin}/region/${shareModal.id}`
                                        }
                                        readOnly
                                        className={styles["link-input"]}
                                    />
                                    <button
                                        className={styles["copy-link-btn"]}
                                        onClick={copyShareLink}
                                    >
                                        <i className="fas fa-copy"></i> Copier
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header amélioré avec animation */}
            <header className={`${styles["header"]} ${styles.animatedHeader}`}>
                <div className={styles["logo-container"]}>
                    <Link to="/" className={styles["logo"]}>
                        <div className={styles["logo-animation"]}>
                            <img src={logos} alt="MadaTour Logo" className={styles["logo-img"]} />
                            <div className={styles["logo-glow"]}></div>
                        </div>
                        <span className={styles["logo-text"]}>
                            Mada<span className={styles["logo-accent"]}>Tour</span>
                        </span>
                    </Link>
                </div>

                <nav className={styles["nav-container"]}>
                    <div className={styles["nav-links"]}>
                        <Link to="/search" className={styles["nav-link"]}>
                            <i className="fas fa-search"></i>
                            Sites
                        </Link>
                        <Link to="/regions" className={styles["nav-link"]}>
                            <i className="fas fa-map-marked-alt"></i>
                            Destinations
                        </Link>
                        <Link to="/activities" className={styles["nav-link"]}>
                            <i className="fas fa-hiking"></i>
                            Activités
                        </Link>
                        <Link to="/favorites" className={`${styles["nav-link"]} ${styles.active}`}>
                            <i className="fas fa-heart"></i>
                            Favoris
                        </Link>
                        <Link to="/blog" className={styles["nav-link"]}>
                            <i className="fas fa-book-open"></i>
                            Conseils
                        </Link>
                    </div>

                    <div className={styles["auth-section"]}>
                        <button
                            className={styles["ai-button"]}
                            onClick={handleOpenAI}
                            title="Assistant IA des favoris"
                        >
                            <i className="fas fa-robot"></i>
                            <span className={styles["ai-tooltip"]}>Assistant IA</span>
                        </button>

                        {isLoggedIn ? (
                            <div className={styles["user-dropdown"]}>
                                <button className={styles["auth-button-on"]}>
                                    <i className="fas fa-user-circle"></i>
                                    <span>Mon compte</span>
                                    <i className="fas fa-chevron-down"></i>
                                </button>
                                <div className={styles["dropdown-menu"]}>
                                    <Link to="/dashboard" className={styles["dropdown-item"]}>
                                        <i className="fas fa-tachometer-alt"></i> Tableau de bord
                                    </Link>
                                    <Link to="/dashboard/reviews" className={styles["dropdown-item"]}>
                                        <i className="fas fa-star"></i> Mes avis
                                    </Link>
                                    <Link to="/dashboard/preferences" className={styles["dropdown-item"]}>
                                        <i className="fas fa-sliders-h"></i> Mes préférences
                                    </Link>
                                    <Link to="/my-trip" className={styles["dropdown-item"]}>
                                        <i className="fas fa-suitcase"></i> Mes voyages
                                    </Link>
                                    <Link to="/dashboard/history" className={styles["dropdown-item"]}>
                                        <i className="fas fa-history"></i> Mes historiques
                                    </Link>
                                    <div className={styles["dropdown-divider"]}></div>
                                    <button
                                        onClick={() => {
                                            logout()
                                            setIsLoggedIn(false);
                                            navigate('/');
                                        }}
                                        className={styles["dropdown-item"]}
                                    >
                                        <i className="fas fa-sign-out-alt"></i> Déconnexion
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className={`${styles["auth-button"]} ${styles["secondary"]}`}>
                                    <i className="fas fa-sign-in-alt"></i>
                                    Connexion
                                </Link>
                                <Link to="/register" className={`${styles["auth-button"]} ${styles["primary"]}`}>
                                    <i className="fas fa-user-plus"></i>
                                    Inscription
                                </Link>
                            </>
                        )}
                    </div>
                </nav>
            </header>

            {/* Main Content */}
            <main className={styles["favorites-main"]}>
                {/* Hero Section spéciale pour les favoris */}
                <section className={styles["favorites-hero"]}>
                    <div className={styles["hero-overlay"]}></div>
                    <div className={styles["hero-slides"]}>
                        <div className={styles["hero-slide"]} style={{
                            backgroundImage: `url('https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`
                        }}></div>
                        <div className={styles["hero-slide"]} style={{
                            backgroundImage: `url('https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')`
                        }}></div>
                        <div className={styles["hero-slide"]} style={{
                            backgroundImage: `url('https://images.unsplash.com/photo-1566438480900-0609be27a4be?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')`
                        }}></div>
                    </div>

                    <div className={styles["hero-content"]}>
                        <h1 className={styles["anime-text"]}>
                            <span className={styles["text-gradient"]}>
                                Mes <span className={styles["text-highlight"]}>Favoris</span>
                            </span>
                        </h1>

                        <p className={styles["hero-subtitle"]}>
                            Retrouvez tous vos coups de cœur en un seul endroit
                        </p>

                        <div className={styles["hero-stats"]}>
                            {[
                                { icon: 'fas fa-heart', label: 'Favoris totaux', value: favoritesStats.total },
                                { icon: 'fas fa-map-marker-alt', label: 'Sites', value: favoritesStats.sites },
                                { icon: 'fas fa-globe-africa', label: 'Régions', value: favoritesStats.regions },
                                { icon: 'fas fa-tags', label: 'Catégories', value: favoritesStats.categories }
                            ].map((stat, index) => (
                                <div
                                    key={index}
                                    className={`${styles["stat-item"]} ${styles["anime-stat"]}`}
                                    style={{ animationDelay: `${index * 0.2}s` }}
                                >
                                    <div className={styles["stat-icon"]}>
                                        <i className={stat.icon}></i>
                                    </div>
                                    <div className={styles["stat-content"]}>
                                        <span className={styles["stat-value"]}>{stat.value}</span>
                                        <span className={styles["stat-label"]}>{stat.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Floating elements spécial favoris */}
                    <div className={styles["floating-elements"]}>
                        {favoriteAnimations.floatingElements.map((element, index) => (
                            <div
                                key={index}
                                className={`${styles["floating-element"]} ${styles[element.type]} ${styles[element.size]}`}
                                style={{
                                    left: `${10 + index * 15}%`,
                                    animationDelay: `${index * 0.5}s`
                                }}
                            >
                                {element.emoji}
                            </div>
                        ))}
                    </div>
                </section>

                <section className={`${styles["favorites-content"]} ${styles["anime-section"]}`}>
                    <div className={styles["favorites-header"]}>
                        {/* Onglets améliorés */}
                        <div className={styles["tabs-container"]}>
                            <div className={styles["tabs"]}>
                                <button
                                    className={clsx(styles["tab"], styles["anime-tab"], {
                                        [styles["active"]]: activeTab === 'all'
                                    })}
                                    onClick={() => setActiveTab('all')}
                                >
                                    <div className={styles["tab-icon-wrapper"]}>
                                        <i className="fas fa-list"></i>
                                        <div className={styles["tab-glow"]}></div>
                                    </div>
                                    <span className={styles["tab-name"]}>Tous</span>
                                    <span className={styles["tab-count"]}>({allFavorites.length})</span>
                                </button>
                                <button
                                    className={clsx(styles["tab"], styles["anime-tab"], {
                                        [styles["active"]]: activeTab === 'sites'
                                    })}
                                    onClick={() => setActiveTab('sites')}
                                >
                                    <div className={styles["tab-icon-wrapper"]}>
                                        <i className="fas fa-map-marker-alt"></i>
                                        <div className={styles["tab-glow"]}></div>
                                    </div>
                                    <span className={styles["tab-name"]}>Sites</span>
                                    <span className={styles["tab-count"]}>({siteFavorites.length})</span>
                                </button>
                                <button
                                    className={clsx(styles["tab"], styles["anime-tab"], {
                                        [styles["active"]]: activeTab === 'regions'
                                    })}
                                    onClick={() => setActiveTab('regions')}
                                >
                                    <div className={styles["tab-icon-wrapper"]}>
                                        <i className="fas fa-globe-africa"></i>
                                        <div className={styles["tab-glow"]}></div>
                                    </div>
                                    <span className={styles["tab-name"]}>Régions</span>
                                    <span className={styles["tab-count"]}>({regionFavorites.length})</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Contenu selon l'onglet actif */}
                    {activeTab === 'all' ? (
                        <>
                            {/* Section Sites */}
                            {siteFavorites.length > 0 && (
                                <div className={`${styles["favorites-section"]} ${styles["anime-section"]}`}>
                                    <div className={styles["section-header"]}>
                                        <div className={styles["section-title"]}>
                                            <div className={styles["section-icon-wrapper"]}>
                                                <i className="fas fa-map-marker-alt"></i>
                                                <div className={styles["icon-glow"]}></div>
                                            </div>
                                            <h2>
                                                <span className={styles["title-anime"]}>
                                                    Mes <span className={styles["title-accent"]}>Sites</span> Favoris
                                                </span>
                                            </h2>
                                            <span className={styles["section-count"]}>{siteFavorites.length}</span>
                                        </div>

                                        {siteTypes.length > 0 && (
                                            <div className={styles["section-filters"]}>
                                                <button
                                                    className={clsx(styles['filter-btn'], styles['anime-filter'], {
                                                        [styles['active']]: siteActiveFilter === 'all'
                                                    })}
                                                    onClick={() => setSiteActiveFilter('all')}
                                                >
                                                    <i className="fas fa-globe"></i>
                                                    Toutes les catégories
                                                </button>
                                                {siteTypes.map((type, index) => (
                                                    <button
                                                        key={`site-${type}`}
                                                        className={clsx(styles['filter-btn'], styles['anime-filter'], {
                                                            [styles['active']]: siteActiveFilter === type
                                                        })}
                                                        onClick={() => setSiteActiveFilter(type)}
                                                        style={{ animationDelay: `${index * 0.1}s` }}
                                                    >
                                                        <i className="fas fa-tag"></i>
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {filteredSiteFavorites.length > 0 ? (
                                        <div className={styles["favorites-grid"]}>
                                            {filteredSiteFavorites.map((item, index) => (
                                                <div
                                                    key={`site-${item.id}`}
                                                    className={`${styles["favorite-card"]} ${styles["anime-card"]}`}
                                                    style={{ animationDelay: `${index * 0.1}s` }}
                                                    onMouseEnter={() => launchHeartParticles(1)}
                                                >
                                                    <div className={styles["card-image"]}>
                                                        <img
                                                            src={item.image?.startsWith('http') ? item.image : `${process.env.REACT_APP_BACK_URL}${item.image}`}
                                                            alt={item.nom}
                                                            onError={(e) => {
                                                                e.target.src = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80';
                                                            }}
                                                            loading="lazy"
                                                        />
                                                        <button
                                                            className={styles["remove-favorite"]}
                                                            onClick={() => removeFavorite(item.id, item.entite_type, item.entite_id)}
                                                            disabled={removingId === item.id}
                                                            aria-label="Supprimer des favoris"
                                                        >
                                                            {removingId === item.id
                                                                ? <i className="fas fa-spinner fa-spin"></i>
                                                                : <i className="fas fa-times"></i>}
                                                        </button>
                                                        <div className={styles["card-badge-favorites"]}>
                                                            <span className={styles["entity-type"]}>
                                                                <i className="fas fa-map-marker-alt"></i> Site
                                                            </span>
                                                            {item.type && (
                                                                <span className={styles["category"]}>
                                                                    {item.type}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.date_ajout && (
                                                            <div className={styles["date-added"]}>
                                                                <i className="far fa-calendar"></i>
                                                                {formatDate(item.date_ajout)}
                                                            </div>
                                                        )}
                                                        <div className={styles["card-glow"]}></div>
                                                    </div>
                                                    <div className={styles["card-content"]}>
                                                        <h3>
                                                            <i className="fas fa-heart"></i>
                                                            {item.nom}
                                                        </h3>

                                                        <div className={styles["card-meta"]}>
                                                            <p className={styles["location"]}>
                                                                <i className="fas fa-map-marker-alt"></i>
                                                                {item.nom_region || `Région ${item.id_region}`}
                                                            </p>

                                                            <p className={styles["cost"]}>
                                                                <i className="fas fa-tag"></i>
                                                                {formatPrice(item.cout_estime)}
                                                            </p>
                                                            {item.duree_visite && (
                                                                <p className={styles["duration"]}>
                                                                    <i className="far fa-clock"></i>
                                                                    {item.duree_visite} heures
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className={styles["card-actions"]}>
                                                            <Link
                                                                to={`/site/${item.entite_id}`}
                                                                className={styles["view-btn"]}
                                                            >
                                                                <i className="fas fa-eye"></i>
                                                                Voir le site
                                                                <div className={styles["btn-glow"]}></div>
                                                            </Link>
                                                            <button
                                                                className={styles["share-btn"]}
                                                                onClick={() => handleShare(item)}
                                                            >
                                                                <i className="fas fa-share-alt"></i> Partager
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className={styles["no-favorites"]}>
                                            <div className={styles["empty-state"]}>
                                                <i className="fas fa-map-marker-alt"></i>
                                                <h3>Aucun site dans cette catégorie</h3>
                                                <p>Essayez de changer de filtre ou d'explorer nos sites</p>
                                                <Link
                                                    to="/search"
                                                    className={styles["explore-btn-secondary"]}
                                                >
                                                    <i className="fas fa-search"></i>
                                                    Rechercher des sites
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Section Régions */}
                            {regionFavorites.length > 0 && (
                                <div className={`${styles["favorites-section"]} ${styles["anime-section"]}`}>
                                    <div className={styles["section-header"]}>
                                        <div className={styles["section-title"]}>
                                            <div className={styles["section-icon-wrapper"]}>
                                                <i className="fas fa-globe-africa"></i>
                                                <div className={styles["icon-glow"]}></div>
                                            </div>
                                            <h2>
                                                <span className={styles["title-anime"]}>
                                                    Mes <span className={styles["title-accent"]}>Régions</span> Favorites
                                                </span>
                                            </h2>
                                            <span className={styles["section-count"]}>{regionFavorites.length}</span>
                                        </div>

                                        {regionTypes.length > 0 && (
                                            <div className={styles["section-filters"]}>
                                                <button
                                                    className={clsx(styles['filter-btn'], styles['anime-filter'], {
                                                        [styles['active']]: regionActiveFilter === 'all'
                                                    })}
                                                    onClick={() => setRegionActiveFilter('all')}
                                                >
                                                    <i className="fas fa-globe"></i>
                                                    Toutes les catégories
                                                </button>
                                                {regionTypes.map((type, index) => (
                                                    <button
                                                        key={`region-${type}`}
                                                        className={clsx(styles['filter-btn'], styles['anime-filter'], {
                                                            [styles['active']]: regionActiveFilter === type
                                                        })}
                                                        onClick={() => setRegionActiveFilter(type)}
                                                        style={{ animationDelay: `${index * 0.1}s` }}
                                                    >
                                                        <i className="fas fa-tag"></i>
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {filteredRegionFavorites.length > 0 ? (
                                        <div className={styles["favorites-grid"]}>
                                            {filteredRegionFavorites.map((item, index) => (
                                                <div
                                                    key={`region-${item.id}`}
                                                    className={`${styles["favorite-card"]} ${styles["anime-card"]}`}
                                                    style={{ animationDelay: `${index * 0.1}s` }}
                                                    onMouseEnter={() => launchHeartParticles(1)}
                                                >
                                                    <div className={styles["card-image"]}>
                                                        <img
                                                            src={item.image?.startsWith('http') ? item.image : `${process.env.REACT_APP_BACK_URL}${item.image}`}
                                                            alt={item.nom}
                                                            onError={(e) => {
                                                                e.target.src = 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80';
                                                            }}
                                                            loading="lazy"
                                                        />
                                                        <button
                                                            className={styles["remove-favorite"]}
                                                            onClick={() => removeFavorite(item.id, item.entite_type, item.entite_id)}
                                                            disabled={removingId === item.id}
                                                            aria-label="Supprimer des favoris"
                                                        >
                                                            {removingId === item.id
                                                                ? <i className="fas fa-spinner fa-spin"></i>
                                                                : <i className="fas fa-times"></i>}
                                                        </button>
                                                        <div className={styles["card-badge-favorites"]}>
                                                            <span className={styles["entity-type"]}>
                                                                <i className="fas fa-globe-africa"></i> Région
                                                            </span>
                                                            {item.type && (
                                                                <span className={styles["category"]}>
                                                                    {item.type}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.date_ajout && (
                                                            <div className={styles["date-added"]}>
                                                                <i className="far fa-calendar"></i>
                                                                {formatDate(item.date_ajout)}
                                                            </div>
                                                        )}
                                                        <div className={styles["card-glow"]}></div>
                                                    </div>
                                                    <div className={styles["card-content"]}>
                                                        <h3>
                                                            <i className="fas fa-heart"></i>
                                                            {item.nom}
                                                        </h3>

                                                        <div className={styles["card-meta"]}>
                                                            <p className={styles["location"]}>
                                                                <i className="fas fa-map-marker-alt"></i>
                                                                {item.nom_province || 'Province inconnue'}
                                                            </p>

                                                            <p className={styles["sites-count"]}>
                                                                <i className="fas fa-landmark"></i>
                                                                {item.total_site || 0} sites
                                                            </p>
                                                            <p className={styles["climate"]}>
                                                                <i className="fas fa-cloud"></i>
                                                                {item.climat_general || 'Climat tropical'}
                                                            </p>
                                                            {item.meilleure_periode && (
                                                                <p className={styles["best-period"]}>
                                                                    <i className="far fa-calendar-alt"></i>
                                                                    {item.meilleure_periode}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className={styles["card-actions"]}>
                                                            <Link
                                                                to={`/region/${item.entite_id}`}
                                                                className={styles["view-btn"]}
                                                            >
                                                                <i className="fas fa-eye"></i>
                                                                Explorer
                                                                <div className={styles["btn-glow"]}></div>
                                                            </Link>
                                                            <button
                                                                className={styles["share-btn"]}
                                                                onClick={() => handleShare(item)}
                                                            >
                                                                <i className="fas fa-share-alt"></i> Partager
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className={styles["no-favorites"]}>
                                            <div className={styles["empty-state"]}>
                                                <i className="fas fa-globe-africa"></i>
                                                <h3>Aucune région dans cette catégorie</h3>
                                                <p>Essayez de changer de filtre ou d'explorer nos régions</p>
                                                <Link
                                                    to="/regions"
                                                    className={styles["explore-btn-secondary"]}
                                                >
                                                    <i className="fas fa-globe-africa"></i>
                                                    Explorer les régions
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : activeTab === 'sites' ? (
                        /* Onglet Sites uniquement */
                        <div className={`${styles["favorites-section"]} ${styles["anime-section"]}`}>
                            <div className={styles["section-header"]}>
                                <div className={styles["section-title"]}>
                                    <div className={styles["section-icon-wrapper"]}>
                                        <i className="fas fa-map-marker-alt"></i>
                                        <div className={styles["icon-glow"]}></div>
                                    </div>
                                    <h2>
                                        <span className={styles["title-anime"]}>
                                            Mes <span className={styles["title-accent"]}>Sites</span> Favoris
                                        </span>
                                    </h2>
                                    <span className={styles["section-count"]}>{siteFavorites.length}</span>
                                </div>

                                {siteTypes.length > 0 && (
                                    <div className={styles["section-filters"]}>
                                        <button
                                            className={clsx(styles['filter-btn'], styles['anime-filter'], {
                                                [styles['active']]: siteActiveFilter === 'all'
                                            })}
                                            onClick={() => setSiteActiveFilter('all')}
                                        >
                                            <i className="fas fa-globe"></i>
                                            Toutes les catégories
                                        </button>
                                        {siteTypes.map((type, index) => (
                                            <button
                                                key={`site-tab-${type}`}
                                                className={clsx(styles['filter-btn'], styles['anime-filter'], {
                                                    [styles['active']]: siteActiveFilter === type
                                                })}
                                                onClick={() => setSiteActiveFilter(type)}
                                                style={{ animationDelay: `${index * 0.1}s` }}
                                            >
                                                <i className="fas fa-tag"></i>
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {filteredSiteFavorites.length > 0 ? (
                                <div className={styles["favorites-grid"]}>
                                    {filteredSiteFavorites.map((item, index) => (
                                        <div
                                            key={`site-tab-${item.id}`}
                                            className={`${styles["favorite-card"]} ${styles["anime-card"]}`}
                                            style={{ animationDelay: `${index * 0.1}s` }}
                                            onMouseEnter={() => launchHeartParticles(1)}
                                        >
                                            {/* Même structure que dans la section sites au-dessus */}
                                            <div className={styles["card-image"]}>
                                                <img
                                                    src={item.image?.startsWith('http') ? item.image : `${process.env.REACT_APP_BACK_URL}${item.image}`}
                                                    alt={item.nom}
                                                    onError={(e) => {
                                                        e.target.src = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80';
                                                    }}
                                                    loading="lazy"
                                                />
                                                <button
                                                    className={styles["remove-favorite"]}
                                                    onClick={() => removeFavorite(item.id, item.entite_type, item.entite_id)}
                                                    disabled={removingId === item.id}
                                                    aria-label="Supprimer des favoris"
                                                >
                                                    {removingId === item.id
                                                        ? <i className="fas fa-spinner fa-spin"></i>
                                                        : <i className="fas fa-times"></i>}
                                                </button>
                                                <div className={styles["card-badge-favorites"]}>
                                                    <span className={styles["entity-type"]}>
                                                        <i className="fas fa-map-marker-alt"></i> Site
                                                    </span>
                                                    {item.type && (
                                                        <span className={styles["category"]}>
                                                            {item.type}
                                                        </span>
                                                    )}
                                                </div>
                                                {item.date_ajout && (
                                                    <div className={styles["date-added"]}>
                                                        <i className="far fa-calendar"></i>
                                                        {formatDate(item.date_ajout)}
                                                    </div>
                                                )}
                                                <div className={styles["card-glow"]}></div>
                                            </div>
                                            <div className={styles["card-content"]}>
                                                <h3>
                                                    <i className="fas fa-heart"></i>
                                                    {item.nom}
                                                </h3>
                                                <div className={styles["card-meta"]}>
                                                    <p className={styles["location"]}>
                                                        <i className="fas fa-map-marker-alt"></i>
                                                        {item.nom_region || `Région ${item.id_region}`}
                                                    </p>
                                                    <p className={styles["cost"]}>
                                                        <i className="fas fa-tag"></i>
                                                        {formatPrice(item.cout_estime)}
                                                    </p>
                                                    {item.duree_visite && (
                                                        <p className={styles["duration"]}>
                                                            <i className="far fa-clock"></i>
                                                            {item.duree_visite} heures
                                                        </p>
                                                    )}
                                                </div>
                                                <div className={styles["card-actions"]}>
                                                    <Link
                                                        to={`/site/${item.entite_id}`}
                                                        className={styles["view-btn"]}
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                        Voir le site
                                                        <div className={styles["btn-glow"]}></div>
                                                    </Link>
                                                    <button
                                                        className={styles["share-btn"]}
                                                        onClick={() => handleShare(item)}
                                                    >
                                                        <i className="fas fa-share-alt"></i> Partager
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles["no-favorites"]}>
                                    <div className={styles["empty-state"]}>
                                        <i className="fas fa-map-marker-alt"></i>
                                        <h3>Vous n'avez aucun site favori</h3>
                                        <p>Explorez nos destinations et ajoutez vos sites préférés ici</p>
                                        <div className={styles["action-buttons"]}>
                                            <Link
                                                to="/regions"
                                                className={styles["explore-btn"]}
                                            >
                                                <i className="fas fa-globe-africa"></i>
                                                Explorer les régions
                                            </Link>
                                            <Link
                                                to="/search"
                                                className={styles["explore-btn-secondary"]}
                                            >
                                                <i className="fas fa-search"></i>
                                                Rechercher des sites
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Onglet Régions uniquement */
                        <div className={`${styles["favorites-section"]} ${styles["anime-section"]}`}>
                            <div className={styles["section-header"]}>
                                <div className={styles["section-title"]}>
                                    <div className={styles["section-icon-wrapper"]}>
                                        <i className="fas fa-globe-africa"></i>
                                        <div className={styles["icon-glow"]}></div>
                                    </div>
                                    <h2>
                                        <span className={styles["title-anime"]}>
                                            Mes <span className={styles["title-accent"]}>Régions</span> Favorites
                                        </span>
                                    </h2>
                                    <span className={styles["section-count"]}>{regionFavorites.length}</span>
                                </div>

                                {regionTypes.length > 0 && (
                                    <div className={styles["section-filters"]}>
                                        <button
                                            className={clsx(styles['filter-btn'], styles['anime-filter'], {
                                                [styles['active']]: regionActiveFilter === 'all'
                                            })}
                                            onClick={() => setRegionActiveFilter('all')}
                                        >
                                            <i className="fas fa-globe"></i>
                                            Toutes les catégories
                                        </button>
                                        {regionTypes.map((type, index) => (
                                            <button
                                                key={`region-tab-${type}`}
                                                className={clsx(styles['filter-btn'], styles['anime-filter'], {
                                                    [styles['active']]: regionActiveFilter === type
                                                })}
                                                onClick={() => setRegionActiveFilter(type)}
                                                style={{ animationDelay: `${index * 0.1}s` }}
                                            >
                                                <i className="fas fa-tag"></i>
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {filteredRegionFavorites.length > 0 ? (
                                <div className={styles["favorites-grid"]}>
                                    {filteredRegionFavorites.map((item, index) => (
                                        <div
                                            key={`region-tab-${item.id}`}
                                            className={`${styles["favorite-card"]} ${styles["anime-card"]}`}
                                            style={{ animationDelay: `${index * 0.1}s` }}
                                            onMouseEnter={() => launchHeartParticles(1)}
                                        >
                                            {/* Même structure que dans la section régions au-dessus */}
                                            <div className={styles["card-image"]}>
                                                <img
                                                    src={item.image?.startsWith('http') ? item.image : `${process.env.REACT_APP_BACK_URL}${item.image}`}
                                                    alt={item.nom}
                                                    onError={(e) => {
                                                        e.target.src = 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80';
                                                    }}
                                                    loading="lazy"
                                                />
                                                <button
                                                    className={styles["remove-favorite"]}
                                                    onClick={() => removeFavorite(item.id, item.entite_type, item.entite_id)}
                                                    disabled={removingId === item.id}
                                                    aria-label="Supprimer des favoris"
                                                >
                                                    {removingId === item.id
                                                        ? <i className="fas fa-spinner fa-spin"></i>
                                                        : <i className="fas fa-times"></i>}
                                                </button>
                                                <div className={styles["card-badge-favorites"]}>
                                                    <span className={styles["entity-type"]}>
                                                        <i className="fas fa-globe-africa"></i> Région
                                                    </span>
                                                    {item.type && (
                                                        <span className={styles["category"]}>
                                                            {item.type}
                                                        </span>
                                                    )}
                                                </div>
                                                {item.date_ajout && (
                                                    <div className={styles["date-added"]}>
                                                        <i className="far fa-calendar"></i>
                                                        {formatDate(item.date_ajout)}
                                                    </div>
                                                )}
                                                <div className={styles["card-glow"]}></div>
                                            </div>
                                            <div className={styles["card-content"]}>
                                                <h3>
                                                    <i className="fas fa-heart"></i>
                                                    {item.nom}
                                                </h3>
                                                <div className={styles["card-meta"]}>
                                                    <p className={styles["location"]}>
                                                        <i className="fas fa-map-marker-alt"></i>
                                                        {item.nom_province || 'Province inconnue'}
                                                    </p>
                                                    <p className={styles["sites-count"]}>
                                                        <i className="fas fa-landmark"></i>
                                                        {item.total_site || 0} sites
                                                    </p>
                                                    <p className={styles["climate"]}>
                                                        <i className="fas fa-cloud"></i>
                                                        {item.climat_general || 'Climat tropical'}
                                                    </p>
                                                    {item.meilleure_periode && (
                                                        <p className={styles["best-period"]}>
                                                            <i className="far fa-calendar-alt"></i>
                                                            {item.meilleure_periode}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className={styles["card-actions"]}>
                                                    <Link
                                                        to={`/region/${item.entite_id}`}
                                                        className={styles["view-btn"]}
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                        Explorer la région
                                                        <div className={styles["btn-glow"]}></div>
                                                    </Link>
                                                    <button
                                                        className={styles["share-btn"]}
                                                        onClick={() => handleShare(item)}
                                                    >
                                                        <i className="fas fa-share-alt"></i> Partager
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles["no-favorites"]}>
                                    <div className={styles["empty-state"]}>
                                        <i className="fas fa-globe-africa"></i>
                                        <h3>Vous n'avez aucune région favorite</h3>
                                        <p>Explorez nos destinations et ajoutez vos régions préférées ici</p>
                                        <div className={styles["action-buttons"]}>
                                            <Link
                                                to="/regions"
                                                className={styles["explore-btn"]}
                                            >
                                                <i className="fas fa-globe-africa"></i>
                                                Explorer les régions
                                            </Link>
                                            <Link
                                                to="/search"
                                                className={styles["explore-btn-secondary"]}
                                            >
                                                <i className="fas fa-search"></i>
                                                Rechercher des sites
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Message si aucun favori */}
                    {allFavorites.length === 0 && (
                        <div className={styles["no-favorites"]}>
                            <div className={styles["empty-state"]}>
                                <i className="far fa-heart"></i>
                                <h3>Vous n'avez aucun favori pour le moment</h3>
                                <p>Explorez nos destinations et ajoutez vos préférés ici</p>
                                <div className={styles["action-buttons"]}>
                                    <Link
                                        to="/regions"
                                        className={styles["explore-btn"]}
                                    >
                                        <i className="fas fa-globe-africa"></i>
                                        Explorer les régions
                                    </Link>
                                    <Link
                                        to="/search"
                                        className={styles["explore-btn-secondary"]}
                                    >
                                        <i className="fas fa-search"></i>
                                        Rechercher des sites
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION TÉMOIGNAGES AMÉLIORÉE POUR LES FAVORIS */}
                    <section className={`${styles["favorites-testimonials"]} ${styles["anime-section"]}`}>
                        <div className={styles["section-header"]}>
                            <h2>
                                <span className={styles["title-anime"]}>
                                    Ceux que disent nos <span className={styles["title-accent"]}>explorateurs</span>
                                </span>
                            </h2>
                            <p className={styles["subtitle-anime"]}>
                                Découvrez comment nos utilisateurs organisent leurs favoris
                            </p>
                        </div>

                        <div className={styles["testimonials-container"]}>
                            <button
                                className={`${styles["scroll-button"]} ${styles.left}`}
                                onClick={() => scrollTestimonials('left')}
                                aria-label="Témoignage précédent"
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>

                            <div
                                className={styles["testimonials-slider"]}
                                ref={testimonialsRef}
                            >
                                {favoritesTestimonials.map((testimonial, index) => (
                                    <div
                                        key={testimonial.id}
                                        className={styles["testimonial-card"]}
                                        data-index={index}
                                    >
                                        <div className={styles["testimonial-quote"]}>
                                            <i className="fas fa-quote-left"></i>
                                        </div>

                                        <div className={styles["testimonial-rating"]}>
                                            {renderStars(testimonial.rating)}
                                            <span className={styles["rating-number"]}>{testimonial.rating}/5</span>
                                        </div>

                                        <p className={styles["testimonial-text"]}>
                                            "{testimonial.comment}"
                                        </p>

                                        <div className={styles["testimonial-author"]}>
                                            <div className={styles["author-avatar"]}>
                                                <span className={styles["avatar"]}>{testimonial.avatar}</span>
                                                <div className={styles["avatar-glow"]}></div>
                                            </div>
                                            <div className={styles["author-info"]}>
                                                <h4 className={styles["author-name"]}>{testimonial.name}</h4>
                                                <div className={styles["author-meta"]}>
                                                    <span className={styles["author-location"]}>
                                                        <i className="fas fa-map-marker-alt"></i>
                                                        {testimonial.location}
                                                    </span>
                                                    <span className={styles["author-date"]}>
                                                        <i className="fas fa-calendar-alt"></i>
                                                        {testimonial.date}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Effets anime */}
                                        <div className={styles["testimonial-glow"]}></div>
                                        <div className={styles["testimonial-sparkle"]}></div>
                                    </div>
                                ))}
                            </div>

                            <button
                                className={`${styles["scroll-button"]} ${styles.right}`}
                                onClick={() => scrollTestimonials('right')}
                                aria-label="Témoignage suivant"
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>

                        {/* Indicateurs de pagination */}
                        <div className={styles["testimonials-pagination"]}>
                            {favoritesTestimonials.slice(0, Math.ceil(favoritesTestimonials.length / 3)).map((_, index) => (
                                <button
                                    key={index}
                                    className={`${styles["pagination-dot"]} ${index === currentTestimonialIndex ? styles.active : ''}`}
                                    onClick={() => {
                                        if (testimonialsRef.current) {
                                            const cardWidth = 320;
                                            testimonialsRef.current.scrollTo({
                                                left: index * cardWidth * 3,
                                                behavior: 'smooth'
                                            });
                                            setCurrentTestimonialIndex(index);
                                        }
                                    }}
                                    aria-label={`Aller au groupe de témoignages ${index + 1}`}
                                />
                            ))}
                        </div>
                    </section>
                </section>
            </main>

            {/* Footer amélioré */}
            <footer className={styles["footer"]}>
                <div className={styles["footer-content"]}>
                    <div className={styles["footer-main"]}>
                        <div className={styles["footer-brand"]}>
                            <Link to="/" className={styles["footer-logo"]}>
                                <div className={styles["footer-logo-animation"]}>
                                    <img src={logos} alt="MadaTour Logo" />
                                    <div className={styles["logo-aura"]}></div>
                                </div>
                                <span className={styles["footer-logo-text"]}>
                                    Mada<span className={styles["footer-logo-accent"]}>Tour</span>
                                </span>
                            </Link>
                            <p className={styles["footer-description"]}>
                                Gardez vos destinations préférées à portée de main.
                                Vos favoris, votre aventure, votre Madagascar.
                            </p>

                            <div className={styles["social-links"]}>
                                {['facebook-f', 'instagram', 'twitter', 'youtube', 'tiktok'].map((platform) => (
                                    <a
                                        key={platform}
                                        href={`https://${platform}.com/madatour`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles["social-link"]}
                                        aria-label={platform}
                                    >
                                        <i className={`fab fa-${platform}`}></i>
                                        <div className={styles["social-glow"]}></div>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className={styles["footer-links"]}>
                            <div className={styles["links-column"]}>
                                <h3>
                                    <i className="fas fa-heart"></i>
                                    Favoris
                                </h3>
                                <ul>
                                    {['Sites touristiques', 'Régions', 'Catégories', 'Partager', 'Organiser'].map((item) => (
                                        <li key={item}>
                                            <Link to={`/favorites?filter=${item.toLowerCase().replace(' ', '-')}`}>
                                                <i className="fas fa-chevron-right"></i>
                                                {item}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className={styles["links-column"]}>
                                <h3>
                                    <i className="fas fa-info-circle"></i>
                                    Compte
                                </h3>
                                <ul>
                                    {['Tableau de bord', 'Profil', 'Mon voyage', 'Historique', 'Paramètres'].map((item) => (
                                        <li key={item}>
                                            <Link to={`/${item.toLowerCase().replace(' ', '-')}`}>
                                                <i className="fas fa-chevron-right"></i>
                                                {item}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className={styles["links-column"]}>
                                <h3>
                                    <i className="fas fa-shield-alt"></i>
                                    Aide
                                </h3>
                                <ul>
                                    {['FAQ favoris', 'Contact', 'Confidentialité', 'Conditions'].map((item) => (
                                        <li key={item}>
                                            <Link to={`/${item.toLowerCase().replace(' ', '-')}`}>
                                                <i className="fas fa-chevron-right"></i>
                                                {item}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className={styles["footer-bottom"]}>
                        <div className={styles["newsletter"]}>
                            <h4>
                                <i className="fas fa-envelope"></i>
                                Infos favoris
                            </h4>
                            <form className={styles["newsletter-form"]}>
                                <input
                                    type="email"
                                    placeholder="Votre email"
                                    className={styles["newsletter-input"]}
                                />
                                <button type="submit" className={styles["newsletter-button"]}>
                                    <i className="fas fa-paper-plane"></i>
                                </button>
                            </form>
                        </div>

                        <p className={styles["copyright"]}>
                            <i className="fas fa-copyright"></i>
                            {new Date().getFullYear()} MadaTour. Tous droits réservés.
                            <span className={styles["made-with"]}>
                                Fait avec <i className="fas fa-heart"></i> pour les voyageurs
                            </span>
                        </p>

                        <div className={styles["footer-apps"]}>
                            <span>Téléchargez notre application :</span>
                            <div className={styles["app-buttons"]}>
                                <a href="/" className={styles["app-button"]}>
                                    <i className="fab fa-apple"></i>
                                    <div>
                                        <span>Télécharger sur</span>
                                        <strong>App Store</strong>
                                    </div>
                                </a>
                                <a href="/" className={styles["app-button"]}>
                                    <i className="fab fa-google-play"></i>
                                    <div>
                                        <span>Disponible sur</span>
                                        <strong>Google Play</strong>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Animation footer spéciale favoris */}
                <div className={styles["footer-wave"]}></div>
                <div className={styles["footer-hearts"]}>
                    {[...Array(15)].map((_, i) => (
                        <div
                            key={i}
                            className={styles["heart"]}
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 5}s`,
                                fontSize: `${Math.random() * 10 + 10}px`
                            }}
                        >
                            {['❤️', '💖', '💗', '💓'][Math.floor(Math.random() * 4)]}
                        </div>
                    ))}
                </div>
            </footer>

            {/* Bouton retour en haut amélioré */}
            <button
                className={`${styles["back-to-top"]} ${showBackToTop ? styles.visible : ''}`}
                onClick={scrollToTop}
                aria-label="Retour en haut"
            >
                <i className="fas fa-chevron-up"></i>
                <div className={styles["back-to-top-glow"]}></div>
            </button>
        </div>
    );
};

export default Favorites;