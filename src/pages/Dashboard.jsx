import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import styles from './css/Dashboard.module.css';
import logos from '../images/logo-site4.png';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../components/Notification/NotificationProvider';
import { Loader } from '../components/Loader';

const Dashboard = () => {
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        lastLogin: '',
        level: 'Explorateur',
        experience: 65,
        nextLevelExp: 100,
        badges: 3,
        joinDate: new Date().toISOString()
    });

    const [profileData, setProfileData] = useState({
        fullName: '',
        phone: '',
        address: '',
        bio: '',
        travelStyle: 'adventurous',
        languages: ['Français', 'Anglais', 'Malgache']
    });

    const [profileImage, setProfileImage] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [currentTheme, setCurrentTheme] = useState('default');
    const [activeTab, setActiveTab] = useState('overview');
    const [animatedStats, setAnimatedStats] = useState([]);

    // Statistiques étendues basées sur les données réelles
    const [userStats, setUserStats] = useState({
        favoritesCount: 0,
        siteFavoritesCount: 0,
        regionFavoritesCount: 0,
        visitedSites: 0,
        reviewsPosted: 0,
        plannedTrips: 0,
        daysTraveled: 0,
        itineraryViews: 0,
        communityLikes: 0,
        kilometersExplored: 0,
        searchHistory: 0
    });

    const [realActivities, setRealActivities] = useState([]);
    const [explorationProgress, setExplorationProgress] = useState({
        nationalParks: 0,
        beaches: 0,
        culturalSites: 0,
        totalSites: 0,
        percentage: 0
    });

    const { logout, user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { showSuccess, showError, showLoading: showLoadingNotification } = useNotification();
    const statsRef = useRef(null);
    const mainContentRef = useRef(null);
    const autoScrollRef = useRef(null);

    useEffect(() => {
        document.title = `Dashboard - ${user?.name || 'MadaTour'}`;
    }, [user]);

    // Références pour le scroll
    const overviewSectionRef = useRef(null);
    const statsSectionRef = useRef(null);
    const activitiesSectionRef = useRef(null);
    const achievementsSectionRef = useRef(null);
    const profileSectionRef = useRef(null);

    const themes = [
        { id: 'default', name: 'Classique', gradient: 'linear-gradient(135deg, #2a6f97 0%, #468faf 100%)' },
        { id: 'adventure', name: 'Aventure', gradient: 'linear-gradient(135deg, #f77f00 0%, #ff9e40 100%)' },
        { id: 'nature', name: 'Nature', gradient: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' },
        { id: 'premium', name: 'Premium', gradient: 'linear-gradient(135deg, #6f42c1 0%, #9b59b6 100%)' },
        { id: 'ocean', name: 'Océan', gradient: 'linear-gradient(135deg, #00b4d8 0%, #90e0ef 100%)' }
    ];

    const travelStyles = [
        { id: 'adventurous', name: 'Aventureux', icon: 'fas fa-mountain', color: '#f77f00' },
        { id: 'cultural', name: 'Culturel', icon: 'fas fa-landmark', color: '#2a6f97' },
        { id: 'relax', name: 'Détente', icon: 'fas fa-umbrella-beach', color: '#00b4d8' },
        { id: 'wildlife', name: 'Faune', icon: 'fas fa-paw', color: '#28a745' },
        { id: 'gastronomy', name: 'Gastronomie', icon: 'fas fa-utensils', color: '#9b59b6' }
    ];

    const badges = [
        { id: 1, name: 'Explorateur débutant', icon: 'fas fa-compass', earned: true, date: '2024-01-15' },
        { id: 2, name: 'Collecteur de sites', icon: 'fas fa-map-marker-alt', earned: true, date: '2024-02-20' },
        { id: 3, name: 'Expert régions', icon: 'fas fa-globe-africa', earned: true, date: '2024-03-10' },
        { id: 4, name: 'Maître voyageur', icon: 'fas fa-crown', earned: false, progress: 80 },
        { id: 5, name: 'Contributeur actif', icon: 'fas fa-star', earned: false, progress: 60 },
        { id: 6, name: 'Guide communautaire', icon: 'fas fa-users', earned: false, progress: 40 }
    ];

    const quickTips = [
        { id: 1, tip: "Activez les notifications pour recevoir des recommandations personnalisées", icon: 'fas fa-bell' },
        { id: 2, tip: "Complétez votre profil pour améliorer nos suggestions", icon: 'fas fa-user-check' },
        { id: 3, tip: "Explorez les régions moins connues pour des expériences uniques", icon: 'fas fa-map' },
        { id: 4, tip: "Partagez vos avis pour aider d'autres voyageurs", icon: 'fas fa-star' }
    ];

    // Vérifier l'authentification au chargement
    useEffect(() => {
        if (!isAuthenticated || !user) {
            navigate('/login');
        }
    }, [isAuthenticated, user, navigate]);

    // VOTRE MÉTHODE DE RÉCUPÉRATION DES DONNÉES RÉELLES
    const fetchAdditionalData = async (userId, token) => {
        try {
            // Récupérer les données d'historique de recherche
            const historyRes = await api.get(`api/user/history/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const searchHistory = Array.isArray(historyRes.data) ? historyRes.data.length : 0;

            // Récupérer les détails des itinéraires
            const itinerairesRes = await api.getItineraires(userId);
            const itinerairesData = Array.isArray(itinerairesRes.data) ? itinerairesRes.data : [];

            let totalDays = 0;
            let totalKilometers = 0;
            let totalViews = 0;

            itinerairesData.forEach(trip => {
                totalDays += trip.duree_total || 0;
                totalKilometers += trip.distance_km || 0;
                totalViews += trip.nombre_vues || 0;
            });

            // Récupérer les avis pour les likes
            const reviewsRes = await api.get(`api/user/reviews/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const reviewsData = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];

            let totalLikes = 0;
            reviewsData.forEach(review => {
                totalLikes += review.nombre_likes || 0;
            });

            return {
                searchHistory,
                daysTraveled: totalDays,
                kilometersExplored: totalKilometers,
                itineraryViews: totalViews,
                communityLikes: totalLikes
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des données supplémentaires:', error);
            return {
                searchHistory: 0,
                daysTraveled: 0,
                kilometersExplored: 0,
                itineraryViews: 0,
                communityLikes: 0
            };
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            // Attendre que user soit disponible
            if (!user || !user.id) {
                console.log('En attente des données utilisateur...');
                return;
            }

            try {
                const token = localStorage.getItem('token');
                const userId = user.id;

                if (!token) {
                    navigate('/login');
                    return;
                }

                setIsLoading(true);

                try {
                    const [userRes, favRes, regionFavRes, historyRes, reviewsRes, itinerairesRes] = await Promise.all([
                        api.get(`api/user/${userId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        }).catch(() => ({ data: {} })),
                        api.get(`api/user/favorites/${userId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        }).catch(() => ({ data: [] })),
                        api.get(`api/user/favorites-regions/${userId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        }).catch(() => ({ data: [] })),
                        api.get(`api/user/history/${userId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        }).catch(() => ({ data: [] })),
                        api.get(`api/user/reviews/${userId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        }).catch(() => ({ data: [] })),
                        api.getItineraires(userId).catch(() => ({ data: [] }))
                    ]);

                    const userBasicData = {
                        name: userRes.data.name || user.name || 'Explorateur',
                        email: userRes.data.email || user.email || 'explorateur@madatour.mg',
                        lastLogin: new Date(userRes.data.lastLogin || Date.now()).toLocaleString('fr-FR'),
                        level: 'Explorateur Avancé',
                        experience: 780,
                        nextLevelExp: 1000,
                        badges: 4,
                        joinDate: userRes.data.joinDate || '2024-01-01',
                        rank: 'Top 15%'
                    };

                    setUserData(userBasicData);

                    setProfileData({
                        fullName: userRes.data.name || user.name || 'Explorateur',
                        phone: userRes.data.phone || '+261 34 00 000 00',
                        address: userRes.data.address || 'Antananarivo, Madagascar',
                        bio: userRes.data.bio || 'Passionné de voyages et de découvertes culturelles à Madagascar. J\'aime explorer les régions authentiques et rencontrer les communautés locales.',
                        travelStyle: 'adventurous',
                        languages: ['Français', 'Anglais', 'Malgache']
                    });

                    const favoritesData = favRes.data || [];
                    const regionFavoritesData = regionFavRes.data || [];
                    const totalFavorites = favoritesData.length + regionFavoritesData.length;

                    const historyData = Array.isArray(historyRes.data) ? historyRes.data : [];
                    const activities = historyData.slice(0, 4).map(item => {
                        let icon = 'fas fa-history';
                        let typeColor = '#2a6f97';

                        if (item && item.type) {
                            switch (item.type) {
                                case 'like':
                                    icon = 'fas fa-heart';
                                    typeColor = '#e63946';
                                    break;
                                case 'unlike':
                                    icon = 'fas fa-heart-broken';
                                    typeColor = '#6d6875';
                                    break;
                                case 'comment':
                                    icon = 'fas fa-comment';
                                    typeColor = '#f77f00';
                                    break;
                                case 'review':
                                    icon = 'fas fa-star';
                                    typeColor = '#ffd166';
                                    break;
                                case 'search':
                                    icon = 'fas fa-search';
                                    typeColor = '#2a6f97';
                                    break;
                                case 'view':
                                    icon = 'fas fa-eye';
                                    typeColor = '#2a6f97';
                                    break;
                                case 'share':
                                    icon = 'fas fa-share-alt';
                                    typeColor = '#8338ec';
                                    break;
                                case 'add_to_trip':
                                    icon = 'fas fa-suitcase';
                                    typeColor = '#f77f00';
                                    break;
                                case 'remove_from_trip':
                                    icon = 'fas fa-suitcase-rolling';
                                    typeColor = '#e74c3c';
                                    break;
                                case 'visit':
                                    icon = 'fas fa-external-link-alt';
                                    typeColor = '#9b59b6';
                                    break;
                                default:
                                    icon = 'fas fa-history';
                                    typeColor = '#2a6f97';
                                    break;
                            }
                        }

                        return {
                            id: item?.id_history || Date.now() + Math.random(),
                            type: item?.type || 'activity',
                            message: item?.criteres || 'Activité récente',
                            date: item?.date_recherche || item?.created_at || new Date().toISOString(),
                            icon: icon,
                            iconColor: typeColor,
                            details: item?.resultats,
                            entityName: item?.entityName
                        };
                    });

                    setRealActivities(activities);

                    const reviewsData = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];
                    const itinerairesData = Array.isArray(itinerairesRes.data) ? itinerairesRes.data : [];

                    const visitedActions = historyData.filter(h =>
                        h && (h.type === 'view' || h.type === 'visit')
                    ).length;

                    const additionalData = await fetchAdditionalData(userId, token);
                    const exploration = calculateExplorationProgress(historyData, favoritesData);

                    const calculatedStats = {
                        favoritesCount: totalFavorites,
                        siteFavoritesCount: favoritesData.length,
                        regionFavoritesCount: regionFavoritesData.length,
                        visitedSites: visitedActions,
                        reviewsPosted: reviewsData.length,
                        plannedTrips: itinerairesData.length,
                        ...additionalData
                    };

                    setUserStats(calculatedStats);
                    setExplorationProgress(exploration);
                    animateStats(calculatedStats);

                    if (activities.length < 4) {
                        const exampleActivities = [
                            {
                                id: 1,
                                type: 'example',
                                message: 'Bienvenue sur MadaTour ! Commencez à explorer les sites.',
                                date: new Date().toISOString(),
                                icon: 'fas fa-compass',
                                iconColor: '#2a6f97',
                                details: 'Première connexion'
                            },
                            {
                                id: 2,
                                type: 'example',
                                message: 'Ajoutez des sites à votre voyage',
                                date: new Date().toISOString(),
                                icon: 'fas fa-suitcase',
                                iconColor: '#f77f00',
                                details: 'Planifiez votre voyage'
                            }
                        ];
                        setRealActivities(prev => [...exampleActivities, ...(Array.isArray(prev) ? prev : [])].slice(0, 4));
                    }

                } catch (error) {
                    console.error('Erreur de chargement:', error);
                    showError('Erreur de chargement des données');

                    setUserStats({
                        favoritesCount: 0,
                        siteFavoritesCount: 0,
                        regionFavoritesCount: 0,
                        visitedSites: 0,
                        reviewsPosted: 0,
                        plannedTrips: 0,
                        daysTraveled: 0,
                        itineraryViews: 0,
                        communityLikes: 0,
                        kilometersExplored: 0,
                        searchHistory: 0
                    });

                    setRealActivities([
                        {
                            id: 1,
                            type: 'welcome',
                            message: 'Bienvenue sur votre tableau de bord MadaTour !',
                            date: new Date().toISOString(),
                            icon: 'fas fa-home',
                            iconColor: '#2a6f97'
                        }
                    ]);
                }
            } catch (error) {
                console.error('Erreur fatale:', error);
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userId');
                    localStorage.removeItem('userName');
                    navigate('/login');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();

        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 300);

            
            const sections = document.querySelectorAll(`.${styles["anime-section"]}`);
            sections.forEach(section => {
                const rect = section.getBoundingClientRect();
                console.log(`rect top: ${rect.top}`)
                if (rect.top < window.innerHeight * 0.8) {
                    section.classList.add(styles.visible);
                    console.log("Must be visible")
                }
            });

            updateActiveTabOnScroll();
        };

        window.addEventListener('scroll', handleScroll);

        // Copier la référence pour le cleanup
        const autoScrollCurrent = autoScrollRef.current;

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (autoScrollCurrent) {
                clearInterval(autoScrollCurrent);
            }
        };
    }, [user, navigate, showError]);

    const calculateExplorationProgress = (historyData, favoritesData) => {
        const visitedSites = historyData.filter(h =>
            h && (h.type === 'view' || h.type === 'visit')
        ).length;

        const categories = {
            nationalParks: Math.floor(visitedSites * 0.3),
            beaches: Math.floor(visitedSites * 0.2),
            culturalSites: Math.floor(visitedSites * 0.5),
            totalSites: visitedSites + (favoritesData?.length || 0),
            percentage: Math.min(Math.floor(((visitedSites + (favoritesData?.length || 0)) / 50) * 100), 100)
        };

        return categories;
    };

    const updateActiveTabOnScroll = () => {
        const sections = [
            { id: 'overview', ref: overviewSectionRef },
            { id: 'stats', ref: statsSectionRef },
            { id: 'activities', ref: activitiesSectionRef },
            { id: 'achievements', ref: achievementsSectionRef },
            { id: 'profile', ref: profileSectionRef }
        ];

        const scrollPosition = window.scrollY + 100;

        for (let i = sections.length - 1; i >= 0; i--) {
            const section = sections[i];
            if (section.ref.current) {
                const sectionTop = section.ref.current.offsetTop;
                if (scrollPosition >= sectionTop) {
                    setActiveTab(section.id);
                    break;
                }
            }
        }
    };

    const scrollToSection = (sectionId) => {
        setActiveTab(sectionId);

        let targetRef;
        switch (sectionId) {
            case 'overview':
                targetRef = overviewSectionRef;
                break;
            case 'stats':
                targetRef = statsSectionRef;
                break;
            case 'activities':
                targetRef = activitiesSectionRef;
                break;
            case 'achievements':
                targetRef = achievementsSectionRef;
                break;
            case 'profile':
                targetRef = profileSectionRef;
                break;
            default:
                targetRef = overviewSectionRef;
                break;
        }

        if (targetRef.current) {
            window.scrollTo({
                top: targetRef.current.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    };

    const animateStats = (stats) => {
        const statValues = Object.values(stats).filter(val => typeof val === 'number');
        const animated = statValues.map((value, index) => ({
            id: index,
            value: 0,
            target: value,
            duration: 1000 + (index * 200)
        }));

        setAnimatedStats(animated);

        animated.forEach((stat, index) => {
            const end = stat.target;
            const duration = stat.duration;
            const startTime = Date.now();

            const animate = () => {
                const now = Date.now();
                const progress = Math.min((now - startTime) / duration, 1);
                const currentValue = Math.floor(progress * end);

                setAnimatedStats(prev =>
                    prev.map(s => s.id === stat.id ? { ...s, value: currentValue } : s)
                );

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            setTimeout(animate, index * 100);
        });
    };

    const handleLogout = async () => {
        try {
            await logout();
            localStorage.removeItem('token');
            localStorage.removeItem('userName');
            localStorage.removeItem('userId');
            navigate('/');
            showSuccess('Déconnexion réussie !');
        } catch (error) {
            console.error('Erreur de déconnexion:', error);
            showError('Erreur lors de la déconnexion');
        }
    };

    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showError('La taille de l\'image ne doit pas dépasser 5MB');
                return;
            }
            setProfileImage(file);

            const reader = new FileReader();
            reader.onload = (e) => {
                const avatar = document.getElementById('profile-avatar');
                if (avatar) {
                    avatar.style.backgroundImage = `url(${e.target.result})`;
                    avatar.style.backgroundSize = 'cover';
                    avatar.style.backgroundPosition = 'center';
                }
            };
            reader.readAsDataURL(file);

            showSuccess('Photo de profil mise à jour !');
        }
    };

    const handleThemeChange = (themeId) => {
        setCurrentTheme(themeId);
        showSuccess(`Thème ${themes.find(t => t.id === themeId)?.name} appliqué`);
    };

    const handleTravelStyleChange = (styleId) => {
        setProfileData(prev => ({
            ...prev,
            travelStyle: styleId
        }));
        showSuccess('Style de voyage mis à jour');
    };

    const handleSaveProfile = async () => {
        const closeLoading = showLoadingNotification('Sauvegarde en cours...');

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            setIsEditing(false);
            closeLoading();
            showSuccess('Profil mis à jour avec succès !', 3000);
        } catch (error) {
            console.error('Erreur:', error);
            closeLoading();
            showError('Erreur lors de la sauvegarde');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const formatActivityDate = (dateString) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'À l\'instant';
            if (diffMins < 60) return `Il y a ${diffMins} min`;
            if (diffHours < 24) return `Il y a ${diffHours} h`;
            if (diffDays < 7) return `Il y a ${diffDays} j`;

            return date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (error) {
            return 'Date inconnue';
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 0; i < 5; i++) {
            stars.push(
                <i
                    key={i}
                    className={`fas fa-star ${styles.starAnimation}`}
                    style={{
                        color: i < Math.floor(rating) ? '#ffd166' : '#e9ecef',
                        animationDelay: `${i * 0.1}s`
                    }}
                ></i>
            );
        }
        return stars;
    };

    const getAnimatedStat = (statName) => {
        const statIndex = Object.keys(userStats).indexOf(statName);
        return statIndex >= 0 && animatedStats[statIndex] ? animatedStats[statIndex].value : userStats[statName];
    };

    const refreshData = async () => {
        const closeLoading = showLoadingNotification('Rafraîchissement des données...');

        try {
            setIsLoading(true);
            const userId = user?.id;
            const token = localStorage.getItem('token');

            if (!userId || !token) {
                showError('Utilisateur non connecté');
                return;
            }

            const [favRes, regionFavRes, itinerairesRes, historyRes, reviewsRes] = await Promise.all([
                api.get(`api/user/favorites/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: [] })),
                api.get(`api/user/favorites-regions/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: [] })),
                api.getItineraires(userId).catch(() => ({ data: [] })),
                api.get(`api/user/history/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: [] })),
                api.get(`api/user/reviews/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: [] }))
            ]);

            const favoritesData = favRes.data || [];
            const regionFavoritesData = regionFavRes.data || [];
            const totalFavorites = favoritesData.length + regionFavoritesData.length;

            const itinerairesData = Array.isArray(itinerairesRes.data) ? itinerairesRes.data : [];
            const historyData = Array.isArray(historyRes.data) ? historyRes.data : [];
            const reviewsData = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];

            const additionalData = await fetchAdditionalData(userId, token);
            const exploration = calculateExplorationProgress(historyData, favoritesData);

            const updatedStats = {
                favoritesCount: totalFavorites,
                siteFavoritesCount: favoritesData.length,
                regionFavoritesCount: regionFavoritesData.length,
                plannedTrips: itinerairesData.length,
                visitedSites: historyData.filter(h =>
                    h && (h.type === 'view' || h.type === 'visit')
                ).length,
                reviewsPosted: reviewsData.length,
                ...additionalData
            };

            setUserStats(updatedStats);
            setExplorationProgress(exploration);
            animateStats(updatedStats);

            const activities = historyData.slice(0, 4).map(item => {
                let icon = 'fas fa-history';
                let typeColor = '#2a6f97';

                if (item && item.type) {
                    switch (item.type) {
                        case 'like':
                            icon = 'fas fa-heart';
                            typeColor = '#e63946';
                            break;
                        case 'unlike':
                            icon = 'fas fa-heart-broken';
                            typeColor = '#6d6875';
                            break;
                        case 'comment':
                            icon = 'fas fa-comment';
                            typeColor = '#f77f00';
                            break;
                        case 'review':
                            icon = 'fas fa-star';
                            typeColor = '#ffd166';
                            break;
                        case 'search':
                            icon = 'fas fa-search';
                            typeColor = '#2a6f97';
                            break;
                        case 'view':
                            icon = 'fas fa-eye';
                            typeColor = '#2a6f97';
                            break;
                        case 'share':
                            icon = 'fas fa-share-alt';
                            typeColor = '#8338ec';
                            break;
                        case 'add_to_trip':
                            icon = 'fas fa-suitcase';
                            typeColor = '#f77f00';
                            break;
                        case 'remove_from_trip':
                            icon = 'fas fa-suitcase-rolling';
                            typeColor = '#e74c3c';
                            break;
                        case 'visit':
                            icon = 'fas fa-external-link-alt';
                            typeColor = '#9b59b6';
                            break;
                        default:
                            icon = 'fas fa-history';
                            typeColor = '#2a6f97';
                            break;
                    }
                }

                return {
                    id: item?.id_history || Date.now() + Math.random(),
                    type: item?.type || 'activity',
                    message: item?.criteres || 'Activité récente',
                    date: item?.date_recherche || item?.created_at || new Date().toISOString(),
                    icon: icon,
                    iconColor: typeColor,
                    details: item?.resultats,
                    entityName: item?.entityName
                };
            });

            setRealActivities(activities.length > 0 ? activities : [
                {
                    id: 1,
                    type: 'welcome',
                    message: 'Bienvenue sur votre tableau de bord MadaTour !',
                    date: new Date().toISOString(),
                    icon: 'fas fa-home',
                    iconColor: '#2a6f97'
                }
            ]);

            closeLoading();
            showSuccess('Données rafraîchies avec succès !', 3000);

        } catch (error) {
            console.error('Erreur lors du rafraîchissement:', error);
            closeLoading();
            showError('Erreur lors du rafraîchissement des données', 4000);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateAverageRating = () => {
        if (userStats.reviewsPosted === 0) return 4.5;
        return (4.5 + Math.random() * 0.5).toFixed(1);
    };

    const getCommentCount = () => {
        return Math.floor(userStats.reviewsPosted * 1.5);
    };

    if (!isAuthenticated || !user) {
        return (
            <div className={styles["dashboard-loading"]}>
                <div className={styles["loading-container"]}>
                    <div className={styles["loading-spinner"]}>
                        <div className={styles["spinner-inner"]}></div>
                        <div className={styles["spinner-orbits"]}>
                            <div className={styles["orbit-1"]}></div>
                            <div className={styles["orbit-2"]}></div>
                            <div className={styles["orbit-3"]}></div>
                        </div>
                    </div>
                    <div className={styles["loading-text"]}>
                        <h3>Vérification de votre session...</h3>
                        <p>Redirection vers la page de connexion</p>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <Loader />
        );
    }

    return (
        <div className={`${styles["dashboard-container"]} ${styles[currentTheme]}`}>
            {/* Header avec animations */}
            <header className={`${styles["dashboard-header"]} ${styles.animatedHeader}`}>
                <div className={styles["header-left"]}>
                    <Link to="/" className={styles["logo"]}>
                        <div className={styles["logo-animation"]}>
                            <img src={logos} alt="Logo MadaTour" className={styles["logo-image"]} />
                            <div className={styles["logo-glow"]}></div>
                        </div>
                        <div className={styles["logo-text"]}>
                            <span className={styles["logo-primary"]}>Mada</span>
                            <span className={styles["logo-accent"]}>Tour</span>
                        </div>
                    </Link>

                    <nav className={styles["dashboard-nav"]}>
                        <button
                            className={`${styles["nav-tab"]} ${activeTab === 'overview' ? styles.active : ''}`}
                            onClick={() => scrollToSection('overview')}
                        >
                            <i className="fas fa-home"></i>
                            <span>Ensemble</span>
                        </button>
                        <button
                            className={`${styles["nav-tab"]} ${activeTab === 'stats' ? styles.active : ''}`}
                            onClick={() => scrollToSection('stats')}
                        >
                            <i className="fas fa-chart-line"></i>
                            <span>Statistiques</span>
                        </button>
                        <button
                            className={`${styles["nav-tab"]} ${activeTab === 'activities' ? styles.active : ''}`}
                            onClick={() => scrollToSection('activities')}
                        >
                            <i className="fas fa-history"></i>
                            <span>Activités</span>
                        </button>
                        <button
                            className={`${styles["nav-tab"]} ${activeTab === 'achievements' ? styles.active : ''}`}
                            onClick={() => scrollToSection('achievements')}
                        >
                            <i className="fas fa-trophy"></i>
                            <span>Succès</span>
                        </button>
                        <button
                            className={`${styles["nav-tab"]} ${activeTab === 'profile' ? styles.active : ''}`}
                            onClick={() => scrollToSection('profile')}
                        >
                            <i className="fas fa-user-circle"></i>
                            <span>Profil</span>
                        </button>
                    </nav>
                </div>

                <div className={styles["user-nav"]}>
                    <div className={styles["user-actions"]}>
                        <button
                            className={styles["refresh-btn"]}
                            onClick={refreshData}
                            title="Rafraîchir"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                                <i className="fas fa-sync-alt"></i>
                            )}
                        </button>

                        <div className={styles["notification-bell"]}>
                            <i className="fas fa-bell"></i>
                            <span className={styles["notification-count"]}>3</span>
                            <div className={styles["notification-dropdown"]}>
                                <div className={styles["notification-header"]}>
                                    <h4>Notifications</h4>
                                    <button className={styles["mark-all-read"]}>Tout lire</button>
                                </div>
                                <div className={styles["notification-list"]}>
                                    <div className={styles["notification-item"]}>
                                        <div className={styles["notification-icon"]}>
                                            <i className="fas fa-star"></i>
                                        </div>
                                        <div className={styles["notification-content"]}>
                                            <p>Nouvelle recommandation pour vous</p>
                                            <small>Il y a 2h</small>
                                        </div>
                                    </div>
                                    <div className={styles["notification-item"]}>
                                        <div className={styles["notification-icon"]}>
                                            <i className="fas fa-users"></i>
                                        </div>
                                        <div className={styles["notification-content"]}>
                                            <p>3 personnes suivent vos voyages</p>
                                            <small>Il y a 5h</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles["user-profile-mini"]}>
                        <div className={styles["user-avatar-mini"]} id="profile-avatar-mini">
                            {profileImage ? (
                                <img src={URL.createObjectURL(profileImage)} alt={userData.name} />
                            ) : (
                                <i className="fas fa-user"></i>
                            )}
                        </div>
                        <div className={styles["user-info-mini"]}>
                            <span className={styles["user-name"]}>{userData.name}</span>
                        </div>
                        <div className={styles["user-dropdown"]}>
                            <button className={styles["dropdown-toggle"]}>
                                <i className="fas fa-chevron-down"></i>
                            </button>
                            <div className={styles["dropdown-menu"]}>

                                {/* NOUVEAU LIEN - À AJOUTER */}
                                <Link to="/dashboard/recommendations" className={styles["dropdown-item"]}>
                                    <i className="fas fa-robot"></i> Recommandat° IA
                                </Link>

                                <Link to="/dashboard/favorites" className={styles["dropdown-item"]}>
                                    <i className="fas fa-heart"></i> Mes favoris
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
                                <button onClick={handleLogout} className={styles["dropdown-item"]}>
                                    <i className="fas fa-sign-out-alt"></i> Déconnexion
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className={styles["dashboard-main"]} ref={mainContentRef}>
                {/* Section Bienvenue avec animations */}
                <section
                    className={`${styles["welcome-section"]} ${styles["anime-section"]}`}
                    ref={overviewSectionRef}
                    id="overview-section"
                >
                    <div className={styles["welcome-overlay"]}></div>
                    <div className={styles["welcome-content"]}>
                        <div className={styles["welcome-header"]}>
                            <div className={styles["welcome-text"]}>
                                <h1 className={styles["anime-text"]}>
                                    <span className={styles["text-gradient"]}>
                                        Bienvenue, <span className={styles["text-highlight"]}>{userData.name}</span> !
                                    </span>
                                </h1>
                                <p className={styles["welcome-subtitle"]}>
                                    {userStats.visitedSites > 0
                                        ? `Vous avez exploré ${userStats.visitedSites} sites à Madagascar`
                                        : 'Commencez votre aventure malgache dès maintenant'}
                                </p>
                            </div>

                            <div className={styles["welcome-stats"]}>
                                <div className={`${styles["stat-chip"]} ${styles["anime-stat"]}`}>
                                    <div className={styles["stat-icon"]}>
                                        <i className="fas fa-calendar-alt"></i>
                                    </div>
                                    <div className={styles["stat-content"]}>
                                        <span className={styles["stat-value"]}>
                                            {new Date().toLocaleDateString('fr-FR', { weekday: 'long' })}
                                        </span>
                                        <span className={styles["stat-label"]}>
                                            {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                                        </span>
                                    </div>
                                </div>

                                <div className={`${styles["stat-chip"]} ${styles["anime-stat"]}`}>
                                    <div className={styles["stat-icon"]}>
                                        <i className="fas fa-clock"></i>
                                    </div>
                                    <div className={styles["stat-content"]}>
                                        <span className={styles["stat-value"]}>
                                            {userData.lastLogin.split(' ')[1]}
                                        </span>
                                        <span className={styles["stat-label"]}>
                                            Dernière connexion
                                        </span>
                                    </div>
                                </div>

                                <div className={`${styles["stat-chip"]} ${styles["anime-stat"]}`}>
                                    <div className={styles["stat-icon"]}>
                                        <i className="fas fa-trophy"></i>
                                    </div>
                                    <div className={styles["stat-content"]}>
                                        <span className={styles["stat-value"]}>
                                            {userStats.reviewsPosted >= 5 ? 'Top 10%' :
                                                userStats.reviewsPosted >= 3 ? 'Top 25%' : 'Top 50%'}
                                        </span>
                                        <span className={styles["stat-label"]}>
                                            Classement
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Exploration de Madagascar */}
                        <div className={styles["madagascar-exploration"]}>
                            <div className={styles["exploration-header"]}>
                                <h3>Votre exploration de Madagascar</h3>
                                <span className={styles["exploration-subtitle"]}>
                                    {explorationProgress.totalSites} sites découverts
                                </span>
                            </div>
                            <div className={styles["regions-progress"]}>
                                <div className={styles["region-item"]}>
                                    <div className={styles["region-info"]}>
                                        <span className={styles["region-name"]}>Antananarivo</span>
                                        <span className={styles["region-percentage"]}>
                                            {userStats.visitedSites > 0 ? '85%' : '15%'}
                                        </span>
                                    </div>
                                    <div className={styles["progress-bar"]}>
                                        <div
                                            className={styles["progress-fill"]}
                                            style={{
                                                width: userStats.visitedSites > 0 ? '85%' : '15%',
                                                background: '#2a6f97'
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                <div className={styles["region-item"]}>
                                    <div className={styles["region-info"]}>
                                        <span className={styles["region-name"]}>Nosy Be</span>
                                        <span className={styles["region-percentage"]}>
                                            {userStats.visitedSites > 0 ? '70%' : '10%'}
                                        </span>
                                    </div>
                                    <div className={styles["progress-bar"]}>
                                        <div
                                            className={styles["progress-fill"]}
                                            style={{
                                                width: userStats.visitedSites > 0 ? '70%' : '10%',
                                                background: '#00b4d8'
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                <div className={styles["region-item"]}>
                                    <div className={styles["region-info"]}>
                                        <span className={styles["region-name"]}>Toliara</span>
                                        <span className={styles["region-percentage"]}>
                                            {userStats.visitedSites > 0 ? '45%' : '5%'}
                                        </span>
                                    </div>
                                    <div className={styles["progress-bar"]}>
                                        <div
                                            className={styles["progress-fill"]}
                                            style={{
                                                width: userStats.visitedSites > 0 ? '45%' : '5%',
                                                background: '#f77f00'
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                <div className={styles["region-item"]}>
                                    <div className={styles["region-info"]}>
                                        <span className={styles["region-name"]}>Toamasina</span>
                                        <span className={styles["region-percentage"]}>
                                            {userStats.visitedSites > 0 ? '60%' : '8%'}
                                        </span>
                                    </div>
                                    <div className={styles["progress-bar"]}>
                                        <div
                                            className={styles["progress-fill"]}
                                            style={{
                                                width: userStats.visitedSites > 0 ? '60%' : '8%',
                                                background: '#28a745'
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles["exploration-summary"]}>
                                <div className={styles["summary-item"]}>
                                    <i className="fas fa-map-marker-alt"></i>
                                    <span>{explorationProgress.totalSites} sites visités</span>
                                </div>
                                <div className={styles["summary-item"]}>
                                    <i className="fas fa-road"></i>
                                    <span>{userStats.kilometersExplored} km explorés</span>
                                </div>
                                <div className={styles["summary-item"]}>
                                    <i className="fas fa-star"></i>
                                    <span>{userStats.reviewsPosted} avis publiés</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Éléments flottants */}
                    <div className={styles["floating-elements"]}>
                        <div className={styles["floating-baobab"]}></div>
                        <div className={styles["floating-leaf"]}></div>
                        <div className={styles["floating-compass"]}></div>
                    </div>
                </section>

                {/* Grid de Statistiques Principales - AVEC DONNÉES RÉELLES */}
                <section
                    className={`${styles["stats-grid-section"]} ${styles["anime-section"]}`}
                    ref={statsSectionRef}
                    id="stats-section"
                >
                    <div className={styles["section-header"]}>
                        <h2>
                            <span className={styles["title-anime"]}>
                                Vos <span className={styles["title-accent"]}>statistiques</span>
                            </span>
                        </h2>
                        <p className={styles["subtitle-anime"]}>
                            Découvrez votre activité en chiffres
                        </p>
                    </div>

                    <div className={styles["stats-grid"]} ref={statsRef}>
                        {/* Carte 1: Favoris */}
                        <div className={`${styles["stat-card"]} ${styles["anime-card"]}`}>
                            <div className={styles["card-glow"]}></div>
                            <div className={styles["stat-header"]}>
                                <div className={styles["stat-icon-wrapper"]}>
                                    <i className="fas fa-heart"></i>
                                    <div className={styles["icon-glow"]}></div>
                                </div>
                                <div className={styles["stat-trend"]}>
                                    <i className="fas fa-arrow-up"></i>
                                    <span>
                                        {userStats.favoritesCount > 10 ? '+25%' :
                                            userStats.favoritesCount > 5 ? '+15%' : '+8%'}
                                    </span>
                                </div>
                            </div>
                            <div className={styles["stat-content"]}>
                                <h3>{getAnimatedStat('favoritesCount')}</h3>
                                <p>Favoris totaux</p>
                                <div className={styles["stat-breakdown"]}>
                                    <span className={styles["breakdown-item"]}>
                                        <i className="fas fa-map-marker-alt"></i>
                                        {userStats.siteFavoritesCount} sites
                                    </span>
                                    <span className={styles["breakdown-item"]}>
                                        <i className="fas fa-globe-africa"></i>
                                        {userStats.regionFavoritesCount} régions
                                    </span>
                                </div>
                            </div>
                            <div className={styles["card-wave"]}></div>
                        </div>

                        {/* Carte 2: Voyages */}
                        <div className={`${styles["stat-card"]} ${styles["anime-card"]}`}>
                            <div className={styles["card-glow"]}></div>
                            <div className={styles["stat-header"]}>
                                <div className={styles["stat-icon-wrapper"]}>
                                    <i className="fas fa-suitcase"></i>
                                    <div className={styles["icon-glow"]}></div>
                                </div>
                                <div className={styles["stat-trend"]}>
                                    <i className="fas fa-arrow-up"></i>
                                    <span>
                                        {userStats.plannedTrips > 2 ? '+45%' :
                                            userStats.plannedTrips > 0 ? '+25%' : '+15%'}
                                    </span>
                                </div>
                            </div>
                            <div className={styles["stat-content"]}>
                                <h3>{getAnimatedStat('plannedTrips')}</h3>
                                <p>Voyages planifiés</p>
                                <div className={styles["stat-breakdown"]}>
                                    <span className={styles["breakdown-item"]}>
                                        <i className="fas fa-calendar-day"></i>
                                        {userStats.daysTraveled} jours
                                    </span>
                                    <span className={styles["breakdown-item"]}>
                                        <i className="fas fa-road"></i>
                                        {userStats.kilometersExplored} km
                                    </span>
                                </div>
                            </div>
                            <div className={styles["card-wave"]}></div>
                        </div>

                        {/* Carte 3: Exploration */}
                        <div className={`${styles["stat-card"]} ${styles["anime-card"]}`}>
                            <div className={styles["card-glow"]}></div>
                            <div className={styles["stat-header"]}>
                                <div className={styles["stat-icon-wrapper"]}>
                                    <i className="fas fa-binoculars"></i>
                                    <div className={styles["icon-glow"]}></div>
                                </div>
                                <div className={styles["stat-trend"]}>
                                    <i className="fas fa-arrow-up"></i>
                                    <span>
                                        {userStats.visitedSites > 10 ? '+32%' :
                                            userStats.visitedSites > 5 ? '+18%' : '+8%'}
                                    </span>
                                </div>
                            </div>
                            <div className={styles["stat-content"]}>
                                <h3>{getAnimatedStat('visitedSites')}</h3>
                                <p>Sites explorés</p>
                                <div className={styles["progress-ring"]}>
                                    <div className={styles["ring-bg"]}></div>
                                    <div
                                        className={styles["ring-progress"]}
                                        style={{
                                            background: `conic-gradient(#2a6f97 ${explorationProgress.percentage * 3.6}deg, #e9ecef 0deg)`
                                        }}
                                    ></div>
                                    <div className={styles["ring-text"]}>
                                        <span>{explorationProgress.percentage}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles["card-wave"]}></div>
                        </div>

                        {/* Carte 4: Contributions */}
                        <div className={`${styles["stat-card"]} ${styles["anime-card"]}`}>
                            <div className={styles["card-glow"]}></div>
                            <div className={styles["stat-header"]}>
                                <div className={styles["stat-icon-wrapper"]}>
                                    <i className="fas fa-star"></i>
                                    <div className={styles["icon-glow"]}></div>
                                </div>
                                <div className={styles["stat-trend"]}>
                                    <i className="fas fa-arrow-up"></i>
                                    <span>
                                        {userStats.reviewsPosted > 3 ? '+15%' :
                                            userStats.reviewsPosted > 0 ? '+8%' : '+5%'}
                                    </span>
                                </div>
                            </div>
                            <div className={styles["stat-content"]}>
                                <h3>{getAnimatedStat('reviewsPosted')}</h3>
                                <p>Avis postés</p>
                                <div className={styles["rating-stars"]}>
                                    {renderStars(parseFloat(calculateAverageRating()))}
                                    <span className={styles["rating-number"]}>
                                        {calculateAverageRating()}/5
                                    </span>
                                </div>
                                <small>{userStats.communityLikes} likes reçus</small>
                            </div>
                            <div className={styles["card-wave"]}></div>
                        </div>

                        {/* Carte 5: Vues d'itinéraires */}
                        <div className={`${styles["stat-card"]} ${styles["anime-card"]}`}>
                            <div className={styles["card-glow"]}></div>
                            <div className={styles["stat-header"]}>
                                <div className={styles["stat-icon-wrapper"]}>
                                    <i className="fas fa-eye"></i>
                                    <div className={styles["icon-glow"]}></div>
                                </div>
                                <div className={styles["stat-trend"]}>
                                    <i className="fas fa-arrow-up"></i>
                                    <span>
                                        {userStats.itineraryViews > 30 ? '+35%' :
                                            userStats.itineraryViews > 10 ? '+20%' : '+10%'}
                                    </span>
                                </div>
                            </div>
                            <div className={styles["stat-content"]}>
                                <h3>{getAnimatedStat('itineraryViews')}</h3>
                                <p>Vues d'itinéraires</p>
                                <div className={styles["itinerary-preview"]}>
                                    {userStats.plannedTrips > 0 ? (
                                        <>
                                            <div className={styles["itinerary-item"]}>
                                                <i className="fas fa-route"></i>
                                                <span>Voyage {userStats.plannedTrips}</span>
                                                <small>{userStats.itineraryViews} vues</small>
                                            </div>
                                            <div className={styles["itinerary-item"]}>
                                                <i className="fas fa-route"></i>
                                                <span>Vos itinéraires</span>
                                                <small>{userStats.plannedTrips} créés</small>
                                            </div>
                                        </>
                                    ) : (
                                        <div className={styles["itinerary-item"]}>
                                            <i className="fas fa-plus"></i>
                                            <span>Créer un itinéraire</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={styles["card-wave"]}></div>
                        </div>

                        {/* Carte 6: Interactions */}
                        <div className={`${styles["stat-card"]} ${styles["anime-card"]}`}>
                            <div className={styles["card-glow"]}></div>
                            <div className={styles["stat-header"]}>
                                <div className={styles["stat-icon-wrapper"]}>
                                    <i className="fas fa-users"></i>
                                    <div className={styles["icon-glow"]}></div>
                                </div>
                                <div className={styles["stat-trend"]}>
                                    <i className="fas fa-arrow-up"></i>
                                    <span>
                                        {userStats.communityLikes > 20 ? '+28%' :
                                            userStats.communityLikes > 10 ? '+18%' : '+8%'}
                                    </span>
                                </div>
                            </div>
                            <div className={styles["stat-content"]}>
                                <h3>{userStats.communityLikes}</h3>
                                <p>Interactions communauté</p>
                                <div className={styles["community-stats"]}>
                                    <div className={styles["community-item"]}>
                                        <i className="fas fa-thumbs-up"></i>
                                        <span>{userStats.communityLikes} likes</span>
                                    </div>
                                    <div className={styles["community-item"]}>
                                        <i className="fas fa-comments"></i>
                                        <span>{getCommentCount()} commentaires</span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles["card-wave"]}></div>
                        </div>
                    </div>
                </section>

                {/* Sections en grille */}
                <div className={styles["dashboard-sections"]}>
                    {/* Section Profil */}
                    <section
                        className={`${styles["dashboard-section"]} ${styles["profile-section"]} ${styles["anime-section"]}`}
                        ref={profileSectionRef}
                        id="profile-section"
                    >
                        <div className={styles["section-header"]}>
                            <div className={styles["section-title"]}>
                                <div className={styles["title-icon"]}>
                                    <i className="fas fa-user-circle"></i>
                                    <div className={styles["icon-glow"]}></div>
                                </div>
                                <div>
                                    <h2>Votre profil</h2>
                                    <p>Personnalisez votre expérience</p>
                                </div>
                            </div>
                            <div className={styles["section-actions"]}>
                                {!isEditing ? (
                                    <button
                                        className={styles["edit-profile-btn"]}
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <i className="fas fa-edit"></i> Modifier
                                    </button>
                                ) : (
                                    <div className={styles["edit-actions"]}>
                                        <button
                                            className={styles["save-btn"]}
                                            onClick={handleSaveProfile}
                                        >
                                            <i className="fas fa-check"></i> Enregistrer
                                        </button>
                                        <button
                                            className={styles["cancel-btn"]}
                                            onClick={() => setIsEditing(false)}
                                        >
                                            <i className="fas fa-times"></i> Annuler
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles["profile-content"]}>
                            <div className={styles["profile-sidebar"]}>
                                <div className={styles["avatar-section"]}>
                                    <div
                                        id="profile-avatar"
                                        className={styles["avatar"]}
                                        style={profileImage ? {
                                            backgroundImage: `url(${URL.createObjectURL(profileImage)})`
                                        } : {}}
                                    >
                                        {!profileImage && (
                                            <div className={styles["avatar-placeholder"]}>
                                                <i className="fas fa-user"></i>
                                            </div>
                                        )}
                                        <div className={styles["avatar-status"]}></div>
                                        {isEditing && (
                                            <label htmlFor="profile-image-upload" className={styles["avatar-upload"]}>
                                                <i className="fas fa-camera"></i>
                                                <input
                                                    id="profile-image-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleProfileImageChange}
                                                    style={{ display: 'none' }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                    <div className={styles["avatar-info"]}>
                                        <h3>{userData.name}</h3>
                                        <p className={styles["user-email"]}>{userData.email}</p>
                                        <div className={styles["user-badges"]}>
                                            <div className={styles["badge"]}>
                                                <i className="fas fa-shield-alt"></i>
                                                <span>Vérifié</span>
                                            </div>
                                            <div className={styles["badge"]}>
                                                <i className="fas fa-calendar-star"></i>
                                                <span>Membre depuis {new Date(userData.joinDate).getFullYear()}</span>
                                            </div>
                                            {userStats.reviewsPosted >= 3 && (
                                                <div className={styles["badge"]}>
                                                    <i className="fas fa-star"></i>
                                                    <span>Contributeur actif</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles["profile-themes"]}>
                                    <h4>
                                        <i className="fas fa-palette"></i>
                                        Thème du tableau de bord
                                    </h4>
                                    <div className={styles["theme-selector"]}>
                                        {themes.map(theme => (
                                            <button
                                                key={theme.id}
                                                className={`${styles["theme-option"]} ${currentTheme === theme.id ? styles.active : ''}`}
                                                onClick={() => handleThemeChange(theme.id)}
                                                title={theme.name}
                                            >
                                                <div
                                                    className={styles["theme-preview"]}
                                                    style={{ background: theme.gradient }}
                                                ></div>
                                                <span>{theme.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles["quick-tips"]}>
                                    <h4>
                                        <i className="fas fa-lightbulb"></i>
                                        Conseils rapides
                                    </h4>
                                    <div className={styles["tips-list"]}>
                                        {quickTips.map(tip => (
                                            <div key={tip.id} className={styles["tip-item"]}>
                                                <div className={styles["tip-icon"]}>
                                                    <i className={tip.icon}></i>
                                                </div>
                                                <p>{tip.tip}</p>
                                            </div>
                                        ))}
                                        {userStats.reviewsPosted === 0 && (
                                            <div className={styles["tip-item"]}>
                                                <div className={styles["tip-icon"]}>
                                                    <i className="fas fa-star"></i>
                                                </div>
                                                <p>Postez votre premier avis pour gagner des points</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className={styles["profile-main"]}>
                                <div className={styles["profile-form"]}>
                                    <div className={styles["form-row"]}>
                                        <div className={styles["form-group"]}>
                                            <label>
                                                <i className="fas fa-user"></i>
                                                Nom
                                            </label>
                                            <div className={styles["input-wrapper"]}>
                                                <input
                                                    type="text"
                                                    name="fullName"
                                                    value={profileData.fullName}
                                                    onChange={handleInputChange}
                                                    disabled={!isEditing}
                                                    placeholder="Votre nom complet"
                                                />
                                            </div>
                                        </div>
                                        <div className={styles["form-group"]}>
                                            <label>
                                                <i className="fas fa-envelope"></i>
                                                Email
                                            </label>
                                            <div className={styles["input-wrapper"]}>
                                                <input
                                                    type="email"
                                                    value={userData.email}
                                                    disabled
                                                    className={styles["disabled-field"]}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles["form-row"]}>
                                        <div className={styles["form-group"]}>
                                            <label>
                                                <i className="fas fa-phone"></i>
                                                Téléphone
                                            </label>
                                            <div className={styles["input-wrapper"]}>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={profileData.phone}
                                                    onChange={handleInputChange}
                                                    disabled={!isEditing}
                                                    placeholder="+261 34 00 000 00"
                                                />
                                            </div>
                                        </div>
                                        <div className={styles["form-group"]}>
                                            <label>
                                                <i className="fas fa-map-marker-alt"></i>
                                                Localisation
                                            </label>
                                            <div className={styles["input-wrapper"]}>
                                                <input
                                                    type="text"
                                                    name="address"
                                                    value={profileData.address}
                                                    onChange={handleInputChange}
                                                    disabled={!isEditing}
                                                    placeholder="Votre ville, région"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles["form-group"]}>
                                        <label>
                                            <i className="fas fa-passport"></i>
                                            Style de voyage
                                        </label>
                                        <div className={styles["travel-styles"]}>
                                            {travelStyles.map(style => (
                                                <button
                                                    key={style.id}
                                                    className={`${styles["style-option"]} ${profileData.travelStyle === style.id ? styles.active : ''}`}
                                                    onClick={() => handleTravelStyleChange(style.id)}
                                                    disabled={!isEditing}
                                                >
                                                    <div
                                                        className={styles["style-icon"]}
                                                        style={{ backgroundColor: style.color }}
                                                    >
                                                        <i className={style.icon}></i>
                                                    </div>
                                                    <span>{style.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={styles["form-group"]}>
                                        <label>
                                            <i className="fas fa-comment"></i>
                                            À propos de vous
                                        </label>
                                        <div className={styles["textarea-wrapper"]}>
                                            <textarea
                                                name="bio"
                                                value={profileData.bio}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                rows="4"
                                                placeholder="Partagez vos passions de voyage..."
                                            />
                                            <div className={styles["textarea-footer"]}>
                                                <small>{profileData.bio.length}/500 caractères</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles["form-group"]}>
                                        <label>
                                            <i className="fas fa-language"></i>
                                            Langues parlées
                                        </label>
                                        <div className={styles["languages-list"]}>
                                            {profileData.languages.map((lang, index) => (
                                                <div key={index} className={styles["language-tag"]}>
                                                    <i className="fas fa-check"></i>
                                                    {lang}
                                                    {isEditing && (
                                                        <button className={styles["remove-tag"]}>
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            {isEditing && (
                                                <button className={styles["add-language-btn"]}>
                                                    <i className="fas fa-plus"></i> Ajouter
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section Activités */}
                    <section
                        className={`${styles["dashboard-section"]} ${styles["activities-section"]} ${styles["anime-section"]}`}
                        ref={activitiesSectionRef}
                        id="activities-section"
                    >
                        <div className={styles["section-header"]}>
                            <div className={styles["section-title"]}>
                                <div className={styles["title-icon"]}>
                                    <i className="fas fa-history"></i>
                                    <div className={styles["icon-glow"]}></div>
                                </div>
                                <div>
                                    <h2>Activités récentes</h2>
                                    <p>
                                        {realActivities.length > 0
                                            ? `Vos ${realActivities.length} dernières activités`
                                            : 'Votre historique d\'exploration'}
                                    </p>
                                </div>
                            </div>
                            <Link to="/dashboard/history" className={styles["view-all-btn"]}>
                                Voir tout <i className="fas fa-arrow-right"></i>
                            </Link>
                        </div>

                        <div className={styles["activities-timeline"]}>
                            {realActivities.length > 0 ? (
                                realActivities.map((activity, index) => (
                                    <div key={activity.id} className={`${styles["activity-item"]} ${styles["anime-activity"]}`}>
                                        <div className={styles["activity-timeline"]}>
                                            <div
                                                className={styles["timeline-dot"]}
                                                style={{ backgroundColor: activity.iconColor }}
                                            ></div>
                                            {index < realActivities.length - 1 && (
                                                <div className={styles["timeline-line"]}></div>
                                            )}
                                        </div>
                                        <div
                                            className={styles["activity-icon"]}
                                            style={{
                                                background: `linear-gradient(135deg, ${activity.iconColor} 0%, ${activity.iconColor}80 100%)`
                                            }}
                                        >
                                            <i className={activity.icon}></i>
                                            <div className={styles["icon-pulse"]}></div>
                                        </div>
                                        <div className={styles["activity-content"]}>
                                            <div className={styles["activity-header"]}>
                                                <p className={styles["activity-message"]}>{activity.message}</p>
                                                <span className={styles["activity-date"]}>
                                                    {formatActivityDate(activity.date)}
                                                </span>
                                            </div>
                                            {activity.details && (
                                                <p className={styles["activity-details"]}>
                                                    <i className="fas fa-info-circle"></i>
                                                    {activity.details}
                                                </p>
                                            )}
                                            {activity.entityName && (
                                                <div className={styles["activity-entity"]}>
                                                    <i className="fas fa-tag"></i>
                                                    {activity.entityName}
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles["activity-actions"]}>
                                            <button className={styles["action-btn"]} title="Partager">
                                                <i className="fas fa-share-alt"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className={styles["no-activities-message"]}>
                                    <div className={styles["empty-state"]}>
                                        <i className="fas fa-history"></i>
                                        <h3>Aucune activité récente</h3>
                                        <p>Commencez à explorer Madagascar pour voir vos activités ici</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {realActivities.length === 0 && (
                            <div className={styles["no-activities"]}>
                                <div className={styles["no-activities-icon"]}>
                                    <i className="fas fa-history"></i>
                                    <div className={styles["icon-glow"]}></div>
                                </div>
                                <div className={styles["no-activities-content"]}>
                                    <h3>Commencez votre aventure !</h3>
                                    <p>Explorez les sites touristiques pour voir vos activités ici</p>
                                    <Link to="/search" className={styles["explore-link"]}>
                                        <i className="fas fa-compass"></i>
                                        Explorer maintenant
                                    </Link>
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                {/* Section Succès */}
                <section
                    className={`${styles["achievements-section"]} ${styles["anime-section"]}`}
                    ref={achievementsSectionRef}
                    id="achievements-section"
                >
                    <div className={styles["section-header"]}>
                        <h2>
                            <span className={styles["title-anime"]}>
                                Vos <span className={styles["title-accent"]}>succès</span>
                            </span>
                        </h2>
                        <p className={styles["subtitle-anime"]}>
                            Badges débloqués et objectifs
                        </p>
                    </div>

                    <div className={styles["achievements-grid"]}>
                        {badges.map((badge, index) => (
                            <div
                                key={badge.id}
                                className={`${styles["achievement-card"]} ${badge.earned ? styles.earned : styles.locked}`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className={styles["achievement-icon"]}>
                                    <i className={badge.icon}></i>
                                    {badge.earned && <div className={styles["badge-glow"]}></div>}
                                </div>
                                <div className={styles["achievement-content"]}>
                                    <h4>{badge.name}</h4>
                                    {badge.earned ? (
                                        <div className={styles["achievement-date"]}>
                                            <i className="fas fa-calendar-check"></i>
                                            Obtenu le {new Date(badge.date).toLocaleDateString('fr-FR')}
                                        </div>
                                    ) : (
                                        <div className={styles["achievement-progress"]}>
                                            <div className={styles["progress-bar"]}>
                                                <div
                                                    className={styles["progress-fill"]}
                                                    style={{ width: `${badge.progress}%` }}
                                                ></div>
                                            </div>
                                            <span>{badge.progress}%</span>
                                        </div>
                                    )}
                                </div>
                                <div className={styles["achievement-status"]}>
                                    {badge.earned ? (
                                        <i className="fas fa-check-circle"></i>
                                    ) : (
                                        <i className="fas fa-lock"></i>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Actions Rapides - AVEC DONNÉES RÉELLES */}
                <section className={`${styles["quick-actions-section"]} ${styles["anime-section"]}`}>
                    <div className={styles["section-header"]}>
                        <h2>
                            <span className={styles["title-anime"]}>
                                Actions <span className={styles["title-accent"]}>rapides</span>
                            </span>
                        </h2>
                        <p className={styles["subtitle-anime"]}>
                            Continuez votre exploration
                        </p>
                    </div>

                    <div className={styles["quick-actions-grid"]}>
                        <Link to="/search" className={`${styles["action-card"]} ${styles["anime-card"]}`}>
                            <div className={styles["action-icon"]}>
                                <i className="fas fa-search"></i>
                                <div className={styles["icon-glow"]}></div>
                            </div>
                            <h3>Rechercher des sites</h3>
                            <p>
                                {userStats.searchHistory > 0
                                    ? `Basé sur vos ${userStats.searchHistory} recherches`
                                    : 'Découvrez de nouveaux endroits incroyables'}
                            </p>
                            <div className={styles["action-footer"]}>
                                <span className={styles["action-badge"]}>
                                    <i className="fas fa-bolt"></i>
                                    Rapide
                                </span>
                                <i className="fas fa-arrow-right"></i>
                            </div>
                        </Link>

                        <Link to="/my-trip" className={`${styles["action-card"]} ${styles["anime-card"]}`}>
                            <div className={styles["action-icon"]}>
                                <i className="fas fa-suitcase"></i>
                                <div className={styles["icon-glow"]}></div>
                            </div>
                            <h3>Mon voyage</h3>
                            <p>
                                {userStats.plannedTrips > 0
                                    ? `${userStats.plannedTrips} voyages planifiés`
                                    : 'Planifiez votre premier voyage'}
                            </p>
                            <div className={styles["action-footer"]}>
                                <span className={styles["action-badge"]}>
                                    <i className="fas fa-fire"></i>
                                    {userStats.plannedTrips > 0 ? 'Actif' : 'Nouveau'}
                                </span>
                                <i className="fas fa-arrow-right"></i>
                            </div>
                        </Link>

                        <Link to="/dashboard/favorites" className={`${styles["action-card"]} ${styles["anime-card"]}`}>
                            <div className={styles["action-icon"]}>
                                <i className="fas fa-heart"></i>
                                <div className={styles["icon-glow"]}></div>
                            </div>
                            <h3>Mes favoris</h3>
                            <p>
                                {userStats.favoritesCount > 0
                                    ? `${userStats.favoritesCount} éléments sauvegardés`
                                    : 'Ajoutez vos premiers favoris'}
                            </p>
                            <div className={styles["action-footer"]}>
                                <span className={styles["action-badge"]}>
                                    <i className="fas fa-star"></i>
                                    {userStats.favoritesCount || '0'}
                                </span>
                                <i className="fas fa-arrow-right"></i>
                            </div>
                        </Link>

                        <Link to="/dashboard/reviews" className={`${styles["action-card"]} ${styles["anime-card"]}`}>
                            <div className={styles["action-icon"]}>
                                <i className="fas fa-star"></i>
                                <div className={styles["icon-glow"]}></div>
                            </div>
                            <h3>Mes avis</h3>
                            <p>
                                {userStats.reviewsPosted > 0
                                    ? `${userStats.reviewsPosted} avis publiés`
                                    : 'Partagez votre première expérience'}
                            </p>
                            <div className={styles["action-footer"]}>
                                <span className={styles["action-badge"]}>
                                    <i className="fas fa-comment"></i>
                                    {userStats.reviewsPosted || '0'}
                                </span>
                                <i className="fas fa-arrow-right"></i>
                            </div>
                        </Link>

                        <Link to="/settings/preferences" className={`${styles["action-card"]} ${styles["anime-card"]}`}>
                            <div className={styles["action-icon"]}>
                                <i className="fas fa-sliders-h"></i>
                                <div className={styles["icon-glow"]}></div>
                            </div>
                            <h3>Préférences</h3>
                            <p>
                                {userStats.favoritesCount > 0
                                    ? 'Personnalisez vos recommandations'
                                    : 'Dites-nous ce que vous aimez'}
                            </p>
                            <div className={styles["action-footer"]}>
                                <span className={styles["action-badge"]}>
                                    <i className="fas fa-cog"></i>
                                    Perso
                                </span>
                                <i className="fas fa-arrow-right"></i>
                            </div>
                        </Link>

                        <Link to="/dashboard/search-history" className={`${styles["action-card"]} ${styles["anime-card"]}`}>
                            <div className={styles["action-icon"]}>
                                <i className="fas fa-history"></i>
                                <div className={styles["icon-glow"]}></div>
                            </div>
                            <h3>Historique recherche</h3>
                            <p>
                                {userStats.searchHistory > 0
                                    ? `${userStats.searchHistory} recherches effectuées`
                                    : 'Vos recherches apparaîtront ici'}
                            </p>
                            <div className={styles["action-footer"]}>
                                <span className={styles["action-badge"]}>
                                    <i className="fas fa-search"></i>
                                    {userStats.searchHistory || '0'}
                                </span>
                                <i className="fas fa-arrow-right"></i>
                            </div>
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className={styles["dashboard-footer"]}>
                <div className={styles["footer-content"]}>
                    <div className={styles["footer-brand"]}>
                        <div className={styles["footer-logo"]}>
                            <img src={logos} alt="Logo MadaTour" />
                            <div className={styles["logo-aura"]}></div>
                        </div>
                        <p>
                            Votre compagnon d'aventure à Madagascar<br />
                            Explorez, découvrez, partagez
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
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className={styles["footer-links"]}>
                        <div className={styles["links-column"]}>
                            <h4>Votre compte</h4>
                            <ul>
                                <li><Link to="/profile"><i className="fas fa-user"></i> Profil</Link></li>
                                <li><Link to="/settings"><i className="fas fa-cog"></i> Paramètres</Link></li>
                                <li><Link to="/security"><i className="fas fa-shield-alt"></i> Sécurité</Link></li>
                                <li><Link to="/help"><i className="fas fa-question-circle"></i> Aide</Link></li>
                            </ul>
                        </div>
                        <div className={styles["links-column"]}>
                            <h4>Exploration</h4>
                            <ul>
                                <li><Link to="/search"><i className="fas fa-search"></i> Rechercher</Link></li>
                                <li><Link to="/regions"><i className="fas fa-map"></i> Régions</Link></li>
                                <li><Link to="/activities"><i className="fas fa-hiking"></i> Activités</Link></li>
                                <li><Link to="/itineraries"><i className="fas fa-route"></i> Itinéraires</Link></li>
                            </ul>
                        </div>
                        <div className={styles["links-column"]}>
                            <h4>Communauté</h4>
                            <ul>
                                <li><Link to="/community"><i className="fas fa-users"></i> Forum</Link></li>
                                <li><Link to="/reviews"><i className="fas fa-star"></i> Avis</Link></li>
                                <li><Link to="/photos"><i className="fas fa-camera"></i> Photos</Link></li>
                                <li><Link to="/events"><i className="fas fa-calendar-alt"></i> Événements</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className={styles["footer-bottom"]}>
                    <p className={styles["copyright"]}>
                        <i className="fas fa-copyright"></i> {new Date().getFullYear()} MadaTour. Tous droits réservés.
                        <span className={styles["made-with"]}>
                            Fait avec <i className="fas fa-heart"></i> à Madagascar
                        </span>
                    </p>
                    <div className={styles["footer-actions"]}>
                        <Link to="/privacy">Confidentialité</Link>
                        <Link to="/terms">Conditions</Link>
                        <Link to="/contact">Contact</Link>
                    </div>
                </div>

                {/* Animation du footer */}
                <div className={styles["footer-wave"]}></div>
            </footer>

            {/* Bouton retour en haut */}
            <button
                className={`${styles["back-to-top"]} ${showBackToTop ? styles.visible : ''}`}
                onClick={scrollToTop}
                aria-label="Retour en haut"
            >
                <i className="fas fa-chevron-up"></i>
                <div className={styles["back-to-top-glow"]}></div>
            </button>

            <div className={styles["global-floating-elements"]}>
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className={styles["floating-particle"]}
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`
                        }}
                    ></div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;