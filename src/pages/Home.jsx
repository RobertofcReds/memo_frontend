import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import clsx from 'clsx';
import styles from './css/Home.module.css';
import logos from '../images/logo-site4.png';
import { useAuth } from '../context/AuthContext';

// Composant IA de recommandation (chargement différé pour performance)
const RecommendationAI = lazy(() => import('../components/recommendation/RecommendationAI'));

// Images HD pour le carrousel avec des images optimisées
const heroImages = [
    'https://upload.wikimedia.org/wikipedia/commons/3/35/AntsirabeAllee.jpg',
    'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    'https://upload.wikimedia.org/wikipedia/commons/1/13/Princess_Bora_Lodge%2C_%C3%8Ele_Sainte-Marie_%283958615912%29.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/f/f5/Couch%C3%A9_de_soleil_et_ponton%2C_ciel_d%C3%A9gag%C3%A9_depuis_la_plage_-_Sainte-Marie-_Madagascar.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/c/c4/Fondation_H_Antananarivo_Madagascar_%2874363%29.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/c/c0/Tamatave_-_panoramio.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/0/0f/6_Ambatoloaka_village_Nosy_B%C3%A9_2013_%21.JPG',
    'https://upload.wikimedia.org/wikipedia/commons/f/f7/Nosy_Be_Island_when_arriving_from_the_sea_%2812%29.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/1/19/Boulevard_Labourdonnais_Toamasina.jpg'
];

// Données des régions enrichies
const popularRegions = [
    {
        id: 1,
        name: 'Nosy Be & Archipel',
        image: 'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        description: 'Plages paradisiaques et faune marine exceptionnelle',
        sites: 9,
        rating: 4.8,
        category: 'plage',
        bestFor: ['Lune de miel', 'Plongée', 'Détente'],
        color: 'linear-gradient(135deg, #4299e1 0%, #63b3ed 100%)'
    },
    {
        id: 2,
        name: 'Antananarivo & Environs',
        image: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Antananarivo_september_2015_01.JPG',
        description: 'Cœur culturel et historique de Madagascar',
        sites: 7,
        rating: 4.5,
        category: 'culture',
        bestFor: ['Histoire', 'Culture', 'Gastronomie'],
        color: 'linear-gradient(135deg, #ed8936 0%, #fbd38d 100%)'
    },
    {
        id: 3,
        name: 'Morondava & Sud-Ouest',
        image: 'https://upload.wikimedia.org/wikipedia/commons/8/81/Sunset_Baobab_Avenue_Morondava_Madagascar_-_panoramio.jpg',
        description: 'Allée des Baobabs et Tsingy de Bemaraha',
        sites: 10,
        rating: 4.9,
        category: 'nature',
        bestFor: ['Aventure', 'Photos', 'Nature'],
        color: 'linear-gradient(135deg, #48bb78 0%, #68d391 100%)'
    },
    {
        id: 4,
        name: 'Île Sainte-Marie',
        image: 'https://upload.wikimedia.org/wikipedia/commons/1/13/Princess_Bora_Lodge%2C_%C3%8Ele_Sainte-Marie_%283958615912%29.jpg',
        description: 'Baleines à bosse et plages préservées',
        sites: 5,
        rating: 4.7,
        category: 'plage',
        bestFor: ['Observation baleines', 'Romantique', 'Écotourisme'],
        color: 'linear-gradient(135deg, #4299e1 0%, #63b3ed 100%)'
    },
    {
        id: 5,
        name: 'Antsiranana (Diégo)',
        image: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Nosy_lonjo_Antsiranana.jpg',
        description: 'Mer d\'Émeraude et parcs nationaux',
        sites: 8,
        rating: 4.6,
        category: 'nature',
        bestFor: ['Randonnée', 'Biodiversité', 'Paysages'],
        color: 'linear-gradient(135deg, #48bb78 0%, #68d391 100%)'
    },
    {
        id: 6,
        name: 'Toamasina & Est',
        image: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Boulevard_Labourdonnais_Toamasina.jpg',
        description: 'Forêts humides et lémuriens Indri',
        sites: 8,
        rating: 4.4,
        category: 'nature',
        bestFor: ['Faune', 'Forêt', 'Aventure'],
        color: 'linear-gradient(135deg, #48bb78 0%, #68d391 100%)'
    }
];

// Témoignages restaurés
const testimonials = [
    {
        id: 1,
        name: 'Sophie M.',
        comment: "L'application m'a permis de découvrir des endroits incroyables que je n'aurais jamais trouvés seule.",
        avatar: '👩',
        rating: 5,
        location: 'Paris, France',
        date: 'Janvier 2024'
    },
    {
        id: 2,
        name: 'Jean P.',
        comment: "Les recommandations personnalisées sont parfaites. Tout correspondait à mes attentes.",
        avatar: '👨',
        rating: 5,
        location: 'Lyon, France',
        date: 'Décembre 2023'
    },
    {
        id: 3,
        name: 'Emma L.',
        comment: "Facile à utiliser et tellement utile pour planifier notre voyage à Madagascar.",
        avatar: '👩',
        rating: 4,
        location: 'Marseille, France',
        date: 'Novembre 2023'
    },
    {
        id: 4,
        name: 'Thomas D.',
        comment: "Une expérience utilisateur exceptionnelle. Je recommande vivement !",
        avatar: '👨',
        rating: 5,
        location: 'Toulouse, France',
        date: 'Octobre 2023'
    },
    {
        id: 5,
        name: 'Marie K.',
        comment: "Les guides locaux proposés sont vraiment compétents et sympathiques.",
        avatar: '👩',
        rating: 4,
        location: 'Nice, France',
        date: 'Septembre 2023'
    },
    {
        id: 6,
        name: 'Paul B.',
        comment: "J'ai adoré les itinéraires personnalisés selon mes centres d'intérêt.",
        avatar: '👨',
        rating: 5,
        location: 'Bordeaux, France',
        date: 'Août 2023'
    },
    {
        id: 7,
        name: 'Sarah T.',
        comment: "Service client réactif et professionnel. Notre voyage était parfait !",
        avatar: '👩',
        rating: 5,
        location: 'Nantes, France',
        date: 'Juillet 2023'
    },
    {
        id: 8,
        name: 'Marc R.',
        comment: "Les prix sont compétitifs et la qualité est au rendez-vous.",
        avatar: '👨',
        rating: 4,
        location: 'Strasbourg, France',
        date: 'Juin 2023'
    }
];

// Messages par défaut pour le chatbot
const defaultChatMessages = [
    {
        id: 1,
        text: "Bonjour ! Je suis votre assistant virtuel MadaTour. Je peux vous aider à :",
        sender: 'bot',
        timestamp: new Date(),
        options: [
            "Trouver des destinations",
            "Planifier un itinéraire",
            "Obtenir des conseils de voyage",
            "En savoir plus sur Madagascar"
        ]
    },
    {
        id: 2,
        text: "Pour commencer, dites-moi ce que vous cherchez ou choisissez une option ci-dessus !",
        sender: 'bot',
        timestamp: new Date()
    }
];


const Home = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [animeTheme] = useState('default');
    const [showRecommendationAI, setShowRecommendationAI] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [typingText, setTypingText] = useState('');
    const [isTestimonialsHovered, setIsTestimonialsHovered] = useState(false);
    const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
    const [showChatbox, setShowChatbox] = useState(false);
    const [chatMessages, setChatMessages] = useState(defaultChatMessages);
    const [chatInput, setChatInput] = useState('');
    const [isChatbotTyping, setIsChatbotTyping] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const navigate = useNavigate();
    const testimonialsRef = useRef(null);
    const heroRef = useRef(null);
    const autoScrollRef = useRef(null);
    const chatboxRef = useRef(null);
    const chatMessagesRef = useRef(null);
    const chatInputRef = useRef(null);
    const {logout} = useAuth()

    // Texte défilant pour l'effet anime - avec useMemo
    const typingTexts = React.useMemo(() => [
        "Découvrez la biodiversité unique de Madagascar",
        "Explorez des paysages à couper le souffle",
        "Plongez dans une culture riche et authentique",
        "Vivez des aventures inoubliables"
    ], []);

    // Animation du carrousel avec effet de fondu
    useEffect(() => {

        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);

        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev === heroImages.length - 1 ? 0 : prev + 1));
        }, 5000);

        // Effet de texte défilant
        let textIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        const typeEffect = () => {
            const currentText = typingTexts[textIndex];

            if (!isDeleting && charIndex < currentText.length) {
                setTypingText(currentText.substring(0, charIndex + 1));
                charIndex++;
            } else if (isDeleting && charIndex > 0) {
                setTypingText(currentText.substring(0, charIndex - 1));
                charIndex--;
            }

            if (!isDeleting && charIndex === currentText.length) {
                setTimeout(() => { isDeleting = true; }, 2000);
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                textIndex = (textIndex + 1) % typingTexts.length;
            }

            setTimeout(typeEffect, isDeleting ? 50 : 100);
        };

        typeEffect();

        return () => {
            clearInterval(interval);
        };
    }, [typingTexts]);

    // Défilement automatique des témoignages
    useEffect(() => {
        const startAutoScroll = () => {
            if (autoScrollRef.current) {
                clearInterval(autoScrollRef.current);
            }

            autoScrollRef.current = setInterval(() => {
                if (!isTestimonialsHovered && testimonialsRef.current) {
                    const container = testimonialsRef.current;
                    const cardWidth = 320; // Largeur d'une carte
                    const maxScroll = container.scrollWidth - container.clientWidth;

                    if (container.scrollLeft >= maxScroll - 10) {
                        // Retour au début
                        container.scrollTo({
                            left: 0,
                            behavior: 'smooth'
                        });
                        setCurrentTestimonialIndex(0);
                    } else {
                        // Défilement vers la droite
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
            }, 3000); // Défile toutes les 3 secondes
        };

        startAutoScroll();

        return () => {
            if (autoScrollRef.current) {
                clearInterval(autoScrollRef.current);
            }
        };
    }, [isTestimonialsHovered]);

    // Gestion du bouton retour en haut
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Scroll automatique des messages du chat
    useEffect(() => {
        if (chatMessagesRef.current && chatMessages.length > 0) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACK_URL}/api/search?query=${encodeURIComponent(searchQuery)}`);
            setTimeout(() => {
                setIsSearching(false);
                navigate('/search', {
                    state: {
                        results: response.data,
                        query: searchQuery
                    }
                });
            }, 800);
        } catch (error) {
            console.error('Erreur de recherche:', error);
            setIsSearching(false);
            // Fallback vers recherche locale
            navigate('/search', {
                state: {
                    results: popularRegions.filter(region =>
                        region.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        region.description.toLowerCase().includes(searchQuery.toLowerCase())
                    ),
                    query: searchQuery
                }
            });
        }
    };

    const handleLogout = () => {
        logout()
        setIsLoggedIn(false);
        navigate('/');
    };

    // Défilement manuel des témoignages
    const scrollTestimonials = (direction) => {
        if (testimonialsRef.current) {
            const scrollAmount = 320; // Largeur d'une carte
            testimonialsRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });

            // Mettre à jour l'index actuel
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

    // Gestion du survol des témoignages
    const handleTestimonialsMouseEnter = () => {
        setIsTestimonialsHovered(true);
        if (autoScrollRef.current) {
            clearInterval(autoScrollRef.current);
        }
    };

    const handleTestimonialsMouseLeave = () => {
        setIsTestimonialsHovered(false);
    };

    // Générer les étoiles de notation avec animations
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

    // Fonction pour ouvrir le modal IA avec positionnement correct
    const handleOpenAI = () => {
        // SCROLL INSTANTANÉ vers le haut
        window.scrollTo(0, 0);

        // Petit délai pour s'assurer que le scroll est fait
        requestAnimationFrame(() => {
            setShowRecommendationAI(true);

            // Empêcher TOUT défilement
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.classList.add('modal-open');
        });
    };

    // Fonction pour fermer le modal IA
    const handleCloseAI = () => {
        setShowRecommendationAI(false);

        // Restaurer le défilement
        document.body.style.overflow = 'auto';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.classList.remove('modal-open');
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

        // Ajouter le message de l'utilisateur
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
                "Je comprends votre demande. Pour vous aider à trouver les meilleures destinations à Madagascar, je vous recommande de visiter notre section 'Destinations' où vous trouverez des informations détaillées sur chaque région.",
                "C'est une excellente question ! Madagascar offre de nombreuses options selon vos intérêts. Souhaitez-vous plutôt des plages, de la randonnée, ou des expériences culturelles ?",
                "Je peux vous aider à planifier votre voyage. Avez-vous une durée de séjour en tête ? Madagascar est si vaste qu'il vaut mieux se concentrer sur 2-3 régions pour un premier voyage.",
                "Pour des conseils personnalisés, je vous suggère de créer un compte MadaTour. Notre assistant IA avancé pourra alors analyser vos préférences et vous proposer un itinéraire sur mesure.",
                "Madagascar est connu pour sa biodiversité unique ! Les lémuriens, les baobabs et les récifs coralliens sont des incontournables. Quand pensez-vous voyager ?"
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

        // Réponses spécifiques selon l'option
        setTimeout(() => {
            let response = "";
            switch (option) {
                case "Trouver des destinations":
                    response = "Je vous recommande de découvrir Nosy Be pour les plages, Morondava pour les baobabs, et Antananarivo pour la culture. Quelle type d'expérience recherchez-vous ?";
                    break;
                case "Planifier un itinéraire":
                    response = "Parfait ! Pour planifier un itinéraire, j'ai besoin de savoir : durée du séjour, budget approximatif, et types d'activités qui vous intéressent.";
                    break;
                case "Obtenir des conseils de voyage":
                    response = "Conseils importants : vaccins à jour, visa touristique, saison idéale (avril à novembre), et prévoir des espèces pour les marchés locaux.";
                    break;
                case "En savoir plus sur Madagascar":
                    response = "Madagascar, 4ème plus grande île du monde, abrite 5% des espèces animales et végétales de la planète. Unique avec ses lémuriens, baobabs et récifs préservés !";
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

    return (
        <div className={`${styles["home-container"]} ${styles[animeTheme]}`}>
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
                            title="Assistant IA de voyage"
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

            {/* Hero section avec animations améliorées */}
            <section className={styles["hero"]} ref={heroRef}>
                <div className={styles["hero-carousel"]}>
                    {heroImages.map((img, index) => (
                        <div
                            key={index}
                            className={clsx(
                                styles["hero-slide"],
                                styles["anime-slide"],
                                { [styles.active]: index === currentImageIndex }
                            )}
                            style={{
                                backgroundImage: `url(${img})`,
                                animationDelay: `${index * 0.5}s`
                            }}
                        >
                            <div className={styles["slide-overlay"]}></div>
                            <div className={styles["anime-glow"]}></div>
                        </div>
                    ))}
                </div>

                <div className={styles["hero-content"]}>
                    <h1 className={styles["anime-text"]}>
                        <span className={styles["text-gradient"]}>
                            Explorez les <span className={styles["text-highlight"]}>merveilles</span> de Madagascar
                        </span>
                    </h1>

                    <div className={styles["typing-container"]}>
                        <p className={styles["typing-text"]}>
                            {typingText}
                            <span className={styles["cursor"]}>|</span>
                        </p>
                    </div>

                    <form className={styles["search-form"]} onSubmit={handleSearch}>
                        <div className={`${styles["search-input-container"]} ${styles["anime-border"]}`}>
                            <i className={`fas fa-search ${styles["search-icon"]}`}></i>
                            <input
                                type="text"
                                placeholder="Rechercher une région, un site, une activité..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles["search-input"]}
                            />
                            <button
                                type="submit"
                                className={`${styles["search-button"]} ${isSearching ? styles.searching : ''}`}
                                disabled={isSearching}
                            >
                                {isSearching ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i>
                                        Recherche...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-paper-plane"></i>
                                        Explorer
                                    </>
                                )}
                            </button>
                        </div>
                        <div className={styles["search-suggestions"]}>
                            <span>Suggestions :</span>
                            {['Plage', 'Randonnée', 'Lémuriens', 'Baobabs'].map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    className={styles["search-tag"]}
                                    onClick={() => setSearchQuery(tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </form>

                    <div className={styles["hero-stats"]}>
                        {[
                            { icon: 'fas fa-map-marked-alt', label: '100+ Sites', value: '100+' },
                            { icon: 'fas fa-users', label: '10k+ Voyageurs', value: '10k+' },
                            { icon: 'fas fa-star', label: '4.8/5 Satisfaction', value: '4.8' },
                            { icon: 'fas fa-leaf', label: 'Éco-responsable', value: '100%' }
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

                {/* Floating elements anime */}
                <div className={styles["floating-elements"]}>
                    <div className={styles["floating-leaf"]}></div>
                    <div className={styles["floating-baobab"]}></div>
                    <div className={styles["floating-wave"]}></div>
                </div>
            </section>

            {/* Assistant IA de recommandation */}
            <Suspense fallback={<div className={styles["loading-ai"]}>Chargement de l'assistant IA...</div>}>
                {showRecommendationAI && (
                    <RecommendationAI onClose={handleCloseAI} />
                )}
            </Suspense>

            {/* Section Pourquoi choisir MadaTour avec animations */}
            <section
                id="why-us"
                className={`${styles["why-us-section"]} ${styles["anime-section"]}`}
                data-animate="true"
            >
                <div className={styles["section-header"]}>
                    <h2>
                        <span className={styles["title-anime"]}>
                            Pourquoi choisir <span className={styles["title-accent"]}>MadaTour</span> ?
                        </span>
                    </h2>
                    <p className={styles["subtitle-anime"]}>
                        Notre engagement pour une expérience de voyage inoubliable
                    </p>
                </div>

                <div className={styles["features-grid"]}>
                    {[
                        {
                            icon: 'fas fa-map',
                            title: 'Itinéraires personnalisés',
                            description: 'Créez des voyages sur mesure selon vos préférences et budget',
                            color: 'blue',
                            delay: 0
                        },
                        {
                            icon: 'fas fa-hand-holding-heart',
                            title: 'Tourisme responsable',
                            description: 'Nous soutenons les communautés locales et préservons l\'environnement',
                            color: 'green',
                            delay: 0.1
                        },
                        {
                            icon: 'fas fa-robot',
                            title: 'Recommandations IA',
                            description: 'Assistant intelligent pour des suggestions personnalisées',
                            color: 'purple',
                            delay: 0.2
                        },
                        {
                            icon: 'fas fa-headset',
                            title: 'Support 24/7',
                            description: 'Assistance en français tout au long de votre voyage',
                            color: 'orange',
                            delay: 0.3
                        }
                    ].map((feature, index) => (
                        <div
                            key={index}
                            className={`${styles["feature-card"]} ${styles[`feature-${feature.color}`]}`}
                            style={{ animationDelay: `${feature.delay}s` }}
                        >
                            <div className={styles["feature-icon-wrapper"]}>
                                <div className={styles["feature-icon"]}>
                                    <i className={feature.icon}></i>
                                </div>
                                <div className={styles["feature-glow"]}></div>
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                            <div className={styles["feature-wave"]}></div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Section Régions populaires avec animations */}
            <section
                id="regions"
                className={`${styles["popular-regions"]} ${styles["anime-section"]}`}
                data-animate="true"
            >
                <div className={styles["section-header"]}>
                    <h2>
                        <span className={styles["title-anime"]}>
                            Nos <span className={styles["title-accent"]}>régions</span> populaires
                        </span>
                    </h2>
                    <p className={styles["subtitle-anime"]}>
                        Découvrez les destinations les plus prisées de Madagascar
                    </p>
                </div>

                <div className={styles["regions-grid"]}>
                    {popularRegions.map((region, index) => (
                        <div
                            key={region.id}
                            className={`${styles["region-card"]} ${styles[region.category]}`}
                            style={{
                                animationDelay: `${index * 0.1}s`,
                                '--card-color': region.color
                            }}
                        >
                            <div className={styles["region-image-container"]}>
                                <img
                                    src={region.image}
                                    alt={region.name}
                                    className={styles["region-image"]}
                                    loading="lazy"
                                />
                                <div className={styles["region-gradient"]}></div>
                                <div className={styles["region-badge"]}>
                                    <i className="fas fa-map-marker-alt"></i>
                                    <span>{region.sites} sites</span>
                                </div>
                                <div className={styles["region-tags"]}>
                                    {region.bestFor.map((tag, i) => (
                                        <span key={i} className={styles["region-tag"]}>{tag}</span>
                                    ))}
                                </div>
                            </div>

                            <div className={styles["region-content"]}>
                                <h3>
                                    <i className="fas fa-compass"></i>
                                    {region.name}
                                </h3>
                                <p className={styles["region-description"]}>{region.description}</p>

                                <div className={styles["region-meta"]}>
                                    <div className={styles["rating"]}>
                                        {renderStars(region.rating)}
                                        <span className={styles["rating-number"]}>{region.rating}</span>
                                    </div>

                                    <Link
                                        to={`/region/${region.id}`}
                                        className={styles["explore-link"]}
                                    >
                                        <span>Explorer</span>
                                        <i className="fas fa-arrow-right"></i>
                                        <div className={styles["link-glow"]}></div>
                                    </Link>
                                </div>
                            </div>

                            {/* Effets anime pour la carte */}
                            <div className={styles["card-glow"]}></div>
                            <div className={styles["card-sparkles"]}></div>
                        </div>
                    ))}
                </div>

                <div className={styles["view-all-container"]}>
                    <Link to="/regions" className={styles["view-all-button"]}>
                        <span>Voir toutes les régions</span>
                        <i className="fas fa-arrow-right"></i>
                        <div className={styles["button-glow"]}></div>
                    </Link>
                </div>
            </section>

            {/* SECTION TÉMOIGNAGES AMÉLIORÉE avec défilement automatique */}
            <section
                id="testimonials"
                className={`${styles["testimonials-section"]} ${styles["anime-section"]}`}
                data-animate="true"
                onMouseEnter={handleTestimonialsMouseEnter}
                onMouseLeave={handleTestimonialsMouseLeave}
            >
                <div className={styles["section-header"]}>
                    <h2>
                        <span className={styles["title-anime"]}>
                            Ce que disent <span className={styles["title-accent"]}>nos voyageurs</span>
                        </span>
                    </h2>
                    <p className={styles["subtitle-anime"]}>
                        Découvrez les expériences authentiques de nos clients
                    </p>
                </div>

                <div className={styles["testimonials-container"]}>
                    <button
                        className={clsx(styles["scroll-button"], styles["left"])}
                        onClick={() => scrollTestimonials('left')}
                        aria-label="Témoignage précédent"
                    >
                        <i className="fas fa-chevron-left"></i>
                    </button>

                    <div
                        className={styles["testimonials-slider"]}
                        ref={testimonialsRef}
                        style={{ cursor: isTestimonialsHovered ? 'grab' : 'default' }}
                    >
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={`testimonial-${testimonial.id}-${index}`} // ← Clé unique
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
                                    </div>
                                </div>

                                {/* Effets anime */}
                                <div className={styles["testimonial-glow"]}></div>
                                <div className={styles["testimonial-sparkle"]}></div>
                            </div>
                        ))}
                    </div>

                    <button
                        className={clsx(styles["scroll-button"], styles["right"])}
                        onClick={() => scrollTestimonials('right')}
                        aria-label="Témoignage suivant"
                    >
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>

                {/* Indicateurs de pagination */}
                <div className={styles["testimonials-pagination"]}>
                    {testimonials.slice(0, Math.ceil(testimonials.length / 3)).map((_, index) => (
                        <button
                            key={index}
                            className={`${styles["pagination-dot"]} ${index === currentTestimonialIndex ? styles.active : ''
                                }`}
                            onClick={() => {
                                if (testimonialsRef.current) {
                                    const cardWidth = 320; // Largeur d'une carte
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

            {/* CTA Section améliorée */}
            {/* Section CTA conditionnelle - REMPLACER TOUTE LA SECTION */}
            {!isLoggedIn ? (
                <section className={styles["cta-section"]}>
                    <div className={styles["cta-content"]}>
                        <div className={styles["cta-animation"]}>
                            <div className={styles["cta-orbs"]}>
                                <div className={styles["orb-1"]}></div>
                                <div className={styles["orb-2"]}></div>
                                <div className={styles["orb-3"]}></div>
                            </div>
                        </div>

                        <h2>Prêt à explorer Madagascar ?</h2>
                        <p>Créez votre compte et planifiez votre voyage dès maintenant</p>

                        <div className={styles["cta-buttons"]}>
                            <Link to="/register" className={`${styles["cta-button"]} ${styles["primary"]}`}>
                                <i className="fas fa-rocket"></i>
                                <span>S'inscrire gratuitement</span>
                                <div className={styles["button-particles"]}></div>
                            </Link>
                            <Link to="/contact" className={`${styles["cta-button"]} ${styles["secondary"]}`}>
                                <i className="fas fa-envelope"></i>
                                <span>Contactez-nous</span>
                            </Link>
                        </div>
                    </div>
                </section>
            ) : (
                <section className={styles["user-cta-section"]}>
                    <div className={styles["user-cta-content"]}>
                        <div className={styles["user-cta-animation"]}>
                            <div className={styles["user-cta-orbs"]}>
                                <div className={styles["user-orb-1"]}></div>
                                <div className={styles["user-orb-2"]}></div>
                            </div>
                        </div>

                        <h2>Continuez votre aventure à Madagascar !</h2>
                        <p>Explorez plus de destinations, gérez vos favoris et planifiez vos prochains voyages</p>

                        <div className={styles["user-cta-buttons"]}>
                            <Link to="/dashboard" className={`${styles["user-cta-button"]} ${styles["primary"]}`}>
                                <i className="fas fa-compass"></i>
                                <span>Voir mon tableau de bord</span>
                            </Link>
                            <Link to="/activities" className={`${styles["user-cta-button"]} ${styles["secondary"]}`}>
                                <i className="fas fa-hiking"></i>
                                <span>Découvrir des activités</span>
                            </Link>
                            <Link to="/dashboard" className={`${styles["user-cta-button"]} ${styles["tertiary"]}`}>
                                <i className="fas fa-user-edit"></i>
                                <span>Compléter mon profil</span>
                            </Link>
                        </div>
                    </div>
                </section>
            )}

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
                                Votre guide ultime pour explorer les merveilles de Madagascar.
                                Tourisme responsable et authentique.
                            </p>

                            <div className={styles["social-links-home"]}>
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
                                    <i className="fas fa-compass"></i>
                                    Destinations
                                </h3>
                                <ul>
                                    {['Régions', 'Sites touristiques', 'Activités', 'Itinéraires', 'Guides locaux'].map((item) => (
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
                                    {['Conseils voyage', 'À propos', 'FAQ', 'Contact', 'Blog'].map((item) => (
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
                                    {['Conditions d\'utilisation', 'Politique de confidentialité', 'Cookies', 'Mentions légales'].map((item) => (
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

            {/* Chatbox flottante */}
            <div className={styles["chatbox-container"]} ref={chatboxRef}>
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
                                    <i className="fas fa-robot"></i>
                                    <div className={styles["avatar-status"]}></div>
                                </div>
                                <div className={styles["chatbox-info"]}>
                                    <h3>Assistant MadaTour</h3>
                                    <p>En ligne • Prêt à vous aider</p>
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
                                    key={message.id}
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
                                                    key={`option-${message.id}-${idx}`} // ← Clé unique
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
                                    placeholder="Tapez votre message ici..."
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
        </div>
    );
};

export default Home;