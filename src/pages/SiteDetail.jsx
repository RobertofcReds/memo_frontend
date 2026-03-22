import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import logos from '../images/logo-site4.png';
import clsx from 'clsx';
import styles from './css/SiteDetail.module.css';
import api from '../api';
import { useNotification } from '../components/Notification/NotificationProvider';

// Composant IA de recommandation
const RecommendationAI = React.lazy(() => import('../components/recommendation/RecommendationAI'));

const SiteDetail = () => {
    const { id } = useParams();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [activeImage, setActiveImage] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);
    const [activeArchitecture, setActiveArchitecture] = useState(0);
    const [favorites, setFavorites] = useState([]);
    const [showRecommendationAI, setShowRecommendationAI] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState('overview');
    const [animeTheme] = useState('default');
    const navigate = useNavigate();
    const mainRef = useRef(null);
    const sectionsRef = useRef({});
    const observerRef = useRef(null);

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    // Utilisation du hook de notification
    const { showSuccess, showError, showInfo } = useNotification();

    useEffect(() => {
        setIsLoggedIn(!!token);
        if (userId) {
            fetchFavorites();
        }

        // Observer pour suivre les sections actives
        setupIntersectionObserver();

        // Gestion du bouton retour en haut
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 300);
            setIsScrolled(window.scrollY > 100);
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [token, userId]);

    // Observer pour suivre les sections actives
    const setupIntersectionObserver = () => {
        const options = {
            root: null,
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0
        };

        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, options);

        // Observer toutes les sections
        const sections = ['overview', 'history', 'architecture', 'features', 'gallery', 'practical-info', 'reviews'];
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                observerRef.current.observe(element);
            }
        });
    };

    // Fonction pour enregistrer une visite dans l'historique
    const logVisit = async () => {
        try {
            if (!userId || !token) return;

            const siteData = {
                id_site: parseInt(id),
                nom: siteName,
                description: history.substring(0, 100) + '...'
            };

            await api.post('/api/user/history/log', {
                userId: parseInt(userId),
                type: 'visit',
                criteres: '',
                resultats: '',
                entityId: siteData.id_site,
                entityName: siteData.nom,
                actionDetails: {}
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('✅ Visite enregistrée dans l\'historique');
        } catch (error) {
            console.error('❌ Erreur lors de l\'enregistrement de la visite:', error);
        }
    };

    // Enregistrer la visite quand la page est chargée
    useEffect(() => {
        if (isLoggedIn && id === '1') {
            logVisit();
        }
    }, [isLoggedIn, id]);

    const fetchFavorites = async () => {
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

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        navigate('/');
    };

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(sectionId);
        }
    };

    const openLightbox = (index) => {
        setActiveImage(index);
        setShowLightbox(true);
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        setShowLightbox(false);
        document.body.style.overflow = 'auto';
    };

    const navigateImage = (direction) => {
        if (direction === 'next') {
            setActiveImage((prev) => (prev + 1) % images.length);
        } else {
            setActiveImage((prev) => (prev - 1 + images.length) % images.length);
        }
    };

    // Fonction pour enregistrer une action dans l'historique
    const logHistoryAction = async (actionType, details = {}) => {
        try {
            if (!userId || !token) return;

            await api.post('/api/user/history/log', {
                userId: parseInt(userId),
                type: actionType,
                criteres: '',
                resultats: '',
                entityId: parseInt(id),
                entityName: siteName,
                actionDetails: details
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log(`✅ Action "${actionType}" enregistrée dans l'historique`);
        } catch (error) {
            console.error(`❌ Erreur lors de l'enregistrement de l'action "${actionType}":`, error);
        }
    };

    // Fonction pour gérer les likes
    const handleToggleFavorite = async () => {
        try {
            const siteId = parseInt(id);
            const wasFavorite = favorites.includes(siteId);

            const data = {
                userId: parseInt(userId),
                entite_id: siteId,
                type: 'site'
            };

            if (wasFavorite) {
                await api.delete(`api/user/favorites/${userId}`, {
                    params: { userId, entite_id: siteId, type: 'site' },
                    headers: { Authorization: `Bearer ${token}` }
                });

                setFavorites(favorites.filter(favId => favId !== siteId));
                showSuccess('Retiré des favoris !');

                // Enregistrer dans l'historique
                await logHistoryAction('unlike');
            } else {
                await api.post(`api/user/favorites/${userId}`, { updatedFavorites: data }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setFavorites([...favorites, siteId]);
                showSuccess('Ajouté aux favoris !');

                // Enregistrer dans l'historique
                await logHistoryAction('like');
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour des favoris :', error);
            showError('Erreur lors de la mise à jour des favoris');
        }
    };

    // Fonction pour partager
    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: siteName,
                    text: `Découvrez ${siteName} sur MadaTour ! ${history.substring(0, 100)}...`,
                    url: window.location.href,
                });

                // Enregistrer dans l'historique
                await logHistoryAction('share', {
                    platform: 'Native Share'
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);

                // Enregistrer dans l'historique
                await logHistoryAction('share', {
                    platform: 'Copie de lien'
                });

                showSuccess('Lien copié dans le presse-papier !');
            }
        } catch (error) {
            console.error('❌ Erreur lors du partage:', error);
            showError('Erreur lors du partage');
        }
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

    // Fonction pour retourner en haut de la page
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // Hardcoded content for Rova de Manjakamiadana (id = 1)
    const siteName = 'Rova de Manjakamiadana';
    const siteLocation = 'Antananarivo, Madagascar';
    const bestTimeToVisit = 'Mai à Octobre';
    const entranceFee = '10 000 MGA (environ 2,50 USD)';
    const openingHours = 'Tous les jours de 9h00 à 17h00';

    const history = `
        Le Rova d'Antananarivo, également connu sous le nom de Rovan'i Manjakamiadana, est un complexe de palais royal à Madagascar qui a servi de résidence aux souverains du Royaume d'Imerina aux XVIIe et XVIIIe siècles, ainsi qu'aux dirigeants du Royaume de Madagascar au XIXe siècle. Il est situé sur Analamanga, la plus haute colline d'Antananarivo, à 1 480 mètres au-dessus du niveau de la mer.
        
        Le roi Andrianjaka, qui a régné sur l'Imerina de 1610 à 1630 environ, aurait capturé le site d'un roi Vazimba vers 1610 ou 1625 et y a érigé la première structure royale fortifiée, comprenant trois bâtiments et un site de tombeau dédié. Les rois Merina successifs, y compris Andriamasinavalona (1675–1710), ont régné depuis le site, modifiant occasionnellement le complexe. En 1792, le roi Andrianampoinimerina a réunifié le Royaume d'Imerina et a déplacé la capitale à Antananarivo, étendant les structures du Rova à environ vingt à la fin du XVIIIe siècle.
        
        Le site est resté le siège du pouvoir jusqu'à la chute de la monarchie en 1896, avec des développements importants pendant les règnes de Radama I (1810–1828), Ranavalona I (1828–1861), et des reines ultérieures, y compris la construction de palais majeurs comme Manjakamiadana. Après la colonisation française en 1896, le Rova a été converti en musée en 1897, et ses tombes ont été relocalisés, désacralisant le site. Un incendie le 6 novembre 1995 a détruit ou endommagé toutes les structures du complexe du Rova peu avant son inscription sur la liste des sites du patrimoine mondial de l'UNESCO. Bien que officiellement déclaré un accident, des rumeurs persistent selon lesquelles un incendie criminel motivé politiquement pourrait en être la cause réelle. La chapelle et les tombes, ainsi que Besakana et Mahitsielafanjaka, ont depuis été entièrement restaurées grâce à des dons bilatéraux du gouvernement, des fonds d'État et des subventions d'organisations intergouvernementales et de donateurs privés. L'achèvement de la reconstruction de l'extérieur de Manjakamiadana était estimé pour 2012, avec la restauration intérieure prévue pas avant 2013. Une fois le bâtiment entièrement restauré, Manjakamiadana servira de musée présentant des artefacts royaux sauvés de la destruction lors de l'incendie.
    `;

    const architectureIntro = `
        Le complexe du Rova s'étend sur un peu moins d'un hectare, mesurant 116 mètres du nord au sud et plus de 61 mètres d'est en ouest. Il présentait à l'origine une barricade de poteaux en bois épais aux extrémités aiguisées, remplacée par un mur de brique en 1897. L'entrée se fait via un escalier en pierre et une porte orientée nord surmontée d'un aigle en bronze, construit par James Cameron en 1845.
    `;

    const architecturalElements = [
        {
            id: 'manjakamiadana',
            title: 'Manjakamiadana',
            description: 'Construit en bois entre 1839 et 1840 pour Ranavalona I par Jean Laborde, encastré en pierre en 1867 par James Cameron pour Ranavalona II. Mesure 30 mètres de long, 20 mètres de large et 37 mètres de haut avec des balcons et un toit à forte pente. C\'était le palais principal de la reine.',
            image: 'https://upload.wikimedia.org/wikipedia/commons/c/c0/Manjakamiadana_MPMF24.jpg',
            features: ['Palais principal', '37m de hauteur', 'Construction mixte bois et pierre', 'Toit à forte pente']
        },
        {
            id: 'tranovola',
            title: 'Tranovola',
            description: 'Construit en 1819 pour Radama I par Louis Gros, remodelé en 1845. Il comportait deux étages, des vérandas et des ornements en argent, représentant un hybride de l\'architecture créole et merina. Surnommé "La Maison d\'Argent".',
            image: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Palais_Tranovola.jpg',
            features: ['Deux étages', 'Ornements en argent', 'Style hybride créole-merina', 'Vérandas']
        },
        {
            id: 'manampisoa',
            title: 'Manampisoa',
            description: 'Une villa en forme de croix construite de 1865 à 1867 pour la reine Rasoherina par James Cameron. Mesurant 19 mètres de long, 9,1 mètres de large et 15 mètres de haut, avec une construction en bois traditionnelle et des fenêtres coulissantes.',
            image: 'https://upload.wikimedia.org/wikipedia/commons/a/aa/Manampisoa_Rova_of_Antananarivo_Madagascar.jpg',
            features: ['Forme de croix', 'Construction en bois', 'Fenêtres coulissantes', 'Villa royale']
        },
        {
            id: 'besakana-mahitsy',
            title: 'Besakana et Mahitsy',
            description: 'Maisons en bois traditionnelles, Besakana datant du XVIIe siècle, servant de résidence royale et de trône, et Mahitsy comme siège d\'autorité spirituelle. Suivant toutes deux les normes architecturales nobles merina avec toits pointus caractéristiques.',
            image: 'https://upload.wikimedia.org/wikipedia/commons/8/80/Rova_Manjakamiadana_Madagascar_de_loin.jpg',
            features: ['Architecture traditionnelle merina', 'Toits pointus', 'Résidence royale', 'Siège spirituel']
        },
        {
            id: 'tombes-royales',
            title: 'Tombes royales',
            description: 'Neuf tombes, y compris les Fitomiandalana (sept tombes en bois de 1630) et des tombes en pierre pour Radama I et Rasoherina, situées dans le quadrant nord-est. Conception traditionnelle et innovante, comme la tombe de Radama I avec une véranda.',
            image: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Tombeau_royal_au_sein_du_palais_Rova_Manjakamiadana_2.jpg',
            features: ['Neuf tombes royales', 'Style traditionnel et innovant', 'Tombe avec véranda', 'Quadrant nord-est']
        },
        {
            id: 'fiangonana',
            title: 'Fiangonana',
            description: 'Une chapelle en pierre construite de 1869 à 1880 pour Ranavalona II. Avec une tour de toit en ardoise de 34 mètres et des fenêtres en verre teinté, mesurant 12,9 mètres de wide et 18,5 mètres de long. Symbole de la conversion au christianisme.',
            image: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/EglisePalais3.JPG',
            features: ['Chapelle en pierre', 'Tour de 34m', 'Verre teinté', 'Symbole chrétien']
        }
    ];

    const keyFeatures = [
        {
            title: 'Signification politique et spirituelle',
            description: 'Contrastant avec le rôle spirituel d\'Ambohimanga, le Rova représentait le pouvoir temporel et politique des souverains Merina. C\'était le centre administratif et le symbole de l\'autorité royale.',
            icon: 'fas fa-crown'
        },
        {
            title: 'Évolution architecturale',
            description: 'Des structures en bois traditionnelles merina à des designs hybrides incorporant des influences créoles et européennes, notamment des vérandas et des bâtiments multi-étages.',
            icon: 'fas fa-archway'
        },
        {
            title: 'Bâtiments notables',
            description: 'Manjakamiadana (Palais de la Reine), Tranovola (Maison d\'Argent), et la chapelle, reflétant des changements historiques et culturels.',
            icon: 'fas fa-landmark'
        },
        {
            title: 'Tombes royales',
            description: 'Abritant les souverains merina, avec des designs traditionnels et innovants, comme la tombe de Radama I avec une véranda.',
            icon: 'fas fa-monument'
        },
        {
            title: 'Kianja',
            description: 'Cour centrale avec une vatomasina (pierre sacrée) pour les discours royaux, et des agencements traditionnels avec des résidences royales au nord et des zones pour les conjoints au sud.',
            icon: 'fas fa-square'
        },
        {
            title: 'Vue panoramique',
            description: 'Situé au sommet de la plus haute colline d\'Antananarivo, offrant une vue imprenable sur la capitale et ses environs.',
            icon: 'fas fa-binoculars'
        }
    ];

    const images = [
        'https://upload.wikimedia.org/wikipedia/commons/7/7e/Original_wooden_manjakamiadana_palace_of_Ranavalona_I_of_Madagascar.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/6/69/Eglise_Rova_Manjakamiadana_Madagascar_5.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/0/05/Grand_Palais_Manjakamiadana_MPMF24.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/c/c2/Rova_Manjakamiadana_MPMF24.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/8/80/Rova_Manjakamiadana_Madagascar_de_loin.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/1/19/Maison_en_bois_dans_le_Palais_de_la_Reine_Manjakamiadana_Antananarivo.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/b/b5/Palais_de_la_reine%2C_Manjakamiadana.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/6/69/Eglise_Rova_Manjakamiadana_Madagascar_5.jpg'
    ];

    const touristInfo = `
        Le Rova est ouvert au public depuis juin 2023 après restauration. Des guides sont disponibles pour des visites de 15 minutes autour du complexe, expliquant l'histoire. Frais d'entrée modeste. Situé dans le centre d'Antananarivo, visible de loin. Meilleure période : Mai à octobre. Conseils : Portez des chaussures confortables pour l'escalier, respectez les sites sacrés, photographie autorisée mais avec respect.
    `;

    const tips = [
        'Prévoir au moins 2 heures pour la visite complète',
        'Engager un guide local pour mieux comprendre l\'histoire',
        'Apporter de l\'eau et un chapeau, surtout en saison chaude',
        'Rester sur les sentiers balisés',
        'Demander l\'autorisation avant de photographier les habitants'
    ];

    const reviews = [
        {
            name: 'Sophie R.',
            rating: 5,
            comment: 'Un site historique impressionnant avec une vue magnifique sur toute la ville. Le guide était très compétent.',
            date: '15 Oct 2023',
            avatar: '👩'
        },
        {
            name: 'Thomas L.',
            rating: 4,
            comment: 'Très belle restauration. Dommage que certaines parties soient encore fermées au public.',
            date: '22 Sep 2023',
            avatar: '👨'
        },
        {
            name: 'Nirina M.',
            rating: 5,
            comment: 'Fière de voir ce patrimoine malgache si bien préservé. À visiter absolument!',
            date: '5 Nov 2023',
            avatar: '👩'
        }
    ];

    const sections = [
        { id: 'overview', label: 'Aperçu', icon: 'fas fa-eye' },
        { id: 'history', label: 'Histoire', icon: 'fas fa-history' },
        { id: 'architecture', label: 'Architecture', icon: 'fas fa-archway' },
        { id: 'features', label: 'Caractéristiques', icon: 'fas fa-star' },
        { id: 'gallery', label: 'Galerie', icon: 'fas fa-images' },
        { id: 'practical-info', label: 'Infos pratiques', icon: 'fas fa-info-circle' },
        { id: 'reviews', label: 'Avis', icon: 'fas fa-comments' }
    ];

    // If id != '1', show placeholder
    if (id !== '1') {
        return (
            <div className={`${styles["site-detail-container"]} ${styles[animeTheme]}`}>
                <header className={`${styles["header"]} ${isScrolled ? styles.scrolled : ''} ${styles.animatedHeader}`}>
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
                                title="Assistant IA"
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
                                        <Link to="/profile" className={styles["dropdown-item"]}>
                                            <i className="fas fa-user-edit"></i> Profil
                                        </Link>
                                        <Link to="/bookings" className={styles["dropdown-item"]}>
                                            <i className="fas fa-calendar-check"></i> Mes réservations
                                        </Link>
                                        <div className={styles["dropdown-divider"]}></div>
                                        <button onClick={handleLogout} className={styles["dropdown-item"]}>
                                            <i className="fas fa-sign-out-alt"></i> Déconnexion
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles["auth-buttons"]}>
                                    <Link to="/login" className={`${styles["auth-button"]} ${styles["secondary"]}`}>
                                        <i className="fas fa-sign-in-alt"></i>
                                        Connexion
                                    </Link>
                                    <Link to="/register" className={`${styles["auth-button"]} ${styles["primary"]}`}>
                                        <i className="fas fa-user-plus"></i>
                                        Inscription
                                    </Link>
                                </div>
                            )}
                        </div>
                    </nav>
                </header>

                <section className={`${styles["site-hero"]} ${styles["construction-hero"]}`}>
                    <div className={styles["hero-stars"]}>
                        {[...Array(50)].map((_, i) => (
                            <div
                                key={i}
                                className={styles["star"]}
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    width: `${Math.random() * 3 + 1}px`,
                                    height: `${Math.random() * 3 + 1}px`,
                                    animationDelay: `${Math.random() * 5}s`,
                                    animationDuration: `${Math.random() * 3 + 2}s`
                                }}
                            ></div>
                        ))}
                    </div>
                    <div className={styles["hero-overlay"]}></div>
                    <div className={styles["hero-content"]}>
                        <h1 className={styles["anime-text"]}>
                            <span className={styles["text-gradient"]}>
                                Page <span className={styles["text-highlight"]}>en construction</span>
                            </span>
                        </h1>
                        <p className={styles["hero-subtitle"]}>
                            Les détails pour ce site seront ajoutés bientôt
                        </p>
                        <button
                            className={styles["back-button"]}
                            onClick={() => navigate(-1)}
                        >
                            <i className="fas fa-arrow-left"></i>
                            <span>Retour à l'accueil</span>
                            <div className={styles["button-glow"]}></div>
                        </button>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className={`${styles["site-detail-container"]} ${styles[animeTheme]}`} ref={mainRef}>
            {/* Header amélioré avec animation */}
            <header className={`${styles["header"]} ${isScrolled ? styles.scrolled : ''} ${styles.animatedHeader}`}>
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
                            title="Assistant IA"
                        >
                            <i className="fas fa-robot"></i>
                            <span className={styles["ai-tooltip"]}>Assistant IA</span>
                        </button>

                        <button
                            className={styles["back-button-header"]}
                            onClick={() => navigate(-1)}
                        >
                            <i className="fas fa-arrow-left"></i>
                            <span>Retour</span>
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
                                    <Link to="/profile" className={styles["dropdown-item"]}>
                                        <i className="fas fa-user-edit"></i> Profil
                                    </Link>
                                    <Link to="/bookings" className={styles["dropdown-item"]}>
                                        <i className="fas fa-calendar-check"></i> Mes réservations
                                    </Link>
                                    <div className={styles["dropdown-divider"]}></div>
                                    <button onClick={handleLogout} className={styles["dropdown-item"]}>
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

            {/* Assistant IA de recommandation */}
            {showRecommendationAI && (
                <React.Suspense fallback={<div className={styles["loading-ai"]}>Chargement de l'assistant IA...</div>}>
                    <RecommendationAI onClose={handleCloseAI} />
                </React.Suspense>
            )}

            {/* Navigation rapide améliorée */}
            <div className={`${styles["quick-nav"]} ${isScrolled ? styles.scrolled : ''}`}>
                <div className={styles["quick-nav-content"]}>
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            className={`${styles["quick-nav-btn"]} ${activeSection === section.id ? styles.active : ''}`}
                            onClick={() => scrollToSection(section.id)}
                        >
                            <i className={section.icon}></i>
                            <span>{section.label}</span>
                            <div className={styles["nav-indicator"]}></div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Hero Section améliorée */}
            <section className={styles["site-hero"]}>
                <div className={styles["hero-overlay"]}></div>
                <div className={styles["hero-slides"]}>
                    {images.slice(0, 3).map((img, index) => (
                        <div
                            key={index}
                            className={styles["hero-slide"]}
                            style={{ backgroundImage: `url(${img})` }}
                        ></div>
                    ))}
                </div>

                <div className={styles["hero-content"]}>
                    <div className={styles["hero-badges"]}>
                        <span className={styles["badge"]}>
                            <i className="fas fa-star"></i> Site historique
                        </span>
                        <span className={styles["badge"]}>
                            <i className="fas fa-map-marker-alt"></i> {siteLocation}
                        </span>
                        <span className={styles["badge"]}>
                            <i className="fas fa-clock"></i> {openingHours}
                        </span>
                    </div>

                    <h1 className={styles["anime-text"]}>
                        <span className={styles["text-gradient"]}>
                            {siteName}
                        </span>
                    </h1>

                    <p className={styles["hero-subtitle"]}>
                        Découvrez l'histoire et les merveilles de ce site emblématique
                    </p>

                    <div className={styles["hero-actions"]}>
                        <div className={styles["action-buttons"]}>
                            <button
                                className={`${styles["action-btn"]} ${styles["favorite-btn"]} ${favorites.includes(parseInt(id)) ? styles.active : ''}`}
                                onClick={handleToggleFavorite}
                                title={favorites.includes(parseInt(id)) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                            >
                                <i className={favorites.includes(parseInt(id)) ? 'fas fa-heart' : 'far fa-heart'}></i>
                                <span>{favorites.includes(parseInt(id)) ? 'Dans les favoris' : 'Ajouter aux favoris'}</span>
                                <div className={styles["button-glow"]}></div>
                            </button>

                            <button
                                className={`${styles["action-btn"]} ${styles["share-btn"]}`}
                                onClick={handleShare}
                                title="Partager ce site"
                            >
                                <i className="fas fa-share-alt"></i>
                                <span>Partager</span>
                            </button>

                            <button
                                className={`${styles["action-btn"]} ${styles["guide-btn"]}`}
                                onClick={() => navigate('/contact')}
                            >
                                <i className="fas fa-user"></i>
                                <span>Guide local</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Floating elements anime */}
                <div className={styles["floating-elements"]}>
                    <div className={styles["floating-crown"]}></div>
                    <div className={styles["floating-palace"]}></div>
                    <div className={styles["floating-star"]}></div>
                </div>
            </section>

            {/* Section Aperçu améliorée */}
            <section id="overview" className={`${styles["overview-section"]} ${styles["anime-section"]}`}>
                <div className={styles["section-header"]}>
                    <h2>
                        <span className={styles["title-anime"]}>
                            À propos du <span className={styles["title-accent"]}>Rova</span>
                        </span>
                    </h2>
                    <p className={styles["subtitle-anime"]}>
                        Le palais royal qui a façonné l'histoire de Madagascar
                    </p>
                </div>

                <div className={styles["overview-content"]}>
                    <div className={styles["overview-text"]}>
                        <p className={styles["overview-description"]}>
                            Le Rova de Manjakamiadana, également connu sous le nom de Palais de la Reine, est l'un des sites historiques les plus importants de Madagascar. Perché sur la plus haute colline d'Antananarivo, il offre une vue panoramique sur la capitale et témoigne de la riche histoire de la monarchie Merina.
                        </p>

                        <div className={styles["stats-grid"]}>
                            {[
                                { value: 'XVIe', label: 'Siècle', icon: 'fas fa-hourglass-start' },
                                { value: '1,480m', label: 'Altitude', icon: 'fas fa-mountain' },
                                { value: '6,000m²', label: 'Superficie', icon: 'fas fa-expand-arrows-alt' },
                                { value: '1995', label: 'Incendie', icon: 'fas fa-fire' }
                            ].map((stat, index) => (
                                <div
                                    key={index}
                                    className={`${styles["stat-item"]} ${styles["anime-stat"]}`}
                                    style={{ animationDelay: `${index * 0.1}s` }}
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

                    <div className={styles["overview-image"]}>
                        <div className={styles["image-container"]}>
                            <img
                                src={images[0]}
                                alt="Rova de Manjakamiadana"
                                className={styles["main-image"]}
                            />
                            <div className={styles["image-glow"]}></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section Histoire améliorée */}
            <section id="history" className={`${styles["history-section"]} ${styles["anime-section"]}`}>
                <div className={styles["section-header"]}>
                    <h2>
                        <span className={styles["title-anime"]}>
                            Une <span className={styles["title-accent"]}>histoire</span> royale
                        </span>
                    </h2>
                    <p className={styles["subtitle-anime"]}>
                        Des siècles de pouvoir et de tradition
                    </p>
                </div>

                <div className={styles["history-content"]}>
                    <div className={styles["history-image"]}>
                        <div className={styles["image-container"]}>
                            <img
                                src={images[1]}
                                alt="Histoire du Rova"
                                className={styles["main-image"]}
                            />
                            <div className={styles["image-badge"]}>
                                <i className="fas fa-history"></i>
                                <span>XVIIe siècle</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles["history-text"]}>
                        <div className={styles["history-timeline"]}>
                            {[
                                { year: '1610', event: 'Fondation par le roi Andrianjaka' },
                                { year: '1792', event: 'Capitale du Royaume d\'Imerina' },
                                { year: '1840', event: 'Construction de Manjakamiadana' },
                                { year: '1896', event: 'Fin de la monarchie' },
                                { year: '1995', event: 'Incendie majeur' },
                                { year: '2023', event: 'Réouverture au public' }
                            ].map((item, index) => (
                                <div key={index} className={styles["timeline-item"]}>
                                    <div className={styles["timeline-year"]}>{item.year}</div>
                                    <div className={styles["timeline-event"]}>{item.event}</div>
                                </div>
                            ))}
                        </div>

                        <div className={styles["history-description"]}>
                            <p>{history}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section Architecture améliorée */}
            <section id="architecture" className={`${styles["architecture-section"]} ${styles["anime-section"]}`}>
                <div className={styles["section-header"]}>
                    <h2>
                        <span className={styles["title-anime"]}>
                            Architecture <span className={styles["title-accent"]}>royale</span>
                        </span>
                    </h2>
                    <p className={styles["subtitle-anime"]}>
                        Découvrez les structures emblématiques du Rova
                    </p>
                </div>

                <div className={styles["architecture-intro"]}>
                    <p>{architectureIntro}</p>
                </div>

                <div className={styles["architecture-tabs"]}>
                    {architecturalElements.map((item, index) => (
                        <button
                            key={index}
                            className={`${styles["architecture-tab"]} ${activeArchitecture === index ? styles.active : ''}`}
                            onClick={() => setActiveArchitecture(index)}
                        >
                            <i className="fas fa-building"></i>
                            <span>{item.title}</span>
                            <div className={styles["tab-glow"]}></div>
                        </button>
                    ))}
                </div>

                <div className={styles["architecture-content"]}>
                    {architecturalElements.map((item, index) => (
                        <div
                            key={index}
                            className={`${styles["architecture-item"]} ${activeArchitecture === index ? styles.active : ''}`}
                        >
                            <div className={styles["architecture-grid"]}>
                                <div className={styles["architecture-text"]}>
                                    <h3>
                                        <i className="fas fa-archway"></i>
                                        {item.title}
                                    </h3>
                                    <p className={styles["architecture-description"]}>{item.description}</p>

                                    <div className={styles["architecture-features"]}>
                                        <h4>
                                            <i className="fas fa-list-check"></i>
                                            Caractéristiques
                                        </h4>
                                        <div className={styles["features-grid"]}>
                                            {item.features.map((feature, i) => (
                                                <div key={i} className={styles["feature-item"]}>
                                                    <div className={styles["feature-icon"]}>
                                                        <i className="fas fa-check"></i>
                                                    </div>
                                                    <span className={styles["feature-text"]}>{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles["architecture-image"]}>
                                    <div className={styles["image-container"]}>
                                        <img src={item.image} alt={item.title} />
                                        <div className={styles["image-overlay"]}>
                                            <button
                                                className={styles["zoom-button"]}
                                                onClick={() => openLightbox(images.indexOf(item.image))}
                                            >
                                                <i className="fas fa-search-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Section Caractéristiques améliorée */}
            <section id="features" className={`${styles["features-section"]} ${styles["anime-section"]}`}>
                <div className={styles["section-header"]}>
                    <h2>
                        <span className={styles["title-anime"]}>
                            Caractéristiques <span className={styles["title-accent"]}>clés</span>
                        </span>
                    </h2>
                    <p className={styles["subtitle-anime"]}>
                        Les principes et éléments qui définissent ce site
                    </p>
                </div>

                <div className={styles["features-grid"]}>
                    {keyFeatures.map((feature, index) => (
                        <div
                            key={index}
                            className={`${styles["feature-card"]} ${styles["anime-card"]}`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className={styles["feature-header"]}>
                                <div className={styles["feature-icon-wrapper"]}>
                                    <i className={feature.icon}></i>
                                    <div className={styles["icon-glow"]}></div>
                                </div>
                                <h3>{feature.title}</h3>
                            </div>
                            <p className={styles["feature-description"]}>{feature.description}</p>
                            <div className={styles["feature-glow"]}></div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Section Galerie améliorée */}
            <section id="gallery" className={`${styles["gallery-section"]} ${styles["anime-section"]}`}>
                <div className={styles["section-header"]}>
                    <h2>
                        <span className={styles["title-anime"]}>
                            Galerie <span className={styles["title-accent"]}>visuelle</span>
                        </span>
                    </h2>
                    <p className={styles["subtitle-anime"]}>
                        Découvrez le Rova de Manjakamiadana en images
                    </p>
                </div>

                <div className={styles["gallery-container"]}>
                    <div className={styles["gallery-grid"]}>
                        {images.map((img, index) => (
                            <div
                                key={index}
                                className={`${styles["gallery-item"]} ${styles["anime-gallery"]}`}
                                style={{ animationDelay: `${index * 0.05}s` }}
                                onClick={() => openLightbox(index)}
                            >
                                <div className={styles["gallery-image"]}>
                                    <img src={img} alt={`Rova de Manjakamiadana vue ${index + 1}`} />
                                    <div className={styles["image-gradient"]}></div>
                                    <div className={styles["gallery-overlay"]}>
                                        <i className="fas fa-search-plus"></i>
                                        <span>Voir en grand</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Lightbox amélioré */}
            {showLightbox && (
                <div className={styles["lightbox"]} onClick={closeLightbox}>
                    <div className={styles["lightbox-content"]} onClick={(e) => e.stopPropagation()}>
                        <button className={styles["lightbox-close"]} onClick={closeLightbox}>
                            <i className="fas fa-times"></i>
                        </button>
                        <button
                            className={`${styles["lightbox-nav"]} ${styles["prev"]}`}
                            onClick={() => navigateImage('prev')}
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <div className={styles["lightbox-image-container"]}>
                            <img
                                src={images[activeImage]}
                                alt={`Vue ${activeImage + 1}`}
                                className={styles["lightbox-image"]}
                            />
                            <div className={styles["image-info"]}>
                                <span className={styles["image-title"]}>Rova de Manjakamiadana</span>
                                <span className={styles["image-counter"]}>
                                    {activeImage + 1} / {images.length}
                                </span>
                            </div>
                        </div>
                        <button
                            className={`${styles["lightbox-nav"]} ${styles["next"]}`}
                            onClick={() => navigateImage('next')}
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            )}

            {/* Section Infos pratiques améliorée */}
            <section id="practical-info" className={`${styles["practical-info-section"]} ${styles["anime-section"]}`}>
                <div className={styles["section-header"]}>
                    <h2>
                        <span className={styles["title-anime"]}>
                            Informations <span className={styles["title-accent"]}>pratiques</span>
                        </span>
                    </h2>
                    <p className={styles["subtitle-anime"]}>
                        Tout ce que vous devez savoir pour votre visite
                    </p>
                </div>

                <div className={styles["info-grid"]}>
                    <div className={styles["info-card"]}>
                        <div className={styles["info-icon-wrapper"]}>
                            <i className="fas fa-clock"></i>
                            <div className={styles["icon-glow"]}></div>
                        </div>
                        <h3>Horaires d'ouverture</h3>
                        <p className={styles["info-text"]}>{openingHours}</p>
                        <p className={styles["info-note"]}>Dernière entrée à 16h30</p>
                    </div>

                    <div className={styles["info-card"]}>
                        <div className={styles["info-icon-wrapper"]}>
                            <i className="fas fa-ticket-alt"></i>
                            <div className={styles["icon-glow"]}></div>
                        </div>
                        <h3>Tarifs d'entrée</h3>
                        <div className={styles["price-list"]}>
                            <div className={styles["price-item"]}>
                                <span>Adultes</span>
                                <span className={styles["price-value"]}>{entranceFee}</span>
                            </div>
                            <div className={styles["price-item"]}>
                                <span>Enfants</span>
                                <span className={styles["price-value"]}>5 000 MGA</span>
                            </div>
                            <div className={styles["price-item"]}>
                                <span>Étudiants</span>
                                <span className={styles["price-value"]}>7 000 MGA</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles["info-card"]}>
                        <div className={styles["info-icon-wrapper"]}>
                            <i className="fas fa-map-marked-alt"></i>
                            <div className={styles["icon-glow"]}></div>
                        </div>
                        <h3>Localisation</h3>
                        <p className={styles["info-text"]}>Analamanga, Antananarivo</p>
                        <p className={styles["info-note"]}>Accessible en taxi ou à pied depuis le centre-ville</p>
                    </div>

                    <div className={styles["info-card"]}>
                        <div className={styles["info-icon-wrapper"]}>
                            <i className="fas fa-calendar-alt"></i>
                            <div className={styles["icon-glow"]}></div>
                        </div>
                        <h3>Meilleure période</h3>
                        <p className={styles["info-text"]}>{bestTimeToVisit}</p>
                        <p className={styles["info-note"]}>Éviter la saison des pluies (décembre à mars)</p>
                    </div>
                </div>

                <div className={styles["tips-section"]}>
                    <h3>
                        <i className="fas fa-lightbulb"></i>
                        Conseils de visite
                    </h3>
                    <div className={styles["tips-grid"]}>
                        {tips.map((tip, index) => (
                            <div key={index} className={styles["tip-item"]}>
                                <div className={styles["tip-icon"]}>
                                    <i className="fas fa-check-circle"></i>
                                </div>
                                <span className={styles["tip-text"]}>{tip}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles["map-section"]}>
                    <h3>
                        <i className="fas fa-map"></i>
                        Localisation sur la carte
                    </h3>
                    <div className={styles["map-container"]}>
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3775.788247577665!2d47.56291117599636!3d-18.92146820853878!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x21f07e011aadcc2b%3A0x49c653f463c2c055!2sRova%20de%20Manjakamiadana!5e0!3m2!1sfr!2smg!4v1700000000000!5m2!1sfr!2smg"
                            width="100%"
                            height="400"
                            style={{ border: 0, borderRadius: '12px' }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Localisation du Rova de Manjakamiadana"
                            className={styles["map-iframe"]}
                        ></iframe>
                    </div>
                </div>
            </section>

            {/* Section Avis améliorée */}
            <section id="reviews" className={`${styles["reviews-section"]} ${styles["anime-section"]}`}>
                <div className={styles["section-header"]}>
                    <h2>
                        <span className={styles["title-anime"]}>
                            Avis des <span className={styles["title-accent"]}>visiteurs</span>
                        </span>
                    </h2>
                    <p className={styles["subtitle-anime"]}>
                        Ce que disent les voyageurs de leur expérience
                    </p>
                </div>

                <div className={styles["reviews-grid"]}>
                    {reviews.map((review, index) => (
                        <div
                            key={index}
                            className={`${styles["review-card"]} ${styles["anime-review"]}`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className={styles["review-header"]}>
                                <div className={styles["reviewer-avatar"]}>
                                    <span className={styles["avatar"]}>{review.avatar}</span>
                                    <div className={styles["avatar-glow"]}></div>
                                </div>
                                <div className={styles["reviewer-info"]}>
                                    <h4 className={styles["reviewer-name"]}>{review.name}</h4>
                                    <div className={styles["review-date"]}>
                                        <i className="fas fa-calendar-alt"></i>
                                        {review.date}
                                    </div>
                                </div>
                            </div>

                            <div className={styles["review-rating"]}>
                                {[...Array(5)].map((_, i) => (
                                    <i
                                        key={i}
                                        className={`fas fa-star ${i < review.rating ? styles.active : ''}`}
                                    ></i>
                                ))}
                                <span className={styles["rating-number"]}>{review.rating}/5</span>
                            </div>

                            <p className={styles["review-comment"]}>"{review.comment}"</p>

                            <div className={styles["review-footer"]}>
                                <button className={styles["helpful-btn"]}>
                                    <i className="fas fa-thumbs-up"></i>
                                    <span>Utile</span>
                                </button>
                                <button className={styles["reply-btn"]}>
                                    <i className="fas fa-reply"></i>
                                    <span>Répondre</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles["add-review-section"]}>
                    <div className={styles["add-review-content"]}>
                        <h3>
                            <i className="fas fa-pencil-alt"></i>
                            Partagez votre expérience
                        </h3>
                        <p>Votre avis aide d'autres voyageurs à planifier leur visite</p>
                        <button
                            className={styles["add-review-button"]}
                            onClick={() => isLoggedIn ? navigate('/add-review') : navigate('/login')}
                        >
                            <i className="fas fa-plus-circle"></i>
                            <span>Ajouter un avis</span>
                            <div className={styles["button-glow"]}></div>
                        </button>
                    </div>
                </div>
            </section>

            {/* CTA Section améliorée */}
            <section className={`${styles["site-cta"]} ${styles["anime-section"]}`}>
                <div className={styles["cta-content"]}>
                    <div className={styles["cta-animation"]}>
                        <div className={styles["cta-orbs"]}>
                            <div className={styles["orb-1"]}></div>
                            <div className={styles["orb-2"]}></div>
                            <div className={styles["orb-3"]}></div>
                        </div>
                    </div>

                    <h2 className={styles["cta-title"]}>Prêt à visiter le Rova ?</h2>
                    <p className={styles["cta-subtitle"]}>
                        Planifiez votre voyage à Madagascar et découvrez ce site historique exceptionnel
                    </p>

                    <div className={styles["cta-buttons"]}>
                        <Link to="/contact" className={`${styles["cta-button"]} ${styles["primary"]}`}>
                            <i className="fas fa-user"></i>
                            <span>Guide local</span>
                            <div className={styles["button-glow"]}></div>
                        </Link>
                        <Link to="/search" className={`${styles["cta-button"]} ${styles["secondary"]}`}>
                            <i className="fas fa-map"></i>
                            <span>Autres sites</span>
                        </Link>
                        <Link to="/my-trip" className={`${styles["cta-button"]} ${styles["accent"]}`}>
                            <i className="fas fa-suitcase"></i>
                            <span>Voir mon voyage</span>
                        </Link>
                    </div>

                    <div className={styles["cta-info"]}>
                        <div className={styles["info-item"]}>
                            <i className="fas fa-phone"></i>
                            <span>Besoin d'aide ? Appelez-nous au +261 34 XX XX XX</span>
                        </div>
                        <div className={styles["info-item"]}>
                            <i className="fas fa-envelope"></i>
                            <span>Ou envoyez-nous un email à contact@madatour.mg</span>
                        </div>
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
                                Votre guide pour découvrir les trésors historiques de Madagascar.
                                Expériences authentiques et mémorables.
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
                                    <i className="fas fa-hiking"></i>
                                    Explorez
                                </h3>
                                <ul>
                                    {['Sites historiques', 'Parcs nationaux', 'Plages', 'Culture', 'Aventure'].map((item) => (
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
                                    <i className="fas fa-info-circle"></i>
                                    Informations
                                </h3>
                                <ul>
                                    {['Conseils voyage', 'Saisonnalité', 'FAQ', 'Contact', 'Blog'].map((item) => (
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
                                    Légal
                                </h3>
                                <ul>
                                    {['Conditions', 'Confidentialité', 'Cookies', 'Mentions légales'].map((item) => (
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
                                Infos sites historiques
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
                            key={i}
                            className={styles["star"]}
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 5}s`
                            }}
                        ></div>
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

export default SiteDetail;