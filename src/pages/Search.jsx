import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { addFavorite, removeFavorite } from '../api';
import logos from '../images/logo-site4.png';
import styles from './css/Search.module.css';
import clsx from 'clsx';
import MapButton from './MapButton';
import TripButton from './TripButton';
import { useNotification } from '../components/Notification/NotificationProvider';
import { useAuth } from '../context/AuthContext';
import { formattedGermanCurrency } from '../utils/basicFunction';

// Composant IA de recommandation (chargement différé)
const RecommendationAI = React.lazy(() => import('../components/recommendation/RecommendationAI'));

// Données pour les suggestions de recherche
const searchSuggestions = [
    'Parc National', 'Plage', 'Cascade', 'Site historique', 'Montagne', 'Forêt',
    'Lac', 'Rivière', 'Culture', 'Aventure', 'Randonnée', 'Observation faune'
];

// Témoignages pour la page de recherche
const searchTestimonials = [
    {
        id: 1,
        name: 'Thomas R.',
        comment: "La recherche par région m'a permis de découvrir des sites incroyables que je ne connaissais pas !",
        avatar: '👨',
        rating: 5,
        location: 'Paris, France',
        date: 'Novembre 2024'
    },
    {
        id: 2,
        name: 'Sophie M.',
        comment: "Les filtres par type sont super pratiques. J'ai trouvé exactement ce que je cherchais en quelques clics !",
        avatar: '👩',
        rating: 4,
        location: 'Lyon, France',
        date: 'Octobre 2024'
    },
    {
        id: 3,
        name: 'Marc L.',
        comment: "L'interface de recherche est intuitive et les résultats sont pertinents. Vraiment bien pensé !",
        avatar: '👨',
        rating: 5,
        location: 'Marseille, France',
        date: 'Septembre 2024'
    },
    {
        id: 4,
        name: 'Élodie P.',
        comment: "J'adore la fonction de partage et les favoris. Je peux sauvegarder mes découvertes facilement.",
        avatar: '👩',
        rating: 5,
        location: 'Bordeaux, France',
        date: 'Août 2024'
    }
];

// Messages par défaut pour le chatbot
const defaultChatMessages = [
    {
        id: 1,
        text: "Bonjour ! Je suis votre assistant spécialisé dans la recherche de sites touristiques à Madagascar. Je peux vous aider à :",
        sender: 'bot',
        timestamp: new Date(),
        options: [
            "Trouver des sites par région",
            "Filtrer par type d'attraction",
            "Découvrir des sites méconnus",
            "Planifier votre itinéraire"
        ]
    },
    {
        id: 2,
        text: "Dites-moi ce que vous cherchez ou choisissez une option ci-dessus !",
        sender: 'bot',
        timestamp: new Date()
    }
];

const Search = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [expandedCard, setExpandedCard] = useState(null);
    const [sites, setSites] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [reviewSite, setReviewSite] = useState(null);
    const [reviewText, setReviewText] = useState('');
    const [reviewNote, setReviewNote] = useState(3);
    const [regions, setRegions] = useState([]);
    const [siteTypes, setSiteTypes] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchLogTimeout, setSearchLogTimeout] = useState(null);
    const [lastSearchLogged, setLastSearchLogged] = useState('');
    const [shareModal, setShareModal] = useState(null);
    const [showRecommendationAI, setShowRecommendationAI] = useState(false);
    const [showChatbox, setShowChatbox] = useState(false);
    const [chatMessages, setChatMessages] = useState(defaultChatMessages);
    const [chatInput, setChatInput] = useState('');
    const [isChatbotTyping, setIsChatbotTyping] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [searchStats, setSearchStats] = useState({
        total: 0,
        nature: 0,
        culture: 0,
        adventure: 0
    });
    const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
    const [sortBy, setSortBy] = useState('pertinence');

    // Utilisation du hook useAuth pour l'authentification
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { showSuccess, showError, showWarning, showLoading } = useNotification();

    // Récupération du token et userId depuis le contexte ou localStorage
    const token = localStorage.getItem('token');
    const userId = user?.id || localStorage.getItem('userId');
    const currency = user?.currencyRate || localStorage.getItem('currencyRate')

    // État de connexion synchronisé avec le contexte
    const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated);

    // Synchroniser isLoggedIn avec isAuthenticated
    useEffect(() => {
        setIsLoggedIn(isAuthenticated);
    }, [isAuthenticated]);

    useEffect(() => {
        console.log("Info user", user);
    }, [user]);

    // Références pour les animations
    const testimonialsRef = useRef(null);
    const chatMessagesRef = useRef(null);
    const chatInputRef = useRef(null);
    const autoScrollRef = useRef(null);

    // Gestion du bouton retour en haut
    useEffect(() => {
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

    // Scroll automatique des messages du chat
    useEffect(() => {
        if (chatMessagesRef.current && chatMessages.length > 0) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const getSites = async () => {
        setIsLoading(true);
        try {
            const result = await api.get('/api/site', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSites(result.data);

            // Calculer les statistiques
            const stats = {
                total: result.data.length,
                nature: result.data.filter(site => site.libele_type?.includes('Nature') || site.libele_type?.includes('Parc')).length,
                culture: result.data.filter(site => site.libele_type?.includes('Culture') || site.libele_type?.includes('Historique')).length,
                adventure: result.data.filter(site => site.libele_type?.includes('Aventure') || site.libele_type?.includes('Sport')).length
            };
            setSearchStats(stats);

        } catch (error) {
            console.error('Erreur lors de la récupération des sites :', error);
            showError('Erreur lors du chargement des sites');
        } finally {
            setIsLoading(false);
        }
    };

    const getFavorite = async () => {
        if (!userId || !token) return; // Guard clause

        try {
            const result = await api.get(`api/user/likedFavorites/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const resultedited = result.data.map(fav => fav.entite_id);
            setFavorites(resultedited || []);
        } catch (error) {
            console.error('Erreur lors de la récupération des favoris :', error);
        }
    };

    const getRegion = async () => {
        if (!token) return; // Guard clause

        try {
            const result = await api.get(`api/user/regions/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRegions(result.data || []);
        } catch (error) {
            console.error('Erreur lors de la récupération des régions :', error);
        }
    };

    const getType = async () => {
        try {
            const result = await api.get(`api/type`);
            setSiteTypes(result.data || []);
        } catch (error) {
            console.error('Erreur lors de la récupération des types :', error);
        }
    };

    useEffect(() => {
        getSites();
        getFavorite();
        getRegion();
        getType();
    }, []); // Dépendances vides car exécuté une seule fois

    const toggleFavorite = async (siteId) => {
        if (!userId || !token) {
            showWarning('Veuillez vous connecter pour ajouter aux favoris');
            return;
        }

        const wasFavorite = favorites.includes(siteId);

        try {
            if (wasFavorite) {
                await removeFavorite(userId, siteId, 'site');
                showSuccess('Site retiré des favoris');
                setFavorites(prev => prev.filter(id => id !== siteId));
            } else {
                const site = sites.find(s => s.id_site === siteId);
                if (!site) {
                    showError('Site non trouvé');
                    return;
                }

                const favoriteData = {
                    userId: parseInt(userId),
                    entite_id: parseInt(siteId),
                    type: 'site',
                    nom: site.nom,
                    cout_estime: site.cout_estime || 0,
                    image: site.image || '',
                    id_region: site.id_region || null,
                    id_type: site.id_type || null
                };

                await addFavorite(userId, favoriteData);
                showSuccess('Site ajouté aux favoris');
                setFavorites(prev => [...prev, siteId]);
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour des favoris :', error);
            showError('Erreur lors de la mise à jour des favoris');
        }
    };

    const toggleReview = (siteId) => {
        if (!userId || !token) {
            showWarning('Veuillez vous connecter pour laisser un avis');
            return;
        }
        setReviewSite(reviewSite === siteId ? null : siteId);
        setReviewText('');
        setReviewNote(3);
    };

    const submitReview = async (siteId) => {
        if (!reviewText.trim()) {
            showWarning('Veuillez écrire un avis avant de soumettre.');
            return;
        }

        if (!userId || !token) {
            showWarning('Veuillez vous connecter pour poster un avis.');
            return;
        }

        setIsSubmitting(true);

        try {
            await api.post('/api/user/review', {
                userId: parseInt(userId),
                entite_id: parseInt(siteId),
                review: reviewText.trim(),
                note: reviewNote
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setReviewText('');
            setReviewNote(3);
            setReviewSite(null);
            showSuccess('Avis soumis avec succès !');

        } catch (error) {
            console.error('Erreur lors de la soumission de l\'avis :', error);
            showError('Erreur lors de la soumission de l\'avis.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleExpand = (id) => {
        setExpandedCard(expandedCard === id ? null : id);
    };

    const getRegionName = (regionId) => {
        const region = regions.find(r => r.id_region === regionId);
        return region ? region.nom : 'Région inconnue';
    };

    const getRegionBestPeriod = (regionId) => {
        const region = regions.find(r => r.id_region === regionId);
        return region ? region.meilleure_periode : 'Non spécifié';
    };

    // Fonction pour filtrer les sites
    const filteredSites = sites.filter(site => {
        const matchesSearch = site.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            site.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRegion = !selectedRegion || site.id_region.toString() === selectedRegion;
        const matchesType = !selectedType || site.id_type.toString() === selectedType;

        return matchesSearch && matchesRegion && matchesType;
    });

    // Trier les sites
    const sortedSites = [...filteredSites].sort((a, b) => {
        switch (sortBy) {
            case 'nom':
                return a.nom.localeCompare(b.nom);
            case 'cout':
                return (b.cout_estime || 0) - (a.cout_estime || 0);
            default:
                return 0;
        }
    });

    // Fonction pour enregistrer une recherche (avec debounce)
    const logSearch = () => {
        if (searchLogTimeout) {
            clearTimeout(searchLogTimeout);
        }

        const searchSignature = `${searchTerm}_${selectedRegion}_${selectedType}`;

        if (!searchTerm && !selectedRegion && !selectedType) return;
        if (searchSignature === lastSearchLogged) return;

        const timeoutId = setTimeout(() => {
            setLastSearchLogged(searchSignature);
        }, 1000);

        setSearchLogTimeout(timeoutId);
    };

    useEffect(() => {
        logSearch();
        return () => {
            if (searchLogTimeout) {
                clearTimeout(searchLogTimeout);
            }
        };
    }, [searchTerm, selectedRegion, selectedType]);

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

    // Fonction de déconnexion propre
    const handleLogout = async () => {
        try {
            await logout(); // Utilise la fonction du contexte
            showSuccess('Déconnexion réussie !');
            navigate('/');
        } catch (error) {
            console.error('Erreur de déconnexion:', error);
            showError('Erreur lors de la déconnexion');
        }
    };

    // Gestion de la chatbox
    const toggleChatbox = () => {
        setShowChatbox(!showChatbox);
        if (!showChatbox && chatInputRef.current) {
            setTimeout(() => {
                chatInputRef.current.focus();
            }, 100);
        }
    };

    const handleChatSubmit = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userMessage = {
            id: chatMessages.length + 1,
            text: chatInput,
            sender: 'user',
            timestamp: new Date()
        };

        setChatMessages(prev => [...prev, userMessage]);
        setChatInput('');
        setIsChatbotTyping(true);

        // Simulation de réponse du bot
        setTimeout(() => {
            const responses = [
                "Pour trouver des sites spécifiques, utilisez les filtres par région et par type. Je peux vous suggérer quelques régions populaires : Analamanga, Atsinanana, ou Diana.",
                "Recherchez-vous plutôt des sites naturels ou culturels ? Madagascar a une grande variété de parcs nationaux, plages, et sites historiques.",
                "Vous pouvez utiliser la barre de recherche pour trouver des sites par nom ou par mot-clé. Essayez 'baobab', 'lémurien', ou 'plage' pour commencer.",
                "Pour une recherche plus précise, combinez les filtres de région et de type. Par exemple : Région 'Atsimo-Andrefana' et Type 'Parc National'.",
                "N'oubliez pas d'utiliser la fonction 'Ajouter aux favoris' pour sauvegarder les sites qui vous intéressent !"
            ];

            const botMessage = {
                id: chatMessages.length + 2,
                text: responses[Math.floor(Math.random() * responses.length)],
                sender: 'bot',
                timestamp: new Date()
            };

            setChatMessages(prev => [...prev, botMessage]);
            setIsChatbotTyping(false);
        }, 1500);
    };

    const handleQuickOptionClick = (option) => {
        const userMessage = {
            id: chatMessages.length + 1,
            text: option,
            sender: 'user',
            timestamp: new Date()
        };

        setChatMessages(prev => [...prev, userMessage]);
        setIsChatbotTyping(true);

        setTimeout(() => {
            let response = "";
            switch (option) {
                case "Trouver des sites par région":
                    response = "Les régions les plus populaires sont : \n• Analamanga (Antananarivo) \n• Atsinanana (Côte Est) \n• Diana (Nord) \n• Atsimo-Andrefana (Sud). \nQuelle région vous intéresse ?";
                    break;
                case "Filtrer par type d'attraction":
                    response = "Types d'attractions disponibles : \n• Parcs Nationaux \n• Sites Historiques \n• Plages \n• Cascades \n• Réserves Naturelles. \nQuel type cherchez-vous ?";
                    break;
                case "Découvrir des sites méconnus":
                    response = "Sites moins connus mais magnifiques : \n• Parc National de Marojejy \n• Tsingy de Namoroka \n• Lac Tritriva \n• Forêt de Kirindy. \nSouhaitez-vous plus de détails sur l'un d'eux ?";
                    break;
                case "Planifier votre itinéraire":
                    response = "Pour planifier un itinéraire, je vous recommande : \n1. Choisir 3-4 sites dans la même région \n2. Vérifier les distances \n3. Utiliser 'Ajouter à mon voyage' \n4. Consulter nos conseils de voyage. \nVoulez-vous que je vous aide à commencer ?";
                    break;
                default:
                    response = "Je peux vous aider avec cela. Pourriez-vous me donner plus de détails sur ce que vous cherchez ?";
            }

            const botMessage = {
                id: chatMessages.length + 2,
                text: response,
                sender: 'bot',
                timestamp: new Date()
            };

            setChatMessages(prev => [...prev, botMessage]);
            setIsChatbotTyping(false);
        }, 1000);
    };

    // Fonction pour retourner en haut de la page
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
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

    // Fonction pour partager sur les réseaux sociaux
    const shareOnSocialMedia = (platform) => {
        if (!shareModal) return;

        const shareUrl = `${window.location.origin}/site/${shareModal.id}`;
        const shareText = `Découvrez ${shareModal.name} à ${shareModal.region} sur MadaTour !`;

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

    if (isLoading) {
        return (
            <div className={styles["loading-container"]}>
                <div className={styles["loading-spinner"]}></div>
                <p>Chargement des sites touristiques...</p>
            </div>
        );
    }

    return (
        <div className={styles["search-page-container"]}>
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
                        <Link to="/search" className={`${styles["nav-link"]} ${styles.active}`}>
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
                        <Link to="/blog" className={styles["nav-link"]}>
                            <i className="fas fa-book-open"></i>
                            Conseils
                        </Link>
                        <Link to="/about" className={styles["nav-link"]}>
                            <i className="fas fa-info-circle"></i>
                            À propos
                        </Link>
                    </div>

                    <div className={styles["auth-section"]}>
                        <button
                            className={styles["ai-button"]}
                            onClick={handleOpenAI}
                            title="Assistant IA de recherche"
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
                                    <button
                                        onClick={handleLogout}
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

            {/* Hero Section avec animation */}
            <section className={styles["search-hero"]}>
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
                            Explorez les <span className={styles["text-highlight"]}>trésors</span> de Madagascar
                        </span>
                    </h1>

                    <p className={styles["hero-subtitle"]}>
                        Découvrez des sites uniques à travers toute l'île grâce à notre moteur de recherche avancé
                    </p>

                    <div className={`${styles["search-input-container"]} ${styles["anime-border"]}`}>
                        <i className={`fas fa-search ${styles["search-icon"]}`}></i>
                        <input
                            type="text"
                            placeholder="Rechercher un site, une région..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles["search-input"]}
                        />
                        <button className={styles["search-button"]}>
                            <i className="fas fa-paper-plane"></i>
                        </button>
                    </div>

                    <div className={styles["search-suggestions"]}>
                        <span>Suggestions :</span>
                        {searchSuggestions.slice(0, 6).map((tag, index) => (
                            <button
                                key={`tag-${tag}-${index}`}
                                type="button"
                                className={styles["search-tag"]}
                                onClick={() => setSearchTerm(tag)}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    <div className={styles["hero-stats"]}>
                        {[
                            { icon: 'fas fa-map-marker-alt', label: 'Sites total', value: searchStats.total },
                            { icon: 'fas fa-tree', label: 'Sites nature', value: searchStats.nature },
                            { icon: 'fas fa-landmark', label: 'Sites culture', value: searchStats.culture },
                            { icon: 'fas fa-star', label: 'Favoris', value: favorites.length }
                        ].map((stat, index) => (
                            <div
                                key={`stat-${index}`}
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

                {/* Floating elements anime */}
                <div className={styles["floating-elements"]}>
                    <div className={styles["floating-leaf"]}></div>
                    <div className={styles["floating-baobab"]}></div>
                    <div className={styles["floating-wave"]}></div>
                </div>
            </section>

            {/* Assistant IA de recommandation */}
            {showRecommendationAI && (
                <React.Suspense fallback={<div className={styles["loading-ai"]}>Chargement de l'assistant IA...</div>}>
                    <RecommendationAI onClose={handleCloseAI} />
                </React.Suspense>
            )}

            {/* Section Recherche principale */}
            <section className={`${styles["search-container"]} ${styles["anime-section"]}`}>
                <div className={styles["section-header"]}>
                    <h2>
                        <span className={styles["title-anime"]}>
                            Recherche <span className={styles["title-accent"]}>avancée</span>
                        </span>
                    </h2>
                    <p className={styles["subtitle-anime"]}>
                        Utilisez nos filtres pour trouver exactement ce que vous cherchez
                    </p>
                </div>

                <div className={styles["search-controls"]}>
                    <div className={styles["filters-grid"]}>
                        <div className={styles["filter-group"]}>
                            <label htmlFor="region-select">
                                <i className="fas fa-map-marker-alt"></i> Région
                            </label>
                            <select
                                id="region-select"
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value)}
                                className={styles["filter-select"]}
                            >
                                <option value="">Toutes les régions</option>
                                {regions.map(region => (
                                    <option key={`region-${region.id_region}`} value={region.id_region}>
                                        {region.nom}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles["filter-group"]}>
                            <label htmlFor="type-select">
                                <i className="fas fa-tag"></i> Type
                            </label>
                            <select
                                id="type-select"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className={styles["filter-select"]}
                            >
                                <option value="">Tous les types</option>
                                {siteTypes.map(type => (
                                    <option key={`type-${type.id_type}`} value={type.id_type}>{type.libele}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles["filter-group"]}>
                            <label htmlFor="sort-select">
                                <i className="fas fa-sort-amount-down"></i> Trier par
                            </label>
                            <select
                                id="sort-select"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className={styles["filter-select"]}
                            >
                                <option value="pertinence">Pertinence</option>
                                <option value="nom">Nom (A-Z)</option>
                                <option value="cout">Coût estimé</option>
                            </select>
                        </div>
                    </div>

                    <button
                        className={styles["reset-filters"]}
                        onClick={() => {
                            setSearchTerm('');
                            setSelectedRegion('');
                            setSelectedType('');
                            setSortBy('pertinence');
                        }}
                    >
                        <i className="fas fa-redo"></i> Réinitialiser les filtres
                    </button>
                </div>

                <div className={styles["results-info"]}>
                    <div className={styles["results-count"]}>
                        <i className="fas fa-search"></i>
                        <span>{sortedSites.length} {sortedSites.length === 1 ? 'site trouvé' : 'sites trouvés'}</span>
                    </div>
                    <div className={styles["active-filters"]}>
                        {selectedRegion && (
                            <span key={`filter-region-${selectedRegion}`} className={styles["active-filter-tag"]}>
                                {regions.find(r => r.id_region.toString() === selectedRegion)?.nom || selectedRegion}
                                <button onClick={() => setSelectedRegion('')}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </span>
                        )}
                        {selectedType && (
                            <span key={`filter-type-${selectedType}`} className={styles["active-filter-tag"]}>
                                {siteTypes.find(t => t.id_type.toString() === selectedType)?.libele || selectedType}
                                <button onClick={() => setSelectedType('')}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </span>
                        )}
                    </div>
                </div>

                <div className={styles["sites-grid"]}>
                    {sortedSites.length > 0 ? (
                        sortedSites.map((site, index) => (
                            <div
                                key={`site-${site.id_site}`}
                                className={`${styles["site-card"]} ${styles["anime-card"]} ${expandedCard === site.id_site ? styles.expanded : ''}`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className={styles["site-image"]}>
                                    <img
                                        src={`${process.env.REACT_APP_BACK_URL}${site.image}`}
                                        alt={site.nom}
                                        onError={(e) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80';
                                        }}
                                    />
                                    <div className={styles["site-type-badge"]}>
                                        {site.libele_type}
                                    </div>
                                    <div className={styles["site-actions"]}>
                                        <button
                                            className={`${styles["favorite-btn"]} ${favorites.includes(site.id_site) ? styles.favorited : ''}`}
                                            onClick={() => toggleFavorite(site.id_site)}
                                            title={favorites.includes(site.id_site) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                                        >
                                            <i className={favorites.includes(site.id_site) ? 'fas fa-heart' : 'far fa-heart'}></i>
                                        </button>
                                        <button
                                            className={styles["review-btn"]}
                                            onClick={() => toggleReview(site.id_site)}
                                            title="Laisser un avis"
                                        >
                                            <i className="fas fa-comment"></i>
                                        </button>
                                        <button
                                            className={styles["share-btn"]}
                                            onClick={() => setShareModal({
                                                name: site.nom,
                                                id: site.id_site,
                                                image: site.image,
                                                region: getRegionName(site.id_region),
                                                type: 'site'
                                            })}
                                            title="Partager ce site"
                                        >
                                            <i className="fas fa-share-alt"></i>
                                        </button>
                                    </div>
                                </div>
                                <div className={styles["site-info"]}>
                                    <h3>
                                        <i className="fas fa-map-pin"></i>
                                        {site.nom}
                                    </h3>
                                    <div className={styles["site-meta"]}>
                                        <span className={styles["region"]}>
                                            <i className="fas fa-map-marker-alt"></i> {getRegionName(site.id_region)}
                                        </span>
                                        <span className={styles["cost"]}>
                                            <i className="fas fa-tag"></i> {formattedGermanCurrency(site.cout_estime * currency, user?.currency || 'EUR')}
                                        </span>
                                    </div>
                                    <p className={styles["description"]}>
                                        {expandedCard === site.id_site ? site.description : `${site.description.substring(0, 120)}...`}
                                    </p>

                                    {reviewSite === site.id_site && (
                                        <div className={`${styles["review-form"]} ${styles.active}`}>
                                            <div className={styles["rating-container"]}>
                                                <label>Votre note :</label>
                                                <div className={styles["star-rating"]}>
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={`star-${star}`}
                                                            type="button"
                                                            className={`${styles["star-btn"]} ${reviewNote >= star ? styles.active : ""}`}
                                                            onClick={() => setReviewNote(star)}
                                                            disabled={isSubmitting}
                                                        >
                                                            <i className="fas fa-star"></i>
                                                        </button>
                                                    ))}
                                                </div>
                                                <span className={styles["rating-text"]}>{reviewNote}/5</span>
                                            </div>

                                            <textarea
                                                value={reviewText}
                                                onChange={(e) => setReviewText(e.target.value)}
                                                placeholder="Partagez votre expérience... (max 500 caractères)"
                                                rows="4"
                                                maxLength="500"
                                                disabled={isSubmitting}
                                            />
                                            <div className={styles["review-form-actions"]}>
                                                <button
                                                    className={styles["submit-review-btn"]}
                                                    onClick={() => submitReview(site.id_site)}
                                                    disabled={!reviewText.trim() || isSubmitting}
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <i className="fas fa-spinner fa-spin"></i> Envoi...
                                                        </>
                                                    ) : (
                                                        'Soumettre l\'avis'
                                                    )}
                                                </button>
                                                <button
                                                    className={styles["cancel-review-btn"]}
                                                    onClick={() => toggleReview(site.id_site)}
                                                    disabled={isSubmitting}
                                                >
                                                    Annuler
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {expandedCard === site.id_site && (
                                        <div className={styles["expanded-details"]}>
                                            <div className={styles["detail-row"]}>
                                                <div className={styles["detail-item"]}>
                                                    <h4><i className="fas fa-calendar-alt"></i> Meilleure période</h4>
                                                    <p>{getRegionBestPeriod(site.id_region)}</p>
                                                </div>
                                                <div className={styles["detail-item"]}>
                                                    <h4><i className="fas fa-clock"></i> Durée de visite</h4>
                                                    <p>{site.duree_visite}</p>
                                                </div>
                                            </div>
                                            <div className={styles["detail-row"]}>
                                                <div className={styles["detail-item"]}>
                                                    <h4><i className="fas fa-map-marked-alt"></i> Localisation</h4>
                                                    <p>Lat: {site.latitude}, Long: {site.longitude}</p>
                                                </div>
                                            </div>
                                            <div className={styles["actions"]}>
                                                <MapButton site={site} />
                                                <TripButton site={site} />
                                                <Link to={`/site/${site.id_site}`} className={styles["deepen-btn"]}>
                                                    Approfondir <i className="fas fa-arrow-right"></i>
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        className={styles["toggle-expand-btn"]}
                                        onClick={() => toggleExpand(site.id_site)}
                                    >
                                        {expandedCard === site.id_site ? (
                                            <><i className="fas fa-chevron-up"></i> Réduire</>
                                        ) : (
                                            <><i className="fas fa-chevron-down"></i> Plus d'infos</>
                                        )}
                                    </button>
                                </div>

                                {/* Effets anime */}
                                <div className={styles["card-glow"]}></div>
                                <div className={styles["card-sparkles"]}></div>
                            </div>
                        ))
                    ) : (
                        <div className={styles["no-results"]}>
                            <i className="fas fa-exclamation-circle"></i>
                            <h3>Aucun site ne correspond à votre recherche</h3>
                            <p>Essayez d'élargir vos critères ou de rechercher d'autres termes</p>
                            <button
                                className={styles["reset-search-btn"]}
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedRegion('');
                                    setSelectedType('');
                                }}
                            >
                                <i className="fas fa-redo"></i> Réinitialiser la recherche
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* SECTION TÉMOIGNAGES AMÉLIORÉE */}
            <section className={`${styles["search-testimonials"]} ${styles["anime-section"]}`}>
                <div className={styles["section-header"]}>
                    <h2>
                        <span className={styles["title-anime"]}>
                            Ce que disent nos <span className={styles["title-accent"]}>explorateurs</span>
                        </span>
                    </h2>
                    <p className={styles["subtitle-anime"]}>
                        Découvrez comment nos utilisateurs trouvent leurs sites préférés
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
                        {searchTestimonials.map((testimonial, index) => (
                            <div
                                key={`testimonial-${testimonial.id}-${index}`}
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
                    {searchTestimonials.slice(0, Math.ceil(searchTestimonials.length / 3)).map((_, index) => (
                        <button
                            key={`pagination-${index}`}
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

            {/* CTA Section */}
            <section className={styles["search-cta"]}>
                <div className={styles["cta-content"]}>
                    <div className={styles["cta-animation"]}>
                        <div className={styles["cta-orbs"]}>
                            <div className={styles["orb-1"]}></div>
                            <div className={styles["orb-2"]}></div>
                            <div className={styles["orb-3"]}></div>
                        </div>
                    </div>

                    <h2>Prêt à explorer Madagascar ?</h2>
                    <p>Créez votre compte pour sauvegarder vos favoris et recevoir des recommandations personnalisées</p>

                    <div className={styles["cta-buttons"]}>
                        {!isLoggedIn ? (
                            <>
                                <Link to="/register" className={`${styles["cta-button"]} ${styles["primary"]}`}>
                                    <i className="fas fa-rocket"></i>
                                    <span>S'inscrire gratuitement</span>
                                    <div className={styles["button-particles"]}></div>
                                </Link>
                                <Link to="/login" className={`${styles["cta-button"]} ${styles["secondary"]}`}>
                                    <i className="fas fa-sign-in-alt"></i>
                                    <span>Se connecter</span>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/dashboard" className={`${styles["cta-button"]} ${styles["primary"]}`}>
                                    <i className="fas fa-compass"></i>
                                    <span>Voir mes favoris</span>
                                </Link>
                                <Link to="/my-trip" className={`${styles["cta-button"]} ${styles["secondary"]}`}>
                                    <i className="fas fa-suitcase"></i>
                                    <span>Mon voyage</span>
                                </Link>
                            </>
                        )}
                        <button className={`${styles["cta-button"]} ${styles["ai-cta"]}`} onClick={handleOpenAI}>
                            <i className="fas fa-robot"></i>
                            <span>Assistant IA</span>
                        </button>
                    </div>
                </div>
            </section>

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
                                Votre guide pour découvrir les trésors cachés de Madagascar.
                                Recherche avancée et recommandations personnalisées.
                            </p>

                            <div className={styles["social-links"]}>
                                {['facebook-f', 'instagram', 'twitter', 'youtube', 'tiktok'].map((platform, index) => (
                                    <a
                                        key={`social-${platform}-${index}`}
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
                                    <i className="fas fa-search"></i>
                                    Recherche
                                </h3>
                                <ul>
                                    {['Par région', 'Par type', 'Par prix', 'Sites populaires', 'Nouveautés'].map((item, idx) => (
                                        <li key={`link-search-${idx}`}>
                                            <Link to={`/search?filter=${item.toLowerCase().replace(' ', '-')}`}>
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
                                    Informations
                                </h3>
                                <ul>
                                    {['Conseils voyage', 'FAQ recherche', 'Contact', 'Blog', 'À propos'].map((item, idx) => (
                                        <li key={`link-info-${idx}`}>
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
                                    Légal
                                </h3>
                                <ul>
                                    {['Conditions', 'Confidentialité', 'Cookies', 'Mentions légales'].map((item, idx) => (
                                        <li key={`link-legal-${idx}`}>
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
                                Restez informé
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
                                Fait avec <i className="fas fa-heart"></i> à Madagascar
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

                {/* Animation footer */}
                <div className={styles["footer-wave"]}></div>
                <div className={styles["footer-stars"]}>
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={`star-${i}`}
                            className={styles["star"]}
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 5}s`
                            }}
                        ></div>
                    ))}
                </div>
            </footer>

            {/* Chatbox flottante */}
            <div className={styles["chatbox-container"]}>
                <button
                    className={`${styles["chatbox-toggle"]} ${showChatbox ? styles.active : ''}`}
                    onClick={toggleChatbox}
                    aria-label={showChatbox ? "Fermer le chat" : "Ouvrir le chat"}
                >
                    <i className="fas fa-comments"></i>
                    {!showChatbox && <span className={styles["notification-badge"]}>1</span>}
                </button>

                {showChatbox && (
                    <div className={styles["chatbox-window"]}>
                        <div className={styles["chatbox-header"]}>
                            <div className={styles["chatbox-header-content"]}>
                                <div className={styles["chatbox-avatar"]}>
                                    <i className="fas fa-search"></i>
                                    <div className={styles["avatar-status"]}></div>
                                </div>
                                <div className={styles["chatbox-info"]}>
                                    <h3>Assistant Recherche</h3>
                                    <p>En ligne • Expert Madagascar</p>
                                </div>
                            </div>
                            <button
                                className={styles["chatbox-close"]}
                                onClick={toggleChatbox}
                                aria-label="Fermer le chat"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className={styles["chatbox-messages"]} ref={chatMessagesRef}>
                            {chatMessages.map((message) => (
                                <div
                                    key={`msg-${message.id}`}
                                    className={`${styles["message"]} ${styles[message.sender]}`}
                                >
                                    <div className={styles["message-content"]}>
                                        <p>{message.text}</p>
                                        <span className={styles["message-time"]}>
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {message.options && (
                                        <div className={styles["message-options"]}>
                                            {message.options.map((option, idx) => (
                                                <button
                                                    key={`option-${message.id}-${idx}`}
                                                    className={styles["option-button"]}
                                                    onClick={() => handleQuickOptionClick(option)}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isChatbotTyping && (
                                <div className={`${styles["message"]} ${styles.bot}`}>
                                    <div className={styles["typing-indicator"]}>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <form className={styles["chatbox-input-container"]} onSubmit={handleChatSubmit}>
                            <div className={styles["input-wrapper"]}>
                                <input
                                    ref={chatInputRef}
                                    type="text"
                                    placeholder="Demandez-moi un site..."
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    className={styles["chatbox-input"]}
                                />
                                <div className={styles["input-actions"]}>
                                    <button
                                        type="button"
                                        className={styles["input-action-button"]}
                                        title="Joindre un fichier"
                                    >
                                        <i className="fas fa-paperclip"></i>
                                    </button>
                                    <button
                                        type="button"
                                        className={styles["input-action-button"]}
                                        title="Émojis"
                                    >
                                        <i className="fas fa-smile"></i>
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className={styles["chatbox-send-button"]}
                                disabled={!chatInput.trim()}
                            >
                                <i className="fas fa-paper-plane"></i>
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Bouton retour en haut amélioré */}
            <button
                className={`${styles["back-to-top"]} ${showBackToTop ? styles.visible : ''}`}
                onClick={scrollToTop}
                aria-label="Retour en haut"
            >
                <i className="fas fa-chevron-up"></i>
                <div className={styles["back-to-top-glow"]}></div>
            </button>

            {/* Modal de partage */}
            {shareModal && (
                <div className={styles["share-overlay"]}>
                    <div className={styles["share-dialog"]}>
                        <div className={styles["share-header"]}>
                            <i className="fas fa-share-alt"></i>
                            <h3>Partager ce site</h3>
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
                                    <small>Site touristique</small>
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
                                        value={`${window.location.origin}/site/${shareModal.id}`}
                                        readOnly
                                        className={styles["link-input"]}
                                    />
                                    <button
                                        className={styles["copy-link-btn"]}
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/site/${shareModal.id}`);
                                            showSuccess('Lien copié dans le presse-papiers !');
                                            setShareModal(null);
                                        }}
                                    >
                                        <i className="fas fa-copy"></i> Copier
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Search;