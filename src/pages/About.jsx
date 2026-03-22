import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import clsx from 'clsx';
import styles from './css/About.module.css';
import logos from '../images/logo-site4.png';

// Composant IA de recommandation (chargement différé pour performance)
const RecommendationAI = React.lazy(() => import('../components/recommendation/RecommendationAI'));

const About = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showRecommendationAI, setShowRecommendationAI] = useState(false);
    const [showChatbox, setShowChatbox] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatbotTyping, setIsChatbotTyping] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [animeTheme] = useState('default');
    const [currentMilestoneIndex, setCurrentMilestoneIndex] = useState(0);
    const navigate = useNavigate();
    const chatboxRef = useRef(null);
    const chatMessagesRef = useRef(null);
    const chatInputRef = useRef(null);
    const milestonesRef = useRef(null);
    const autoScrollRef = useRef(null);
    const [isMilestonesHovered, setIsMilestonesHovered] = useState(false);

    // Messages par défaut pour le chatbot
    const defaultChatMessages = [
        {
            id: 1,
            text: "Bonjour ! Je suis l'assistant de MadaTour. Je peux vous parler de :",
            sender: 'bot',
            timestamp: new Date(),
            options: [
                "Notre histoire",
                "Notre mission",
                "Nos valeurs",
                "Rencontrer l'équipe"
            ]
        },
        {
            id: 2,
            text: "Dites-moi ce qui vous intéresse ou choisissez une option ci-dessus !",
            sender: 'bot',
            timestamp: new Date()
        }
    ];

    // Vérifier si l'utilisateur est connecté
    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
        setChatMessages(defaultChatMessages);

        // Gestion du bouton retour en haut
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Défilement automatique des milestones
    useEffect(() => {
        const startAutoScroll = () => {
            if (autoScrollRef.current) {
                clearInterval(autoScrollRef.current);
            }

            autoScrollRef.current = setInterval(() => {
                if (!isMilestonesHovered && milestonesRef.current) {
                    const container = milestonesRef.current;
                    const cardWidth = 300;
                    const maxScroll = container.scrollWidth - container.clientWidth;

                    if (container.scrollLeft >= maxScroll - 10) {
                        container.scrollTo({
                            left: 0,
                            behavior: 'smooth'
                        });
                        setCurrentMilestoneIndex(0);
                    } else {
                        const newScrollLeft = container.scrollLeft + cardWidth;
                        container.scrollTo({
                            left: newScrollLeft,
                            behavior: 'smooth'
                        });
                        setCurrentMilestoneIndex(prev =>
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
    }, [isMilestonesHovered]);

    // Scroll automatique des messages du chat
    useEffect(() => {
        if (chatMessagesRef.current && chatMessages.length > 0) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        navigate('/');
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

    // Fonction pour ouvrir le modal IA
    const handleOpenAI = () => {
        window.scrollTo(0, 0);
        requestAnimationFrame(() => {
            setShowRecommendationAI(true);
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.classList.add('modal-open');
        });
    };

    // Fonction pour fermer le modal IA
    const handleCloseAI = () => {
        setShowRecommendationAI(false);
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
                "MadaTour a été fondé en 2025 par des passionnés de Madagascar. Notre mission est de rendre accessible la découverte authentique de l'île rouge tout en soutenant les communautés locales.",
                "Notre équipe travaille avec plus de 200 guides locaux certifiés et 50 hébergements éco-responsables à travers tout Madagascar. Nous croyons en un tourisme durable et respectueux.",
                "Nos valeurs principales sont l'authenticité, la durabilité, l'innovation et le soutien aux communautés. Chaque voyage organisé par MadaTour contribue directement à l'économie locale.",
                "Notre équipe est composée de passionnés de Madagascar. Mahery Niaina, notre fondateur, a plus de 10 ans d'expérience dans le tourisme malgache. Toute l'équipe partage la même passion pour cette île unique."
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
                case "Notre histoire":
                    response = "MadaTour est né en 2025 de la rencontre de passionnés de Madagascar. Partant du constat que beaucoup de voyageurs manquaient les trésors authentiques de l'île, nous avons créé une plateforme connectant directement aux expériences locales authentiques. Aujourd'hui, nous sommes fiers d'avoir facilité plus de 10,000 voyages mémorables !";
                    break;
                case "Notre mission":
                    response = "Notre mission est triple : \n1. Rendre accessible la découverte authentique de Madagascar \n2. Soutenir directement les communautés locales \n3. Promouvoir un tourisme durable et responsable. Chaque voyage que nous organisons contribue à ces trois objectifs.";
                    break;
                case "Nos valeurs":
                    response = "Nos 4 valeurs fondamentales : \n✦ Authenticité - Nous privilégions les expériences vraies \n✦ Durabilité - Nous protégeons les écosystèmes uniques \n✦ Innovation - Nous améliorons constamment votre expérience \n✦ Communauté - Nous soutenons directement les populations locales.";
                    break;
                case "Rencontrer l'équipe":
                    response = "Notre équipe : \n👨🏽 Mahery Niaina (Fondateur) - Expert tourisme \n👩🏽 Andry Victor (Expérience client) - Passionnée service \n👨🏽 Judicaël Roberto (Développeur) - Expert technologies \n👩🏽 Eric Manana (Guide) - Connaît chaque recoin de Madagascar. Tous partagent la même passion !";
                    break;
                default:
                    response = "Je peux vous en dire plus sur MadaTour. Quelle information spécifique recherchez-vous ?";
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

    // Défilement manuel des milestones
    const scrollMilestones = (direction) => {
        if (milestonesRef.current) {
            const scrollAmount = 300;
            milestonesRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });

            if (direction === 'right') {
                setCurrentMilestoneIndex(prev =>
                    (prev + 1) % Math.ceil(milestonesRef.current.scrollWidth / scrollAmount)
                );
            } else {
                setCurrentMilestoneIndex(prev =>
                    prev === 0 ? Math.ceil(milestonesRef.current.scrollWidth / scrollAmount) - 1 : prev - 1
                );
            }
        }
    };

    // Gestion du survol des milestones
    const handleMilestonesMouseEnter = () => {
        setIsMilestonesHovered(true);
        if (autoScrollRef.current) {
            clearInterval(autoScrollRef.current);
        }
    };

    const handleMilestonesMouseLeave = () => {
        setIsMilestonesHovered(false);
    };

    const teamMembers = [
        {
            id: 1,
            name: 'Mahery Niaina',
            role: 'Fondateur & CEO',
            bio: 'Expert en tourisme malgache avec 10 ans d\'expérience',
            photo: '👨🏽',
            specialty: 'Stratégie & Développement',
            quote: '"Madagascar mérite d\'être découverte authentiquement"',
            social: {
                linkedin: '#',
                twitter: '#',
                email: 'mahery@madatour.mg'
            }
        },
        {
            id: 2,
            name: 'Andry Victor',
            role: 'Responsable Expérience Client',
            bio: 'Passionnée par le service et l\'accueil des voyageurs',
            photo: '👩🏽',
            specialty: 'Service Client & Satisfaction',
            quote: '"Chaque voyageur mérite une expérience personnalisée"',
            social: {
                linkedin: '#',
                twitter: '#',
                email: 'andry@madatour.mg'
            }
        },
        {
            id: 3,
            name: 'Judicaël Roberto',
            role: 'Développeur Principal',
            bio: 'Spécialiste des technologies touristiques innovantes',
            photo: '👨🏽',
            specialty: 'Technologie & Innovation',
            quote: '"La technologie au service de l\'expérience voyage"',
            social: {
                linkedin: '#',
                twitter: '#',
                email: 'judicael@madatour.mg'
            }
        },
        {
            id: 4,
            name: 'Eric Manana',
            role: 'Guide Touristique Principal',
            bio: 'Connaît chaque recoin de Madagascar comme sa poche',
            photo: '👩🏽',
            specialty: 'Expertise Terrain & Culture',
            quote: '"Je partage ma passion pour cette île magnifique"',
            social: {
                linkedin: '#',
                twitter: '#',
                email: 'eric@madatour.mg'
            }
        },
        {
            id: 5,
            name: 'Sarah Andriamiarisoa',
            role: 'Responsable Durabilité',
            bio: 'Engagée pour un tourisme éco-responsable à Madagascar',
            photo: '👩🏽',
            specialty: 'Écotourisme & Communautés',
            quote: '"Préserver pour mieux partager"',
            social: {
                linkedin: '#',
                twitter: '#',
                email: 'sarah@madatour.mg'
            }
        },
        {
            id: 6,
            name: 'Thomas Rakoto',
            role: 'Marketing Digital',
            bio: 'Expert en promotion du tourisme malgache à l\'international',
            photo: '👨🏽',
            specialty: 'Stratégie Digitale',
            quote: '"Raconter les merveilles de Madagascar au monde"',
            social: {
                linkedin: '#',
                twitter: '#',
                email: 'thomas@madatour.mg'
            }
        }
    ];

    const values = [
        {
            id: 1,
            title: 'Authenticité',
            description: 'Nous promouvons un tourisme vrai et respectueux des cultures locales',
            icon: 'fas fa-heart',
            color: 'linear-gradient(135deg, #ff006e 0%, #ff6b6b 100%)',
            details: [
                'Expériences locales authentiques',
                'Rencontres avec les communautés',
                'Traditions préservées'
            ]
        },
        {
            id: 2,
            title: 'Durabilité',
            description: 'Engagés pour un tourisme responsable qui préserve notre environnement',
            icon: 'fas fa-leaf',
            color: 'linear-gradient(135deg, #00bb8d 0%, #48cae4 100%)',
            details: [
                'Compensation carbone',
                'Hébergements éco-responsables',
                'Protection de la biodiversité'
            ]
        },
        {
            id: 3,
            title: 'Innovation',
            description: 'Nous repoussons les limites pour améliorer votre expérience voyage',
            icon: 'fas fa-lightbulb',
            color: 'linear-gradient(135deg, #ffbe0b 0%, #ff9e00 100%)',
            details: [
                'Technologies touristiques',
                'Solutions digitales innovantes',
                'Expérience utilisateur optimale'
            ]
        },
        {
            id: 4,
            title: 'Communauté',
            description: 'Nous soutenons directement les populations et artisans locaux',
            icon: 'fas fa-hands-helping',
            color: 'linear-gradient(135deg, #7209b7 0%, #9d4edd 100%)',
            details: [
                'Revenus directs aux communautés',
                'Formation des guides locaux',
                'Projets de développement'
            ]
        }
    ];

    const milestones = [
        {
            year: '2025',
            title: 'Fondation de MadaTour',
            description: 'Création de la plateforme avec 10 guides partenaires',
            icon: 'fas fa-seedling',
            color: 'var(--anime-green)'
        },
        {
            year: '2026',
            title: 'Expansion nationale',
            description: '500+ voyageurs satisfaits, 50 guides partenaires',
            icon: 'fas fa-expand',
            color: 'var(--anime-blue)'
        },
        {
            year: '2027',
            title: 'Innovation technologique',
            description: 'Lancement de l\'assistant IA et application mobile',
            icon: 'fas fa-robot',
            color: 'var(--anime-purple)'
        },
        {
            year: '2028',
            title: 'Reconnaissance internationale',
            description: 'Prix du meilleur tourisme durable en Afrique',
            icon: 'fas fa-trophy',
            color: 'var(--anime-yellow)'
        },
        {
            year: '2029',
            title: 'Impact communautaire',
            description: '10,000+ voyageurs, 200+ guides, 50 hébergements partenaires',
            icon: 'fas fa-users',
            color: 'var(--anime-pink)'
        }
    ];

    const stats = [
        { value: '10,000+', label: 'Voyageurs satisfaits', icon: 'fas fa-users' },
        { value: '200+', label: 'Guides locaux partenaires', icon: 'fas fa-user-tie' },
        { value: '50+', label: 'Hébergements éco-responsables', icon: 'fas fa-hotel' },
        { value: '4.8/5', label: 'Satisfaction moyenne', icon: 'fas fa-star' },
        { value: '15+', label: 'Régions couvertes', icon: 'fas fa-map-marked-alt' },
        { value: '100%', label: 'Engagement local', icon: 'fas fa-hand-holding-heart' }
    ];

    const testimonials = [
        {
            id: 1,
            name: 'Sophie M.',
            comment: "MadaTour a transformé notre voyage à Madagascar. L'équipe est incroyablement professionnelle et passionnée.",
            avatar: '👩',
            rating: 5,
            location: 'Paris, France',
            date: 'Janvier 2024'
        },
        {
            id: 2,
            name: 'Jean P.',
            comment: "Une équipe qui connaît parfaitement Madagascar. Chaque recommandation était parfaite !",
            avatar: '👨',
            rating: 5,
            location: 'Lyon, France',
            date: 'Décembre 2023'
        },
        {
            id: 3,
            name: 'Emma L.',
            comment: "L'engagement pour un tourisme responsable est impressionnant. Je recommande vivement !",
            avatar: '👩',
            rating: 4,
            location: 'Marseille, France',
            date: 'Novembre 2023'
        }
    ];

    return (
        <div className={`${styles["about-container"]} ${styles[animeTheme]}`}>
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
                        <Link to="/about" className={`${styles["nav-link"]} ${styles.active}`}>
                            <i className="fas fa-info-circle"></i>
                            À propos
                        </Link>
                    </div>

                    <div className={styles["auth-section"]}>
                        <button
                            className={styles["ai-button"]}
                            onClick={handleOpenAI}
                            title="Assistant IA MadaTour"
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
            <section className={styles["about-hero"]}>
                <div className={styles["hero-overlay"]}></div>
                <div className={styles["hero-slides"]}>
                    <div className={styles["hero-slide"]} style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1503917988258-f87a78e3c995?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`
                    }}></div>
                    <div className={styles["hero-slide"]} style={{
                        backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/5/5d/Andringitra%2C_Madagascar_by_Effervescing_Elephant-09.jpg')`
                    }}></div>
                    <div className={styles["hero-slide"]} style={{
                        backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/3/3b/Baleine_%C3%A0_bosse%2C_Sainte_Marie%2C_Madagascar_%2825979659352%29.jpg')`
                    }}></div>
                </div>

                <div className={styles["hero-content"]}>
                    <h1 className={styles["anime-text"]}>
                        <span className={styles["text-gradient"]}>
                            Notre <span className={styles["text-highlight"]}>passion</span> pour Madagascar
                        </span>
                    </h1>

                    <p className={styles["hero-subtitle"]}>
                        Découvrez l'histoire, les valeurs et l'équipe qui font de MadaTour votre guide de confiance
                    </p>

                    <div className={styles["hero-stats"]}>
                        {stats.slice(0, 4).map((stat, index) => (
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

                {/* Scroll indicator */}
                <div className={styles["scroll-indicator"]}>
                    <i className="fas fa-chevron-down"></i>
                </div>
            </section>

            {/* Assistant IA de recommandation */}
            {showRecommendationAI && (
                <React.Suspense fallback={<div className={styles["loading-ai"]}>Chargement de l'assistant IA...</div>}>
                    <RecommendationAI onClose={handleCloseAI} />
                </React.Suspense>
            )}

            {/* Section Notre Histoire avec animations */}
            <section
                id="histoire"
                className={`${styles["about-section"]} ${styles["anime-section"]}`}
                data-animate="true">
                <div className={styles["section-container"]}>
                    <div className={styles["text-content"]}>
                        <div className={styles["section-header"]}>
                            <h2>
                                <span className={styles["title-anime"]}>
                                    Notre <span className={styles["title-accent"]}>histoire</span>
                                </span>
                            </h2>
                            <p className={styles["subtitle-anime"]}>
                                Du rêve à la réalité : comment MadaTour est né
                            </p>
                        </div>

                        <div className={styles["story-content"]}>
                            <p>
                                <i className="fas fa-quote-left"></i>
                                Fondé en 2025, <strong>MadaTour</strong> est né de la passion partagée de ses créateurs pour les richesses naturelles
                                et culturelles de Madagascar. Ce qui a commencé comme un petit projet local est rapidement devenu
                                la référence pour les voyageurs souhaitant découvrir l'île rouge authentiquement.
                            </p>
                            <p>
                                Notre vision était simple : rendre accessible la vraie beauté de Madagascar tout en préservant
                                ses trésors naturels et culturels. Aujourd'hui, nous collaborons avec plus de <strong>200 guides locaux</strong> et
                                <strong>50 hébergements éco-responsables</strong> à travers tout le pays.
                            </p>
                        </div>

                        <div className={styles["impact-stats"]}>
                            <div className={styles["impact-stat"]}>
                                <i className="fas fa-calendar-check"></i>
                                <div>
                                    <span className={styles["impact-value"]}>2025</span>
                                    <span className={styles["impact-label"]}>Année de création</span>
                                </div>
                            </div>
                            <div className={styles["impact-stat"]}>
                                <i className="fas fa-handshake"></i>
                                <div>
                                    <span className={styles["impact-value"]}>250+</span>
                                    <span className={styles["impact-label"]}>Partenaires locaux</span>
                                </div>
                            </div>
                            <div className={styles["impact-stat"]}>
                                <i className="fas fa-globe-africa"></i>
                                <div>
                                    <span className={styles["impact-value"]}>15</span>
                                    <span className={styles["impact-label"]}>Régions couvertes</span>
                                </div>
                            </div>
                        </div>

                        <Link to="/contact" className={`${styles["cta-button"]} ${styles["primary"]}`}>
                            <span>Nous rejoindre</span>
                            <i className="fas fa-arrow-right"></i>
                            <div className={styles["button-glow"]}></div>
                        </Link>
                    </div>

                    <div className={`${styles["image-content"]} ${styles["anime-image"]}`}>
                        <div className={styles["image-wrapper"]}>
                            <img src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Notre équipe explorant Madagascar" />
                            <div className={styles["image-overlay"]}></div>
                            <div className={styles["image-badge"]}>
                                <i className="fas fa-heart"></i>
                                <span>Depuis 2025</span>
                            </div>
                        </div>
                        {/* Effets anime */}
                        <div className={styles["image-glow"]}></div>
                        <div className={styles["image-sparkles"]}></div>
                    </div>
                </div>
            </section>

            {/* Section Notre Mission */}
            <section
                id="mission"
                className={`${styles["mission-section"]} ${styles["anime-section"]}`}
                data-animate="true">
                <div className={styles["section-container"]}>
                    <div className={`${styles["image-content"]} ${styles["anime-image"]}`}>
                        <div className={styles["image-wrapper"]}>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Massif_de_l%27Isalo.jpg" alt="Paysage typique de Madagascar" />
                            <div className={styles["image-overlay"]}></div>
                            <div className={styles["image-badge"]}>
                                <i className="fas fa-bullseye"></i>
                                <span>Notre engagement</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles["text-content"]}>
                        <div className={styles["section-header"]}>
                            <h2>
                                <span className={styles["title-anime"]}>
                                    Notre <span className={styles["title-accent"]}>mission</span>
                                </span>
                            </h2>
                            <p className={styles["subtitle-anime"]}>
                                Transformer la façon dont on découvre Madagascar
                            </p>
                        </div>

                        <div className={styles["mission-content"]}>
                            <p>
                                Chez MadaTour, nous croyons que voyager devrait être à la fois <strong>enrichissant pour les visiteurs</strong>
                                et <strong>bénéfique pour les communautés d'accueil</strong>. Notre plateforme connecte les voyageurs aux meilleures
                                expériences tout en soutenant directement l'économie locale.
                            </p>

                            <div className={styles["mission-grid"]}>
                                {[
                                    {
                                        icon: 'fas fa-compass',
                                        title: 'Guider',
                                        description: 'Vers les expériences authentiques'
                                    },
                                    {
                                        icon: 'fas fa-shield-alt',
                                        title: 'Protéger',
                                        description: 'Les écosystèmes uniques'
                                    },
                                    {
                                        icon: 'fas fa-hands-helping',
                                        title: 'Soutenir',
                                        description: 'Les communautés locales'
                                    },
                                    {
                                        icon: 'fas fa-lightbulb',
                                        title: 'Innover',
                                        description: 'L\'expérience voyage'
                                    }
                                ].map((item, index) => (
                                    <div key={index} className={styles["mission-item"]}>
                                        <div className={styles["mission-icon"]}>
                                            <i className={item.icon}></i>
                                            <div className={styles["icon-glow"]}></div>
                                        </div>
                                        <h4>{item.title}</h4>
                                        <p>{item.description}</p>
                                    </div>
                                ))}
                            </div>

                            <ul className={styles["mission-list"]}>
                                {[
                                    "Faciliter la découverte des trésors malgaches",
                                    "Promouvoir un tourisme durable et responsable",
                                    "Valoriser le savoir-faire local",
                                    "Offrir une expérience personnalisée à chaque voyageur"
                                ].map((item, index) => (
                                    <li key={index} className={styles["anime-list-item"]} style={{ animationDelay: `${index * 0.1}s` }}>
                                        <i className="fas fa-check-circle"></i>
                                        <span>{item}</span>
                                        <div className={styles["list-glow"]}></div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section Notre Parcours avec défilement automatique */}
            <section
                id="parcours"
                className={`${styles["journey-section"]} ${styles["anime-section"]}`}
                data-animate="true"
                onMouseEnter={handleMilestonesMouseEnter}
                onMouseLeave={handleMilestonesMouseLeave}>
                <div className={styles["section-header"]}>
                    <h2>
                        <span className={styles["title-anime"]}>
                            Notre <span className={styles["title-accent"]}>parcours</span>
                        </span>
                    </h2>
                    <p className={styles["subtitle-anime"]}>
                        Les étapes clés de notre développement
                    </p>
                </div>

                <div className={styles["journey-container"]}>
                    <button
                        className={clsx(styles["scroll-button"], styles["left"])}
                        onClick={() => scrollMilestones('left')}
                        aria-label="Étape précédente"
                    >
                        <i className="fas fa-chevron-left"></i>
                    </button>

                    <div
                        className={styles["milestones-slider"]}
                        ref={milestonesRef}
                        style={{ cursor: isMilestonesHovered ? 'grab' : 'default' }}
                    >
                        {milestones.map((milestone, index) => (
                            <div
                                key={index}
                                className={styles["milestone-card"]}
                                data-index={index}
                                style={{ '--milestone-color': milestone.color }}
                            >
                                <div className={styles["milestone-year"]}>
                                    <span>{milestone.year}</span>
                                    <div className={styles["year-glow"]}></div>
                                </div>

                                <div className={styles["milestone-icon"]}>
                                    <i className={milestone.icon}></i>
                                    <div className={styles["icon-pulse"]}></div>
                                </div>

                                <h3>{milestone.title}</h3>
                                <p className={styles["milestone-description"]}>{milestone.description}</p>

                                <div className={styles["milestone-line"]}></div>

                                {/* Effets anime */}
                                <div className={styles["milestone-glow"]}></div>
                                <div className={styles["milestone-sparkle"]}></div>
                            </div>
                        ))}
                    </div>

                    <button
                        className={clsx(styles["scroll-button"], styles["right"])}
                        onClick={() => scrollMilestones('right')}
                        aria-label="Étape suivante"
                    >
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>

                {/* Indicateurs de pagination */}
                <div className={styles["milestones-pagination"]}>
                    {milestones.slice(0, Math.ceil(milestones.length / 3)).map((_, index) => (
                        <button
                            key={index}
                            className={`${styles["pagination-dot"]} ${index === currentMilestoneIndex ? styles.active : ''
                                }`}
                            onClick={() => {
                                if (milestonesRef.current) {
                                    const cardWidth = 300;
                                    milestonesRef.current.scrollTo({
                                        left: index * cardWidth * 3,
                                        behavior: 'smooth'
                                    });
                                    setCurrentMilestoneIndex(index);
                                }
                            }}
                            aria-label={`Aller à l'étape ${index + 1}`}
                        />
                    ))}
                </div>
            </section>

            {/* Section Nos Valeurs avec animations */}
            <section
                id="valeurs"
                className={`${styles["values-section"]} ${styles["anime-section"]}`}
                data-animate="true">
                <div className={styles["section-header"]}>
                    <h2>
                        <span className={styles["title-anime"]}>
                            Nos <span className={styles["title-accent"]}>valeurs</span>
                        </span>
                    </h2>
                    <p className={styles["subtitle-anime"]}>
                        Les principes qui guident chacune de nos actions
                    </p>
                </div>

                <div className={styles["values-grid"]}>
                    {values.map((value, index) => (
                        <div
                            key={value.id}
                            className={`${styles["value-card"]} ${styles["anime-value"]}`}
                            style={{
                                animationDelay: `${index * 0.2}s`,
                                '--card-color': value.color
                            }}
                        >
                            <div className={styles["value-icon-wrapper"]}>
                                <div className={styles["value-icon"]}>
                                    <i className={value.icon}></i>
                                </div>
                                <div className={styles["value-glow"]}></div>
                                <div className={styles["value-orb"]}></div>
                            </div>

                            <h3>{value.title}</h3>
                            <p className={styles["value-description"]}>{value.description}</p>

                            <div className={styles["value-details"]}>
                                {value.details.map((detail, idx) => (
                                    <span key={idx} className={styles["detail-item"]}>
                                        <i className="fas fa-circle"></i> {detail}
                                    </span>
                                ))}
                            </div>

                            <div className={styles["value-wave"]}></div>
                            <div className={styles["card-sparkles"]}>
                                <div className={styles["sparkle-1"]}></div>
                                <div className={styles["sparkle-2"]}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Section Notre Équipe avec animations */}
            <section
                id="equipe"
                className={`${styles["team-section"]} ${styles["anime-section"]}`}
                data-animate="true">
                <div className={styles["section-header"]}>
                    <h2>
                        <span className={styles["title-anime"]}>
                            Notre <span className={styles["title-accent"]}>équipe</span>
                        </span>
                    </h2>
                    <p className={styles["subtitle-anime"]}>
                        Des passionnés de Madagascar à votre service
                    </p>
                </div>

                <div className={styles["team-grid"]}>
                    {teamMembers.map((member, index) => (
                        <div
                            key={member.id}
                            className={`${styles["team-card"]} ${styles["anime-card"]}`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className={styles["team-avatar-wrapper"]}>
                                <div className={styles["team-avatar"]}>
                                    <span className={styles["avatar-icon"]}>{member.photo}</span>
                                    <div className={styles["avatar-ring"]}></div>
                                    <div className={styles["avatar-glow"]}></div>
                                </div>
                                <div className={styles["avatar-badge"]}>
                                    <i className="fas fa-star"></i>
                                </div>
                            </div>

                            <h3>{member.name}</h3>
                            <p className={styles["role"]}>
                                <i className="fas fa-briefcase"></i> {member.role}
                            </p>
                            <p className={styles["specialty"]}>
                                <i className="fas fa-gem"></i> {member.specialty}
                            </p>
                            <p className={styles["bio"]}>{member.bio}</p>

                            <div className={styles["team-quote"]}>
                                <i className="fas fa-quote-left"></i>
                                <p>{member.quote}</p>
                            </div>

                            <div className={styles["social-links"]}>
                                <a
                                    href={member.social.linkedin}
                                    aria-label="LinkedIn"
                                    className={styles["social-link"]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <i className="fab fa-linkedin"></i>
                                    <div className={styles["social-glow"]}></div>
                                </a>
                                <a
                                    href={member.social.twitter}
                                    aria-label="Twitter"
                                    className={styles["social-link"]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <i className="fab fa-twitter"></i>
                                    <div className={styles["social-glow"]}></div>
                                </a>
                                <a
                                    href={`mailto:${member.social.email}`}
                                    aria-label="Email"
                                    className={styles["social-link"]}
                                >
                                    <i className="fas fa-envelope"></i>
                                    <div className={styles["social-glow"]}></div>
                                </a>
                            </div>

                            {/* Effets anime */}
                            <div className={styles["team-card-glow"]}></div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Section Témoignages */}
            <section
                id="temoignages"
                className={`${styles["testimonials-section"]} ${styles["anime-section"]}`}
                data-animate="true">
                <div className={styles["section-header"]}>
                    <h2>
                        <span className={styles["title-anime"]}>
                            Ceux que disent <span className={styles["title-accent"]}>nos voyageurs</span>
                        </span>
                    </h2>
                    <p className={styles["subtitle-anime"]}>
                        La satisfaction de nos clients est notre plus belle récompense
                    </p>
                </div>

                <div className={styles["testimonials-grid"]}>
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={testimonial.id}
                            className={`${styles["testimonial-card"]} ${styles["anime-testimonial"]}`}
                            style={{ animationDelay: `${index * 0.2}s` }}>
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
                        </div>
                    ))}
                </div>
            </section>
            {/* Section Statistiques complètes */}
            < section className={styles["stats-section"]} >
                <div className={styles["stats-grid"]}>
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className={`${styles["stat-card"]} ${styles["anime-stat"]}`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className={styles["stat-icon-wrapper"]}>
                                <i className={stat.icon}></i>
                                <div className={styles["stat-glow"]}></div>
                            </div>
                            <div className={styles["stat-content"]}>
                                <span className={styles["stat-value"]}>{stat.value}</span>
                                <span className={styles["stat-label"]}>{stat.label}</span>
                            </div>
                            <div className={styles["stat-wave"]}></div>
                        </div>
                    ))}
                </div>
            </section >

            {/* CTA Section conditionnelle */}
            {
                !isLoggedIn ? (
                    <section className={styles["about-cta"]}>
                        <div className={styles["cta-content"]}>
                            <div className={styles["cta-animation"]}>
                                <div className={styles["cta-orbs"]}>
                                    <div className={styles["orb-1"]}></div>
                                    <div className={styles["orb-2"]}></div>
                                    <div className={styles["orb-3"]}></div>
                                </div>
                            </div>

                            <h2>Prêt à découvrir Madagascar avec nous ?</h2>
                            <p>Rejoignez notre communauté de voyageurs passionnés et vivez une expérience authentique</p>

                            <div className={styles["cta-buttons"]}>
                                <Link to="/register" className={`${styles["cta-button"]} ${styles["primary"]}`}>
                                    <i className="fas fa-rocket"></i>
                                    <span>S'inscrire gratuitement</span>
                                    <div className={styles["button-particles"]}></div>
                                </Link>
                                <Link to="/contact" className={`${styles["cta-button"]} ${styles["secondary"]}`}>
                                    <i className="fas fa-envelope"></i>
                                    <span>Nous contacter</span>
                                </Link>
                                <button className={`${styles["cta-button"]} ${styles["ai-cta"]}`} onClick={handleOpenAI}>
                                    <i className="fas fa-robot"></i>
                                    <span>Parler à l'IA</span>
                                </button>
                            </div>
                        </div>
                    </section>
                ) : (
                    <section className={styles["user-about-cta"]}>
                        <div className={styles["user-cta-content"]}>
                            <div className={styles["user-cta-animation"]}>
                                <div className={styles["user-cta-orbs"]}>
                                    <div className={styles["user-orb-1"]}></div>
                                    <div className={styles["user-orb-2"]}></div>
                                </div>
                            </div>

                            <h2>Merci de faire partie de l'aventure MadaTour !</h2>
                            <p>Continuez à explorer, partagez vos expériences et inspirez d'autres voyageurs</p>

                            <div className={styles["user-cta-buttons"]}>
                                <Link to="/dashboard" className={`${styles["user-cta-button"]} ${styles["primary"]}`}>
                                    <i className="fas fa-compass"></i>
                                    <span>Mon tableau de bord</span>
                                </Link>
                                <Link to="/reviews" className={`${styles["user-cta-button"]} ${styles["secondary"]}`}>
                                    <i className="fas fa-star"></i>
                                    <span>Laisser un avis</span>
                                </Link>
                                <Link to="/community" className={`${styles["user-cta-button"]} ${styles["tertiary"]}`}>
                                    <i className="fas fa-users"></i>
                                    <span>Communauté</span>
                                </Link>
                            </div>
                        </div>
                    </section>
                )
            }

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
                                Votre guide pour une découverte authentique et responsable de Madagascar.
                                Depuis 2025, passionnés par l'île rouge.
                            </p>

                            <div className={styles["social-links"]}>
                                {['facebook-f', 'instagram', 'twitter', 'youtube', 'linkedin'].map((platform) => (
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
                                    <i className="fas fa-info-circle"></i>
                                    À propos
                                </h3>
                                <ul>
                                    {['Notre histoire', 'Notre mission', 'Nos valeurs', 'L\'équipe', 'Carrières'].map((item) => (
                                        <li key={item}>
                                            <Link to={`/${item.toLowerCase().replace(' ', '-').replace('\'', '')}`}>
                                                <i className="fas fa-chevron-right"></i>
                                                {item}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className={styles["links-column"]}>
                                <h3>
                                    <i className="fas fa-handshake"></i>
                                    Engagement
                                </h3>
                                <ul>
                                    {['Tourisme durable', 'Communautés locales', 'Écovolontariat', 'Partenariats', 'Transparence'].map((item) => (
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
                                <i className="fas fa-newspaper"></i>
                                Notre newsletter
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
                            <span>Notre application :</span>
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
                    <i className="fas fa-info-circle"></i>
                    {!showChatbox && <span className={styles["notification-badge"]}>1</span>}
                </button>

                {showChatbox && (
                    <div className={styles["chatbox-window"]}>
                        <div className={styles["chatbox-header"]}>
                            <div className={styles["chatbox-header-content"]}>
                                <div className={styles["chatbox-avatar"]}>
                                    <i className="fas fa-info-circle"></i>
                                    <div className={styles["avatar-status"]}></div>
                                </div>
                                <div className={styles["chatbox-info"]}>
                                    <h3>Assistant À Propos</h3>
                                    <p>En ligne • Réponses sur MadaTour</p>
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
                                                    key={idx}
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
                                    placeholder="Posez-moi une question sur MadaTour..."
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
                aria-label="Retour en haut">
                <i className="fas fa-chevron-up"></i>
                <div className={styles["back-to-top-glow"]}></div>
            </button>
        </div>
    );
};

export default About;

