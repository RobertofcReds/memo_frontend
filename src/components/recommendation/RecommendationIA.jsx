// RecommendationIA.jsx - Version complète avec intégration API Flask
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './RecommendationIA.module.css';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../Notification/NotificationProvider';
import api from '../../api';
import logos from '../../images/logo-site4.png';
import RecommendationCard from './RecommendationCard';
import WeatherAlert from './WeatherAlert';
import AlternativeSuggestion from './AlternativeSuggestion';
import recommendationAIService from '../../api/recommendationAI';

const RecommendationIA = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [recommendations, setRecommendations] = useState({
        basedOnSearch: [],
        basedOnFavorites: [],
        basedOnHistory: [],
        popular: [],
        similarToTrips: [],
        preferences: []
    });
    const [weatherAlerts, setWeatherAlerts] = useState([]);
    const [tripAlerts, setTripAlerts] = useState([]);
    const [alternatives, setAlternatives] = useState([]);
    const [lastSearch, setLastSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [mlStats, setMlStats] = useState(null);
    const [currentTheme, setCurrentTheme] = useState('default');

    const { user, isAuthenticated, logout } = useAuth();
    const { showSuccess, showError, showInfo } = useNotification();
    const navigate = useNavigate();

    // ============================================
    // FONCTIONS D'ADAPTATION DES DONNÉES
    // ============================================

    // Adapter les données de l'API Flask au format des cartes
    const adaptApiDataToCardFormat = (apiSites) => {
        if (!apiSites || !Array.isArray(apiSites)) return [];

        return apiSites.map(site => ({
            id: site.id || site.id_site || Math.random(),
            nom: site.nom || 'Site sans nom',
            region: site.region || 'Madagascar',
            description: site.description || site.description_courte || 'Découvrez ce magnifique site touristique de Madagascar',
            // Convertir les tags en array
            tags: site.tags
                ? (Array.isArray(site.tags) ? site.tags : site.tags.split(';'))
                : (site.sous_types_tags
                    ? site.sous_types_tags.split(';')
                    : [site.type || site.type_activite || 'Tourisme'].filter(Boolean)),
            // Convertir le prix en euros (si en Ariary)
            prix: site.prix
                ? (site.prix > 1000 ? Math.round(site.prix / 5000) : site.prix)
                : (site.cout_estime ? Math.round(site.cout_estime / 5000) : 0),
            // Note
            rating: site.note || site.note_moyenne || 4.0,
            // Score de correspondance
            matchScore: site.score ? Math.round(site.score * 100) : Math.floor(Math.random() * 10 + 85),
            // Image (avec fallback) - on garde l'image mais on va la remplacer par des icônes dans l'affichage
            image: site.image || site.image_url || `https://source.unsplash.com/400x300/?madagascar,${encodeURIComponent(site.nom || 'tourisme')}`,
            // Type pour filtrage
            type: site.type || site.type_activite || 'Général',
            // Tags bruts pour la carte
            tags_raw: site.tags || site.sous_types_tags || '',
            // Ajouter une durée estimée si non présente
            duree: site.duree || '2-3 jours',
            // Ajouter un nombre d'avis si non présent
            avis: site.avis || Math.floor(Math.random() * 500 + 100)
        }));
    };

    // Thèmes disponibles
    const themes = [
        { id: 'default', nom: 'Classique', gradient: 'linear-gradient(135deg, #2a6f97 0%, #00b4d8 100%)' },
        { id: 'adventure', nom: 'Aventure', gradient: 'linear-gradient(135deg, #f77f00 0%, #ff9e40 100%)' },
        { id: 'nature', nom: 'Nature', gradient: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' },
        { id: 'ocean', nom: 'Océan', gradient: 'linear-gradient(135deg, #00b4d8 0%, #90e0ef 100%)' },
        { id: 'premium', nom: 'Premium', gradient: 'linear-gradient(135deg, #7209b7 0%, #b5179e 100%)' }
    ];

    // Données mock pour le fallback
    const mockSites = [
        {
            id: 1,
            nom: "Nosy Be",
            description: "L'île aux parfums, paradis des plages avec des eaux turquoise et une nature luxuriante",
            image: "https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6",
            region: "Diana",
            prix: 250,
            type: "Plage",
            tags: ["Plage", "Détente", "Plongée", "Île"],
            rating: 4.8,
            matchScore: 98,
            avis: 1245,
            duree: "3-5 jours"
        },
        {
            id: 2,
            nom: "Allée des Baobabs",
            description: "Les majestueux baobabs de Madagascar, site emblématique pour des couchers de soleil inoubliables",
            image: "https://upload.wikimedia.org/wikipedia/commons/8/81/Sunset_Baobab_Avenue_Morondava_Madagascar_-_panoramio.jpg",
            region: "Menabe",
            prix: 180,
            type: "Nature",
            tags: ["Nature", "Photos", "Coucher de soleil", "Arbres"],
            rating: 4.9,
            matchScore: 95,
            avis: 2100,
            duree: "1 journée"
        },
        {
            id: 3,
            nom: "Parc National de l'Isalo",
            description: "Paysages spectaculaires de canyons, piscines naturelles et une biodiversité unique",
            image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
            region: "Ihorombe",
            prix: 200,
            type: "Parc National",
            tags: ["Randonnée", "Nature", "Baignade", "Canyons"],
            rating: 4.7,
            matchScore: 92,
            avis: 890,
            duree: "2-3 jours"
        },
        {
            id: 4,
            nom: "Île Sainte-Marie",
            description: "Observation des baleines à bosse, plages paradisiaques et ambiance authentique",
            image: "https://upload.wikimedia.org/wikipedia/commons/1/13/Princess_Bora_Lodge%2C_%C3%8Ele_Sainte-Marie_%283958615912%29.jpg",
            region: "Analanjirofo",
            prix: 280,
            type: "Plage",
            tags: ["Baleines", "Plage", "Romantique", "Île"],
            rating: 4.8,
            matchScore: 96,
            avis: 1560,
            duree: "4-7 jours"
        },
        {
            id: 5,
            nom: "Tsingy de Bemaraha",
            description: "Formations rocheuses uniques au monde, classées au patrimoine mondial de l'UNESCO",
            image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4",
            region: "Melaky",
            prix: 220,
            type: "Aventure",
            tags: ["Aventure", "Géologie", "UNESCO", "Randonnée"],
            rating: 4.9,
            matchScore: 94,
            avis: 780,
            duree: "2-3 jours"
        },
        {
            id: 6,
            nom: "Antananarivo",
            description: "Capitale historique, mélange unique de culture malgache et d'architecture coloniale",
            image: "https://upload.wikimedia.org/wikipedia/commons/c/c9/Antananarivo_september_2015_01.JPG",
            region: "Analamanga",
            prix: 150,
            type: "Culture",
            tags: ["Culture", "Histoire", "Ville", "Marchés"],
            rating: 4.5,
            matchScore: 88,
            avis: 2340,
            duree: "2-3 jours"
        },
        {
            id: 7,
            nom: "Morondava",
            description: "Porte d'entrée vers l'allée des Baobabs, plages et mangroves",
            image: "https://images.unsplash.com/photo-1551632811-561732d1e306",
            region: "Menabe",
            prix: 160,
            type: "Plage",
            tags: ["Plage", "Baobabs", "Coucher de soleil"],
            rating: 4.6,
            matchScore: 85,
            avis: 670,
            duree: "2-3 jours"
        },
        {
            id: 8,
            nom: "Fort Dauphin",
            description: "Station balnéaire réputée, idéale pour le kite surf et la détente",
            image: "https://images.unsplash.com/photo-1566438480900-0609be27a4be",
            region: "Anosy",
            prix: 190,
            type: "Plage",
            tags: ["Plage", "Kite surf", "Nature", "Lagon"],
            rating: 4.7,
            matchScore: 87,
            avis: 520,
            duree: "3-5 jours"
        }
    ];

    // ============================================
    // GESTION DES ÉVÉNEMENTS
    // ============================================

    // Gestion du bouton retour en haut
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Charger les statistiques du modèle ML au démarrage
    useEffect(() => {
        const loadMLStats = async () => {
            try {
                const stats = await recommendationAIService.getStats();
                setMlStats(stats);
                console.log('Statistiques ML chargées:', stats);
            } catch (error) {
                console.error('Erreur chargement stats ML:', error);
            }
        };
        loadMLStats();
    }, []);

    // Simuler la dernière recherche
    useEffect(() => {
        const lastSearchTerm = localStorage.getItem('lastSearch') || '';
        setLastSearch(lastSearchTerm);
    }, []);

    // Charger les données au montage
    useEffect(() => {
        if (isAuthenticated) {
            fetchUserData();
        } else {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    // ============================================
    // LOGIQUE MÉTIER PRINCIPALE
    // ============================================

    const getMLRecommendations = async (userData, filterType = 'all') => {
        try {
            // Déterminer les critères basés sur les données utilisateur et le filtre
            const criteria = {};

            console.log(`🔍 Génération de recommandations - Filtre: ${filterType}`);

            // ============================================
            // 1. RECOMMANDATIONS BASÉES SUR LA RECHERCHE
            // ============================================
            if (filterType === 'search' || filterType === 'all') {
                if (userData.lastSearch) {
                    criteria.search_query = userData.lastSearch;
                    console.log('📝 Basé sur recherche:', userData.lastSearch);
                }
            }

            if (filterType === 'preferences' || filterType === 'all') {
                if (userData.preferences ) {
                    criteria.type = userData.preferences.type_site;
                    console.log('📝 Basé sur preferences:', userData.preferences);
                }
            }

            // ============================================
            // 2. RECOMMANDATIONS BASÉES SUR LES FAVORIS
            // ============================================
            if (filterType === 'favorites' || filterType === 'all') {
                if (userData.favorites && userData.favorites.length > 0) {
                    // Prendre les 3 premiers favoris pour avoir plus de diversité
                    const favoriteSites = userData.favorites.slice(0, 3);

                    // Analyser les types de favoris
                    const favTypes = {};
                    favoriteSites.forEach(fav => {
                        const type = fav.type_activite || fav.type;
                        if (type) {
                            favTypes[type] = (favTypes[type] || 0) + 1;
                        }
                    });

                    // Prendre le type le plus fréquent dans les favoris
                    if (Object.keys(favTypes).length > 0) {
                        const topFavType = Object.keys(favTypes).reduce((a, b) =>
                            favTypes[a] > favTypes[b] ? a : b);
                        criteria.type = topFavType;
                    }
                    console.log('criteria type', criteria.type)

                    // Utiliser le premier favori comme référence
                    const firstFavorite = favoriteSites[0];
                    const siteName = firstFavorite.nom_site || firstFavorite.nom;
                    if (siteName) {
                        criteria.site_reference = siteName;
                    }

                    console.log('❤️ Basé sur favoris:', favoriteSites.length, 'sites');
                }
            }

            // ============================================
            // 3. RECOMMANDATIONS BASÉES SUR L'HISTORIQUE
            // ============================================
            if (filterType === 'history' || filterType === 'all') {
                if (userData.history && userData.history.length > 0) {
                    // Compter les types dans l'historique (en ignorant les actions)
                    const typeCount = {};
                    const actionTypes = ['add_to_trip', 'visit', 'like', 'comment'];

                    userData.history.forEach(item => {
                        // Vérifier si le type est dans la liste des actions
                        if (actionTypes.includes(item.type)) {
                            // Si c'est une action qui nous intéresse, on récupère le type_activite
                            if (item.type_activite) {
                                typeCount[item.type_activite] = (typeCount[item.type_activite] || 0) + 1;
                            }
                        }
                    });

                    if (Object.keys(typeCount).length > 0) {
                        const mostFrequentType = Object.keys(typeCount).reduce((a, b) =>
                            typeCount[a] > typeCount[b] ? a : b);
                        criteria.type = mostFrequentType;
                        console.log('📊 Basé sur historique:', mostFrequentType);
                    }

                    // Utiliser le premier favori comme référence
                    console.log(userData.history[0])
                    const firstHis = userData.history[0];
                    const siteName = firstHis.entity_name || firstHis.nom;
                    console.log('siteName', siteName)
                    if (siteName) {
                        criteria.site_reference = siteName;
                    }
                }
            }

            // ============================================
            // 4. RECOMMANDATIONS BASÉES SUR LES ITINÉRAIRES
            // ============================================
            if (filterType === 'trips' || filterType === 'all') {
                if (userData.trips && userData.trips.length > 0) {
                    // Analyser tous les itinéraires, pas seulement le premier
                    const regions = {};
                    const budgets = [];

                    userData.trips.forEach(trip => {
                        const region = trip.destination_region || trip.region;
                        if (region) {
                            regions[region] = (regions[region] || 0) + 1;
                        }
                        if (trip.budget_max) {
                            budgets.push(trip.budget_max);
                        }
                    });

                    // Prendre la région la plus fréquente
                    if (Object.keys(regions).length > 0) {
                        const topRegion = Object.keys(regions).reduce((a, b) =>
                            regions[a] > regions[b] ? a : b);
                        criteria.type = topRegion;
                    }

                    // Prendre le budget moyen
                    if (budgets.length > 0) {
                        criteria.prix_max = Math.round(budgets.reduce((a, b) => a + b, 0) / budgets.length);
                    }

                    console.log('✈️ Basé sur itinéraires:', userData.trips.length, 'voyages');
                }
            }

            // ============================================
            // 5. RECOMMANDATIONS BASÉES SUR LES AVIS
            // ============================================
            if (filterType === 'reviews' || filterType === 'all') {
                if (userData.reviews && userData.reviews.length > 0) {
                    const validReviews = userData.reviews.filter(r => r.note);
                    if (validReviews.length > 0) {
                        const avgRating = validReviews.reduce((sum, r) => sum + r.note, 0) / validReviews.length;
                        criteria.review_rating_min = Math.max(3.5, Math.min(5, avgRating - 0.3));

                        // Voir s'il y a des types préférés dans les avis
                        const reviewedTypes = {};
                        validReviews.forEach(review => {
                            if (review.type_activite) {
                                reviewedTypes[review.type_activite] = (reviewedTypes[review.type_activite] || 0) + 1;
                            }
                        });

                        if (Object.keys(reviewedTypes).length > 0) {
                            criteria.review_type = Object.keys(reviewedTypes).reduce((a, b) =>
                                reviewedTypes[a] > reviewedTypes[b] ? a : b);
                        }
                    }
                    console.log('⭐ Basé sur avis:', validReviews.length, 'avis');
                }
            }

            // ============================================
            // 6. RECOMMANDATIONS POPULAIRES (si aucun critère)
            // ============================================
            if (filterType === 'popular' || filterType === 'all') {
                if (userData.popular && userData.popular.length > 0) {
                    const validReviews = userData.popular.filter(r => r.note);
                    criteria.type = userData.popular[0].type ; // Prendre le type du premier site populaire
                    criteria.site_reference = userData.popular[0].site_nom || userData.popular[0].nom; // Prendre le nom du premier site populaire comme référence
                    console.log('⭐ Basé sur avis:', validReviews.length, 'avis');
                }
            }

            // Toujours demander assez de recommandations
            criteria.n_recommendations = 12;

            console.log('📦 Critères finaux envoyés à l\'API:', criteria);

            // Appeler l'API Flask pour obtenir des recommandations
            const response = await recommendationAIService.getRecommendationsByCriteria(criteria);

            // Adapter les données au format des cartes
            let adaptedRecommendations = adaptApiDataToCardFormat(response.recommendations || []);

            // Si pas de résultats mais qu'on a des critères, réessayer sans certains filtres
            if (adaptedRecommendations.length === 0 && Object.keys(criteria).length > 2) {
                console.log('⚠️ Pas de résultats, tentative avec critères allégés');

                // Créer une copie allégée des critères
                const lightCriteria = { n_recommendations: 12 };
                if (criteria.type) lightCriteria.type = criteria.type;
                if (criteria.region) lightCriteria.region = criteria.region;

                const fallbackResponse = await recommendationAIService.getRecommendationsByCriteria(lightCriteria);
                adaptedRecommendations = adaptApiDataToCardFormat(fallbackResponse.recommendations || []);
            }

            return adaptedRecommendations;

        } catch (error) {
            console.error('❌ Erreur recommandations ML:', error);
            return [];
        }
    };

    const updateRecommendationsByFilter = (recommendations, filterType) => {
        // Mélanger un peu pour éviter d'avoir toujours les mêmes
        console.log('Recommandation réçus : ',recommendations)
        const shuffled = [...recommendations].sort(() => Math.random() - 0.5);

        switch (filterType) {
            case 'search':
                setRecommendations({
                    basedOnSearch: shuffled.slice(0, 8),
                    basedOnFavorites: [],
                    basedOnHistory: [],
                    popular: [],
                    similarToTrips: [],
                    preferences: []
                });
                break;

            case 'favorites':
                setRecommendations({
                    basedOnSearch: [],
                    basedOnFavorites: shuffled.slice(0, 8),
                    basedOnHistory: [],
                    popular: [],
                    similarToTrips: [],
                    preferences: []
                });
                break;

            case 'history':
                setRecommendations({
                    basedOnSearch: [],
                    basedOnFavorites: [],
                    basedOnHistory: shuffled.slice(0, 8),
                    popular: [],
                    similarToTrips: [],
                    preferences: []
                });
                break;

            case 'trips':
                setRecommendations({
                    basedOnSearch: [],
                    basedOnFavorites: [],
                    basedOnHistory: [],
                    popular: [],
                    similarToTrips: shuffled.slice(0, 8),
                    preferences: []
                });
                break;
            case 'preferences':
                setRecommendations({
                    basedOnSearch: [],
                    basedOnFavorites: [],
                    basedOnHistory: [],
                    popular: [],
                    similarToTrips: [],
                    preferences: shuffled.slice(0, 8)
                });
                break;

            default: // 'all'
                setRecommendations({
                    basedOnSearch: shuffled.slice(0, 3),
                    basedOnFavorites: shuffled.slice(3, 6),
                    basedOnHistory: shuffled.slice(6, 9),
                    popular: shuffled.slice(0, 4),
                    similarToTrips: shuffled.slice(4, 7),
                    preferences: shuffled.slice(7, 10)
                });
        }
    };

    const fetchUserData = async (filterType = 'all') => {
        if (!isAuthenticated || !user) return;

        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const userId = user.id;

            console.log(`🔄 Récupération des données utilisateur avec filtre: ${filterType}`);

            // Récupérer toutes les données nécessaires selon le filtre
            const promises = [];

            // Toujours récupérer les données de base
            promises.push(
                api.get(`api/user/favorites/${userId}`).catch(() => ({ data: [] })),
                api.get(`api/user/history/${userId}`).catch(() => ({ data: [] })),
                api.getItineraires(userId).catch(() => ({ data: [] })),
                api.get(`api/user/reviews/${userId}`).catch(() => ({ data: [] })),
                api.get(`api/user/popular/${userId}`).catch(() => ({ data: [] })),
                api.get(`api/user/preferences/${userId}`).catch(() => ({ data: [] }))
            );

            // Récupérer la dernière recherche si nécessaire
            if (filterType === 'search' || filterType === 'all') {
                const lastSearch = localStorage.getItem('lastSearch') || '';
                setLastSearch(lastSearch);
            }

            const [favRes, historyRes, tripsRes, reviewsRes, popularRes, preferencesRes] = await Promise.all(promises);

            console.log("preferences data : ", preferencesRes.data)

            // Préparer les données utilisateur
            const userData = {
                favorites: favRes.data || [],
                history: historyRes.data || [],
                trips: tripsRes.data || [],
                reviews: reviewsRes.data || [],
                popular: popularRes.data || [],
                lastSearch: filterType === 'search' ? lastSearch : null,
                preferences: preferencesRes.data || []
            };

            console.log('📊 Données récupérées:', {
                favoris: userData.favorites.length,
                historique: userData.history.length,
                itinéraires: userData.trips.length,
                avis: userData.reviews.length,
                populaires: userData.popular.length,
                preferences: userData.preferences
            });

            // Obtenir les recommandations ML avec le filtre spécifié
            let mlRecommendations = await getMLRecommendations(userData, filterType);

            // Fallback aux données mock si nécessaire
            if (!mlRecommendations || mlRecommendations.length === 0) {
                console.log('⚠️ Utilisation des données mock');
                mlRecommendations = adaptApiDataToCardFormat(mockSites);
            }

            // Organiser les recommandations
            updateRecommendationsByFilter(mlRecommendations, filterType);

            // Vérifier les alertes météo (simulé)
            checkWeatherAlerts(tripsRes.data);

            // Vérifier les alertes de voyage (dates)
            checkTripAlerts(tripsRes.data);

        } catch (error) {
            console.error('❌ Erreur:', error);
            showError('Erreur lors de la génération des recommandations');
            loadMockData();
        } finally {
            setIsLoading(false);
        }
    };

    // Utiliser les données mock (fallback)
    const loadMockData = () => {
        const adaptedMock = adaptApiDataToCardFormat(mockSites);
        setRecommendations({
            basedOnSearch: adaptedMock.slice(0, 3),
            basedOnFavorites: adaptedMock.slice(3, 6),
            basedOnHistory: adaptedMock.slice(6, 9),
            popular: adaptedMock.slice(0, 4),
            similarToTrips: adaptedMock.slice(4, 7),
            preferences: adaptedMock.slice(7, 10)
        });
    };

    // Vérifier les alertes météo
    const checkWeatherAlerts = (trips) => {
        const mockAlerts = [
            {
                id: 1,
                type: 'cyclone',
                destination: 'Nosy Be',
                date: '2024-04-15',
                message: '⚠️ Alerte cyclone : conditions météo défavorables prévues pour Nosy Be',
                alternatives: ['Île Sainte-Marie', 'Morondava', 'Fort Dauphin']
            },
            {
                id: 2,
                type: 'pluie',
                destination: 'Antananarivo',
                date: '2024-04-10',
                message: '🌧️ Fortes pluies annoncées à Antananarivo cette semaine',
                alternatives: ['Antsirabe', 'Fianarantsoa', 'Morondava']
            },
            {
                id: 3,
                type: 'chaleur',
                destination: 'Toliara',
                date: '2024-04-12',
                message: '☀️ Canicule : températures très élevées à Toliara',
                alternatives: ['Fort Dauphin', 'Fianarantsoa', 'Ranomafana']
            }
        ];

        const relevantAlerts = mockAlerts.filter(alert =>
            trips.some(trip => {
                const dest = trip.destination || trip.destination_nom || '';
                return dest.toLowerCase().includes(alert.destination.toLowerCase());
            })
        );

        setWeatherAlerts(relevantAlerts);
    };

    // Vérifier les alertes de voyage (dates proches)
    const checkTripAlerts = (trips) => {
        const now = new Date();
        const alerts = [];

        trips.forEach(trip => {
            if (trip.date_depart) {
                const departDate = new Date(trip.date_depart);
                const daysUntil = Math.ceil((departDate - now) / (1000 * 60 * 60 * 24));

                if (daysUntil <= 7 && daysUntil > 0) {
                    alerts.push({
                        id: trip.id,
                        destination: trip.destination || 'votre voyage',
                        days: daysUntil,
                        message: `✈️ Votre départ pour ${trip.destination || 'ce voyage'} est dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''} !`
                    });
                }
            }
        });

        setTripAlerts(alerts);
    };

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        setSearchTerm(''); // Reset recherche textuelle
        fetchUserData(filter); // Recharger avec le nouveau filtre
    };


    // Rafraîchir les recommandations
    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchUserData();
        setRefreshing(false);
        showSuccess('✨ Recommandations mises à jour avec succès !');
    };

    // Gérer le clic sur une recommandation
    const handleRecommendationClick = (site) => {
        navigate(`/site/${site.id}`);
    };

    // Gérer le clic sur une alternative
    const handleAlternativeClick = (destination) => {
        navigate(`/search?q=${encodeURIComponent(destination)}`);
        showInfo(`Recherche d'alternatives à ${destination}`);
    };

    // Gérer la connexion
    const handleLogin = () => navigate('/login');
    const handleRegister = () => navigate('/register');

    const handleLogout = async () => {
        try {
            await logout();
            showSuccess('👋 Déconnexion réussie ! À bientôt !');
            navigate('/');
        } catch (error) {
            console.error('Erreur de déconnexion:', error);
            showError('Erreur lors de la déconnexion');
        }
    };

    const handleThemeChange = (themeId) => {
        setCurrentTheme(themeId);
        showSuccess(`Thème ${themes.find(t => t.id === themeId)?.nom} appliqué !`);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Filtrer les recommandations selon l'onglet actif et la recherche
    const filteredRecommendations = () => {
        let allSites = [];

        switch (activeFilter) {
            case 'all':
                allSites = [
                    ...(recommendations.popular || []),
                    ...(recommendations.basedOnFavorites || []),
                    ...(recommendations.basedOnHistory || []),
                    ...(recommendations.similarToTrips || []),
                    ...(recommendations.preferences || [])
                ];
                break;
            case 'popular':
                allSites = recommendations.popular || [];
                break;
            case 'favorites':
                allSites = recommendations.basedOnFavorites || [];
                break;
            case 'history':
                allSites = recommendations.basedOnHistory || [];
                break;
            case 'trips':
                allSites = recommendations.similarToTrips || [];
                break;
            case 'preferences':
                allSites = recommendations.preferences || [];
                break;
            default:
                allSites = [];
        }

        // Filtrer par recherche
        if (searchTerm && allSites.length > 0) {
            return allSites.filter(site =>
                site.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                site.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
                site.type.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Éliminer les doublons (par id)
        const uniqueSites = [];
        const seenIds = new Set();

        allSites.forEach(site => {
            if (!seenIds.has(site.id)) {
                seenIds.add(site.id);
                uniqueSites.push(site);
            }
        });

        return uniqueSites;
    };

    // ============================================
    // RENDU CONDITIONNEL
    // ============================================

    // Si l'utilisateur n'est pas connecté
    if (!isAuthenticated) {
        return (
            <div className={`${styles["recommendation-page"]} ${styles[currentTheme]}`}>
                {/* Header amélioré */}
                <header className={`${styles["header"]} ${styles.animatedHeader}`}>
                    <div className={styles["logo-container"]}>
                        <Link to="/" className={styles["logo"]}>
                            <div className={styles["logo-animation"]}>
                                <img src={logos} alt="MadaTour Logo" className={styles["logo-img"]} />
                                <div className={styles["logo-glow"]}></div>
                            </div>
                            <span className={styles["logo-text"]}>
                                <span className={styles["logo-primary"]}>Mada</span>
                                <span className={styles["logo-accent"]}>Tour</span>
                            </span>
                        </Link>
                    </div>

                    <div className={styles["header-right"]}>
                        <div className={styles["theme-selector"]}>
                            {themes.map(theme => (
                                <button
                                    key={theme.id}
                                    className={`${styles["theme-dot"]} ${currentTheme === theme.id ? styles.active : ''}`}
                                    style={{ background: theme.gradient }}
                                    onClick={() => handleThemeChange(theme.id)}
                                    title={theme.nom}
                                />
                            ))}
                        </div>
                    </div>

                    <nav className={styles["nav-container"]}>
                        <div className={styles["nav-links"]}>
                            <Link to="/" className={styles["nav-link"]}>
                                <i className="fas fa-home"></i> Accueil
                            </Link>
                            <Link to="/search" className={styles["nav-link"]}>
                                <i className="fas fa-search"></i> Recherche
                            </Link>
                            <Link to="/regions" className={styles["nav-link"]}>
                                <i className="fas fa-map-marked-alt"></i> Régions
                            </Link>
                        </div>
                    </nav>
                </header>

                <div className={styles["login-required"]}>
                    <i className="fas fa-robot"></i>
                    <h3>Assistant IA de Recommandation</h3>
                    <p>
                        Connectez-vous pour bénéficier de recommandations personnalisées basées sur vos favoris,
                        votre historique de recherche et vos itinéraires de voyage.
                    </p>
                    <div className={styles["login-buttons"]}>
                        <button onClick={handleLogin} className={`${styles["login-btn"]} ${styles["primary"]}`}>
                            <i className="fas fa-sign-in-alt"></i> Se connecter
                        </button>
                        <button onClick={handleRegister} className={`${styles["login-btn"]} ${styles["secondary"]}`}>
                            <i className="fas fa-user-plus"></i> S'inscrire
                        </button>
                    </div>
                </div>

                {/* Footer amélioré */}
                <footer className={styles["footer"]}>
                    <div className={styles["footer-wave"]}></div>
                    <div className={styles["footer-content"]}>
                        <div className={styles["footer-main"]}>
                            <div className={styles["footer-brand"]}>
                                <Link to="/" className={styles["footer-logo"]}>
                                    <img src={logos} alt="MadaTour" />
                                    <span>Mada<span className={styles["accent"]}>Tour</span></span>
                                </Link>
                                <p>Votre guide intelligent pour explorer Madagascar</p>
                                <div className={styles["social-links"]}>
                                    <a href="#" className={styles["social-link"]}><i className="fab fa-facebook-f"></i></a>
                                    <a href="#" className={styles["social-link"]}><i className="fab fa-instagram"></i></a>
                                    <a href="#" className={styles["social-link"]}><i className="fab fa-twitter"></i></a>
                                    <a href="#" className={styles["social-link"]}><i className="fab fa-youtube"></i></a>
                                </div>
                            </div>

                            <div className={styles["footer-links"]}>
                                <div className={styles["links-column"]}>
                                    <h4>Exploration</h4>
                                    <ul>
                                        <li><Link to="/search">Recherche</Link></li>
                                        <li><Link to="/regions">Régions</Link></li>
                                        <li><Link to="/activities">Activités</Link></li>
                                    </ul>
                                </div>
                                <div className={styles["links-column"]}>
                                    <h4>Compte</h4>
                                    <ul>
                                        <li><Link to="/dashboard">Dashboard</Link></li>
                                        <li><Link to="/dashboard/favorites">Favoris</Link></li>
                                        <li><Link to="/my-trip">Mes voyages</Link></li>
                                    </ul>
                                </div>
                                <div className={styles["links-column"]}>
                                    <h4>Aide</h4>
                                    <ul>
                                        <li><Link to="/about">À propos</Link></li>
                                        <li><Link to="/contact">Contact</Link></li>
                                        <li><Link to="/privacy">Confidentialité</Link></li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className={styles["footer-bottom"]}>
                            <p className={styles["copyright"]}>
                                <i className="fas fa-copyright"></i> 2026 MadaTour. Tous droits réservés.
                            </p>
                            <p className={styles["made-with"]}>
                                Fait avec <i className="fas fa-heart"></i> à Madagascar
                            </p>
                        </div>
                    </div>

                    <div className={styles["footer-stars"]}>
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className={styles["star"]}
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 5}s`
                                }}
                            ></div>
                        ))}
                    </div>
                </footer>
            </div>
        );
    }

    // Si chargement en cours
    if (isLoading) {
        return (
            <div className={`${styles["recommendation-page"]} ${styles[currentTheme]}`}>
                <header className={`${styles["header"]} ${styles.animatedHeader}`}>
                    <div className={styles["logo-container"]}>
                        <Link to="/" className={styles["logo"]}>
                            <div className={styles["logo-animation"]}>
                                <img src={logos} alt="MadaTour Logo" className={styles["logo-img"]} />
                                <div className={styles["logo-glow"]}></div>
                            </div>
                            <span className={styles["logo-text"]}>
                                <span className={styles["logo-primary"]}>Mada</span>
                                <span className={styles["logo-accent"]}>Tour</span>
                            </span>
                        </Link>
                    </div>

                    <div className={styles["header-right"]}>
                        <div className={styles["theme-selector"]}>
                            {themes.map(theme => (
                                <button
                                    key={theme.id}
                                    className={`${styles["theme-dot"]} ${currentTheme === theme.id ? styles.active : ''}`}
                                    style={{ background: theme.gradient }}
                                    onClick={() => handleThemeChange(theme.id)}
                                    title={theme.nom}
                                />
                            ))}
                        </div>
                    </div>
                </header>

                <div className={styles["loading-ai"]}>
                    <div className={styles["loading-spinner"]}></div>
                    <p>Analyse de vos préférences en cours...</p>
                    {mlStats && (
                        <p className={styles["stats-info"]}>
                            {mlStats.total_sites} sites disponibles dans notre base
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // ============================================
    // RENDU PRINCIPAL (utilisateur connecté)
    // ============================================
    return (
        <div className={`${styles["recommendation-page"]} ${styles[currentTheme]}`}>
            {/* Header amélioré avec sélecteur de thème et meilleure organisation */}
            <header className={`${styles["header"]} ${styles.animatedHeader}`}>
                <div className={styles["header-left"]}>
                    <div className={styles["logo-container"]}>
                        <Link to="/" className={styles["logo"]}>
                            <div className={styles["logo-animation"]}>
                                <img src={logos} alt="MadaTour Logo" className={styles["logo-img"]} />
                                <div className={styles["logo-glow"]}></div>
                            </div>
                            <span className={styles["logo-text"]}>
                                <span className={styles["logo-primary"]}>Mada</span>
                                <span className={styles["logo-accent"]}>Tour</span>
                            </span>
                        </Link>
                    </div>

                    <nav className={styles["nav-links"]}>
                        <Link to="/" className={styles["nav-link"]}>
                            <i className="fas fa-home"></i> Accueil
                        </Link>
                        <Link to="/search" className={styles["nav-link"]}>
                            <i className="fas fa-search"></i> Recherche
                        </Link>
                        <Link to="/regions" className={styles["nav-link"]}>
                            <i className="fas fa-map-marked-alt"></i> Régions
                        </Link>
                        <Link to="/dashboard" className={styles["nav-link"]}>
                            <i className="fas fa-tachometer-alt"></i> Dashboard
                        </Link>
                    </nav>
                </div>

                <div className={styles["header-right"]}>
                    <div className={styles["theme-selector"]}>
                        {themes.map(theme => (
                            <button
                                key={theme.id}
                                className={`${styles["theme-dot"]} ${currentTheme === theme.id ? styles.active : ''}`}
                                style={{ background: theme.gradient }}
                                onClick={() => handleThemeChange(theme.id)}
                                title={theme.nom}
                            />
                        ))}
                    </div>

                    <div className={styles["user-info-enhanced"]}>
                        <div className={styles["user-avatar"]}>
                            <i className="fas fa-user-circle"></i>
                            <div className={styles["avatar-status"]}></div>
                        </div>
                        <span className={styles["user-name"]}>{user?.name || 'Utilisateur'}</span>
                        <div className={styles["user-dropdown-enhanced"]}>
                            <button className={styles["dropdown-toggle-enhanced"]}>
                                <i className="fas fa-chevron-down"></i>
                            </button>
                            <div className={styles["dropdown-menu-enhanced"]}>
                                <Link to="/dashboard" className={styles["dropdown-item"]}>
                                    <i className="fas fa-tachometer-alt"></i> Tableau de bord
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

            {/* Hero Section */}
            <section className={styles["hero-section"]}>
                <div className={styles["hero-content"]}>
                    <h1>
                        <span className={styles["text-gradient"]}>
                            Recommandations <span className={styles["text-highlight"]}>Personnalisées</span>
                        </span>
                    </h1>
                    <p>Basées sur vos goûts, vos favoris et votre historique de navigation</p>

                    {/* Statistiques ML */}
                    {mlStats && (
                        <div className={styles["ml-stats"]}>
                            <span><i className="fas fa-database"></i> {mlStats.total_sites} sites</span>
                            {mlStats.note_moyenne && (
                                <span><i className="fas fa-star"></i> Note moy. {mlStats.note_moyenne.toFixed(1)}/5</span>
                            )}
                        </div>
                    )}

                    <div className={styles["search-bar"]}>
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Filtrer les recommandations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className={styles["filter-tabs"]}>
                        <button
                            className={`${styles["filter-tab"]} ${activeFilter === 'all' ? styles.active : ''}`}
                            onClick={() => handleFilterChange('all')}
                        >
                            <i className="fas fa-globe"></i> Toutes
                        </button>
                        <button
                            className={`${styles["filter-tab"]} ${activeFilter === 'popular' ? styles.active : ''}`}
                            onClick={() => handleFilterChange('popular')}
                        >
                            <i className="fas fa-fire"></i> Populaires
                        </button>
                        <button
                            className={`${styles["filter-tab"]} ${activeFilter === 'favorites' ? styles.active : ''}`}
                            onClick={() => handleFilterChange('favorites')}
                        >
                            <i className="fas fa-heart"></i> Basé sur favoris
                        </button>
                        <button
                            className={`${styles["filter-tab"]} ${activeFilter === 'history' ? styles.active : ''}`}
                            onClick={() => handleFilterChange('history')}
                        >
                            <i className="fas fa-history"></i> Basé sur historique
                        </button>
                        <button
                            className={`${styles["filter-tab"]} ${activeFilter === 'trips' ? styles.active : ''}`}
                            onClick={() => handleFilterChange('trips')}
                        >
                            <i className="fas fa-suitcase"></i> Similaire à vos voyages
                        </button>
                        <button
                            className={`${styles["filter-tab"]} ${activeFilter === 'preferences' ? styles.active : ''}`}
                            onClick={() => handleFilterChange('preferences')}
                        >
                            <i className="fas fa-sliders-h"></i> Basé sur vos préférences
                        </button>
                    </div>

                    <div className={styles["action-buttons"]}>
                        <button
                            className={styles["refresh-btn"]}
                            onClick={handleRefresh}
                            disabled={refreshing}
                        >
                            <i className={`fas fa-sync-alt ${refreshing ? 'fa-spin' : ''}`}></i>
                            {refreshing ? 'Rafraîchissement...' : 'Rafraîchir les recommandations'}
                        </button>
                    </div>
                </div>
            </section>

            <div className={styles["recommendation-container"]}>
                {/* Alertes météo */}
                {weatherAlerts.length > 0 && weatherAlerts.map(alert => (
                    <WeatherAlert
                        key={alert.id}
                        alert={alert}
                        onAlternativeClick={handleAlternativeClick}
                    />
                ))}

                {/* Alertes de voyage */}
                {tripAlerts.length > 0 && (
                    <div className={styles["travel-alerts"]}>
                        {tripAlerts.map(alert => (
                            <div key={alert.id} className={styles["travel-alert"]}>
                                <div className={styles["alert-icon-small"]}>
                                    <i className="fas fa-calendar-check"></i>
                                </div>
                                <div className={styles["alert-content"]}>
                                    <h4>Rappel de voyage</h4>
                                    <p>{alert.message}</p>
                                </div>
                                <button
                                    className={styles["alert-action"]}
                                    onClick={() => navigate(`/my-trip/${alert.id}`)}
                                >
                                    Voir détails
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Recommandations basées sur la recherche */}
                {lastSearch && recommendations.basedOnSearch.length > 0 && (
                    <div className={styles["recommendations-section"]}>
                        <div className={styles["section-title"]}>
                            <i className="fas fa-search"></i>
                            <h3>Basé sur votre recherche "{lastSearch}"</h3>
                            <span>{recommendations.basedOnSearch.length} suggestions</span>
                        </div>
                        <div className={styles["recommendations-grid"]}>
                            {recommendations.basedOnSearch.map((site, index) => (
                                <div 
                                    key={`search-${site.id}`} 
                                    className={`${styles["recommendation-card"]} ${styles["enhanced-card"]}`}
                                    onClick={() => handleRecommendationClick(site)}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    {/* Badge */}
                                    <div className={`${styles["card-badge"]} ${styles["search"]}`}>
                                        <i className="fas fa-search"></i> Recherche
                                    </div>

                                    {/* Placeholder image avec icône stylisée */}
                                    <div className={styles["card-image-placeholder"]}>
                                        <div className={styles["placeholder-icon"]}>
                                            {site.type === 'Plage' ? <i className="fas fa-umbrella-beach"></i> :
                                             site.type === 'Nature' ? <i className="fas fa-leaf"></i> :
                                             site.type === 'Parc National' ? <i className="fas fa-tree"></i> :
                                             site.type === 'Aventure' ? <i className="fas fa-mountain"></i> :
                                             site.type === 'Culture' ? <i className="fas fa-landmark"></i> :
                                             site.type === 'Plongée' ? <i className="fas fa-water"></i> :
                                             site.type === 'Faune' ? <i className="fas fa-paw"></i> :
                                             <i className="fas fa-map-marked-alt"></i>}
                                        </div>
                                        <div className={styles["placeholder-glow"]}></div>
                                        <div className={styles["match-score-badge"]}>
                                            <i className="fas fa-heart"></i> {site.matchScore || 95}%
                                        </div>
                                    </div>

                                    <div className={styles["card-content"]}>
                                        <h4 className={styles["card-title"]}>{site.nom}</h4>
                                        
                                        <div className={styles["card-location"]}>
                                            <i className="fas fa-map-marker-alt"></i>
                                            <span>{site.region || 'Madagascar'}</span>
                                        </div>

                                        <div className={styles["card-rating"]}>
                                            {[...Array(5)].map((_, i) => (
                                                <i 
                                                    key={i} 
                                                    className={`${i < Math.floor(site.rating || 4.5) ? 'fas' : 'far'} fa-star ${styles["star-animation"]}`}
                                                ></i>
                                            ))}
                                            <span className={styles["rating-number"]}>{(site.rating || 4.5).toFixed(1)}</span>
                                            <span className={styles["rating-count"]}>({site.avis || 500})</span>
                                        </div>

                                        <p className={styles["card-description"]}>
                                            {site.description?.substring(0, 80)}...
                                        </p>

                                        <div className={styles["card-tags"]}>
                                            {(site.tags || ['Tourisme']).slice(0, 3).map((tag, i) => (
                                                <span key={i} className={styles["tag"]}>#{tag}</span>
                                            ))}
                                        </div>

                                        <div className={styles["card-footer"]}>
                                            <button className={styles["details-btn"]} onClick={(e) => { e.stopPropagation(); handleRecommendationClick(site); }}>
                                                Voir <i className="fas fa-arrow-right"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Toutes les recommandations */}
                <div className={styles["recommendations-section"]}>
                    <div className={styles["section-title"]}>
                        <i className="fas fa-star"></i>
                        <h3>{searchTerm ? 'Résultats de recherche' : 'Recommandations pour vous'}</h3>
                        <span>{filteredRecommendations().length} sites</span>
                    </div>

                    {filteredRecommendations().length > 0 ? (
                        <div className={styles["recommendations-grid"]}>
                            {filteredRecommendations().map((site, index) => (
                                <div 
                                    key={`${activeFilter}-${site.id}-${index}`} 
                                    className={`${styles["recommendation-card"]} ${styles["enhanced-card"]}`}
                                    onClick={() => handleRecommendationClick(site)}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    {/* Badge selon le filtre */}
                                    {activeFilter !== 'all' && (
                                        <div className={`${styles["card-badge"]} ${styles[activeFilter]}`}>
                                            {activeFilter === 'popular' ? <><i className="fas fa-fire"></i> Populaire</> :
                                             activeFilter === 'favorites' ? <><i className="fas fa-heart"></i> Favoris</> :
                                             activeFilter === 'history' ? <><i className="fas fa-history"></i> Historique</> :
                                             activeFilter === 'trips' ? <><i className="fas fa-suitcase"></i> Voyage</> :
                                             <><i className="fas fa-star"></i> Recommandé</>}
                                        </div>
                                    )}

                                    {/* Placeholder image avec icône stylisée */}
                                    <div className={styles["card-image-placeholder"]}>
                                        <div className={styles["placeholder-icon"]}>
                                            {site.type === 'Plage' ? <i className="fas fa-umbrella-beach"></i> :
                                             site.type === 'Nature' ? <i className="fas fa-leaf"></i> :
                                             site.type === 'Parc National' ? <i className="fas fa-tree"></i> :
                                             site.type === 'Aventure' ? <i className="fas fa-mountain"></i> :
                                             site.type === 'Culture' ? <i className="fas fa-landmark"></i> :
                                             site.type === 'Plongée' ? <i className="fas fa-water"></i> :
                                             site.type === 'Faune' ? <i className="fas fa-paw"></i> :
                                             <i className="fas fa-map-marked-alt"></i>}
                                        </div>
                                        <div className={styles["placeholder-glow"]}></div>
                                        <div className={styles["match-score-badge"]}>
                                            <i className="fas fa-heart"></i> {site.matchScore || 95}%
                                        </div>
                                    </div>

                                    <div className={styles["card-content"]}>
                                        <h4 className={styles["card-title"]}>{site.nom}</h4>
                                        
                                        <div className={styles["card-location"]}>
                                            <i className="fas fa-map-marker-alt"></i>
                                            <span>{site.region || 'Madagascar'}</span>
                                        </div>

                                        <div className={styles["card-rating"]}>
                                            {[...Array(5)].map((_, i) => (
                                                <i 
                                                    key={i} 
                                                    className={`${i < Math.floor(site.rating || 4.5) ? 'fas' : 'far'} fa-star ${styles["star-animation"]}`}
                                                ></i>
                                            ))}
                                            <span className={styles["rating-number"]}>{(site.rating || 4.5).toFixed(1)}</span>
                                            <span className={styles["rating-count"]}>({site.avis || 500})</span>
                                        </div>

                                        <p className={styles["card-description"]}>
                                            {site.description?.substring(0, 80)}...
                                        </p>

                                        <div className={styles["card-tags"]}>
                                            {(site.tags || ['Tourisme']).slice(0, 3).map((tag, i) => (
                                                <span key={i} className={styles["tag"]}>#{tag}</span>
                                            ))}
                                        </div>

                                        <div className={styles["card-footer"]}>
                                            <button className={styles["details-btn"]} onClick={(e) => { e.stopPropagation(); handleRecommendationClick(site); }}>
                                                Voir <i className="fas fa-arrow-right"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles["no-results"]}>
                            <i className="fas fa-search"></i>
                            <h3>Aucun résultat trouvé</h3>
                            <p>Essayez d'autres filtres ou modifiez votre recherche</p>
                            <button
                                className={styles["reset-filters-btn"]}
                                onClick={() => {
                                    setActiveFilter('all');
                                    setSearchTerm('');
                                }}
                            >
                                Réinitialiser les filtres
                            </button>
                        </div>
                    )}
                </div>

                {/* Suggestions alternatives (si alertes météo) */}
                {weatherAlerts.length > 0 && (
                    <div className={styles["alternatives-section"]}>
                        <div className={styles["section-title"]}>
                            <i className="fas fa-random"></i>
                            <h3>Alternatives recommandées</h3>
                            <span>Solutions de remplacement</span>
                        </div>
                        <div className={styles["alternatives-grid"]}>
                            {weatherAlerts.map(alert =>
                                alert.alternatives.map((alt, index) => (
                                    <AlternativeSuggestion
                                        key={`${alert.id}-${index}`}
                                        destination={alt}
                                        originalDestination={alert.destination}
                                        reason={alert.type === 'cyclone' ? 'Cyclone' : 'Intempéries'}
                                        onClick={() => handleAlternativeClick(alt)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer amélioré ultra-riche */}
            <footer className={styles["footer"]}>
                <div className={styles["footer-wave"]}></div>
                <div className={styles["footer-content"]}>
                    <div className={styles["footer-main"]}>
                        <div className={styles["footer-brand"]}>
                            <Link to="/" className={styles["footer-logo"]}>
                                <img src={logos} alt="MadaTour" />
                                <span>Mada<span className={styles["accent"]}>Tour</span></span>
                            </Link>
                            <p className={styles["footer-description"]}>
                                Votre guide intelligent pour explorer Madagascar avec des recommandations personnalisées basées sur l'intelligence artificielle.
                            </p>
                            <div className={styles["social-links"]}>
                                <a href="#" className={styles["social-link"]}><i className="fab fa-facebook-f"></i></a>
                                <a href="#" className={styles["social-link"]}><i className="fab fa-instagram"></i></a>
                                <a href="#" className={styles["social-link"]}><i className="fab fa-twitter"></i></a>
                                <a href="#" className={styles["social-link"]}><i className="fab fa-youtube"></i></a>
                                <a href="#" className={styles["social-link"]}><i className="fab fa-tiktok"></i></a>
                            </div>
                        </div>

                        <div className={styles["footer-links"]}>
                            <div className={styles["links-column"]}>
                                <h4>Exploration</h4>
                                <ul>
                                    <li><Link to="/search"><i className="fas fa-search"></i> Recherche</Link></li>
                                    <li><Link to="/regions"><i className="fas fa-map-marked-alt"></i> Régions</Link></li>
                                    <li><Link to="/activities"><i className="fas fa-hiking"></i> Activités</Link></li>
                                    <li><Link to="/blog"><i className="fas fa-book-open"></i> Conseils</Link></li>
                                </ul>
                            </div>
                            <div className={styles["links-column"]}>
                                <h4>Services IA</h4>
                                <ul>
                                    <li><Link to="/recommendations"><i className="fas fa-robot"></i> Recommandations</Link></li>
                                    <li><Link to="/dashboard/favorites"><i className="fas fa-heart"></i> Mes favoris</Link></li>
                                    <li><Link to="/my-trip"><i className="fas fa-suitcase"></i> Planificateur</Link></li>
                                    <li><Link to="/dashboard/history"><i className="fas fa-history"></i> Historique</Link></li>
                                </ul>
                            </div>
                            <div className={styles["links-column"]}>
                                <h4>Aide</h4>
                                <ul>
                                    <li><Link to="/about"><i className="fas fa-info-circle"></i> À propos</Link></li>
                                    <li><Link to="/contact"><i className="fas fa-envelope"></i> Contact</Link></li>
                                    <li><Link to="/faq"><i className="fas fa-question-circle"></i> FAQ</Link></li>
                                    <li><Link to="/privacy"><i className="fas fa-shield-alt"></i> Confidentialité</Link></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className={styles["footer-bottom"]}>
                        <p className={styles["copyright"]}>
                            <i className="fas fa-copyright"></i> 2026 MadaTour. Tous droits réservés.
                        </p>
                        <p className={styles["made-with"]}>
                            Fait avec <i className="fas fa-heart"></i> à Madagascar
                        </p>
                    </div>
                </div>

                <div className={styles["footer-stars"]}>
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className={styles["star"]}
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 5}s`
                            }}
                        ></div>
                    ))}
                </div>
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
        </div>
    );
};

export default RecommendationIA;