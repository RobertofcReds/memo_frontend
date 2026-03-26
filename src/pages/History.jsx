import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import styles from './css/History.module.css';
import clsx from 'clsx';
import logos from '../images/logo-site4.png';
import { useNotification } from '../components/Notification/NotificationProvider';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/Loader';

// Données pour les animations de l'historique
const historyAnimations = {
    timeParticles: ['⏱️', '⏰', '⌛', '⏳', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕'],
    floatingElements: [
        { type: 'clock', emoji: '🕐', size: 'small' },
        { type: 'clock', emoji: '🕑', size: 'medium' },
        { type: 'clock', emoji: '🕒', size: 'large' },
        { type: 'calendar', emoji: '📅', size: 'small' },
        { type: 'calendar', emoji: '📆', size: 'medium' },
        { type: 'hourglass', emoji: '⏳', size: 'small' },
    ]
};

// Témoignages pour l'historique
const historyTestimonials = [
    {
        id: 1,
        name: 'Sophie M.',
        comment: "L'historique me permet de retrouver facilement mes recherches précédentes. C'est très pratique pour planifier mon voyage !",
        avatar: '👩',
        rating: 5,
        location: 'Paris, France',
        date: 'Janvier 2025'
    },
    {
        id: 2,
        name: 'Thomas L.',
        comment: "Je peux voir toutes mes activités en un coup d'œil. Les statistiques m'aident à comprendre mes habitudes de recherche.",
        avatar: '👨',
        rating: 4,
        location: 'Lyon, France',
        date: 'Décembre 2024'
    },
    {
        id: 3,
        name: 'Marie C.',
        comment: "Très utile pour retrouver un site que j'avais visité il y a quelques jours. L'interface est claire et intuitive.",
        avatar: '👩',
        rating: 5,
        location: 'Marseille, France',
        date: 'Novembre 2024'
    }
];

const History = () => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [removingId, setRemovingId] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [timeParticles, setTimeParticles] = useState([]);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
    const [historyStats, setHistoryStats] = useState({
        total: 0,
        search: 0,
        visit: 0,
        like: 0,
        unlike: 0,
        comment: 0,
        share: 0,
        trip: 0,
        today: 0
    });

    const navigate = useNavigate();
    const testimonialsRef = useRef(null);
    const autoScrollRef = useRef(null);

    // Utilisation du hook de notification
    const { showSuccess, showError, showInfo, showLoading } = useNotification();
    const {user} = useAuth();

    const token = localStorage.getItem('token');
    // const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
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

    // Fonction pour créer des particules de temps
    const createTimeParticle = () => {
        const emoji = historyAnimations.timeParticles[
            Math.floor(Math.random() * historyAnimations.timeParticles.length)
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
    const launchTimeParticles = (count = 5) => {
        const newParticles = [];
        for (let i = 0; i < count; i++) {
            newParticles.push(createTimeParticle());
        }
        setTimeParticles(prev => [...prev, ...newParticles]);

        // Nettoyer les particules après l'animation
        setTimeout(() => {
            setTimeParticles(prev => prev.slice(count));
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

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');

            if (!userId || !token) {
                console.error('Utilisateur non connecté');
                setIsLoading(false);
                return;
            }

            const response = await api.get(`/api/user/history/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('📜 Historique reçu:', response.data);
            setHistory(response.data);

            // Calculer les statistiques
            const today = new Date().toDateString();
            const stats = {
                total: response.data.length,
                search: response.data.filter(item => item.type === 'search').length,
                visit: response.data.filter(item => item.type === 'visit').length,
                like: response.data.filter(item => item.type === 'like').length,
                unlike: response.data.filter(item => item.type === 'unlike').length,
                comment: response.data.filter(item => item.type === 'comment').length,
                share: response.data.filter(item => item.type === 'share').length,
                trip: response.data.filter(item => item.type === 'add_to_trip' || item.type === 'remove_from_trip').length,
                today: response.data.filter(item => {
                    const itemDate = new Date(item.date_recherche).toDateString();
                    return itemDate === today;
                }).length
            };

            setHistoryStats(stats);
            setIsLoading(false);
        } catch (error) {
            console.error('❌ Erreur lors de la récupération de l\'historique:', error);
            setIsLoading(false);
            showError('Erreur lors du chargement de l\'historique');
        }
    };

    const clearHistory = async () => {
        showConfirmDialog(
            'Êtes-vous sûr de vouloir effacer tout l\'historique ? Cette action est irréversible.',
            async () => {
                const closeLoading = showLoading('Effacement de l\'historique en cours...');

                try {
                    const userId = localStorage.getItem('userId');
                    const token = localStorage.getItem('token');

                    await api.delete(`/api/user/history/${userId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    setHistory([]);
                    setHistoryStats({
                        total: 0,
                        search: 0,
                        visit: 0,
                        like: 0,
                        unlike: 0,
                        comment: 0,
                        share: 0,
                        trip: 0,
                        today: 0
                    });

                    console.log('✅ Historique effacé avec succès');
                    closeLoading();
                    showSuccess('Historique effacé avec succès !');
                    launchTimeParticles(3);
                } catch (error) {
                    console.error('❌ Erreur lors de l\'effacement de l\'historique:', error);
                    closeLoading();
                    showError('Erreur lors de l\'effacement de l\'historique');
                }
            },
            () => {
                console.log('Effacement annulé');
                showInfo('Effacement annulé');
            }
        );
    };

    const removeHistoryItem = async (itemId) => {
        showConfirmDialog(
            'Êtes-vous sûr de vouloir supprimer cet élément de l\'historique ?',
            async () => {
                setRemovingId(itemId);
                try {
                    const token = localStorage.getItem('token');

                    await api.delete(`/api/user/history/item/${itemId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    // Mettre à jour localement sans recharger
                    const updatedHistory = history.filter(item => item.id_historique !== itemId);
                    setHistory(updatedHistory);

                    // Mettre à jour les statistiques
                    const today = new Date().toDateString();
                    const stats = {
                        total: updatedHistory.length,
                        search: updatedHistory.filter(item => item.type === 'search').length,
                        visit: updatedHistory.filter(item => item.type === 'visit').length,
                        like: updatedHistory.filter(item => item.type === 'like').length,
                        unlike: updatedHistory.filter(item => item.type === 'unlike').length,
                        comment: updatedHistory.filter(item => item.type === 'comment').length,
                        share: updatedHistory.filter(item => item.type === 'share').length,
                        trip: updatedHistory.filter(item => item.type === 'add_to_trip' || item.type === 'remove_from_trip').length,
                        today: updatedHistory.filter(item => {
                            const itemDate = new Date(item.date_recherche).toDateString();
                            return itemDate === today;
                        }).length
                    };

                    setHistoryStats(stats);

                    console.log('✅ Élément supprimé avec succès');
                    showSuccess('Élément supprimé avec succès !');
                    launchTimeParticles(1);
                } catch (error) {
                    console.error('❌ Erreur lors de la suppression de l\'élément:', error);
                    showError('Erreur lors de la suppression de l\'élément');
                } finally {
                    setRemovingId(null);
                }
            },
            () => {
                console.log('Suppression annulée');
                showInfo('Suppression annulée');
            }
        );
    };

    const getBadgeClass = (type) => {
        switch (type) {
            case 'search':
                return styles["search"];
            case 'visit':
                return styles["visit"];
            case 'like':
            case 'unlike':
                return styles["like"];
            case 'comment':
                return styles["comment"];
            case 'share':
                return styles["share"];
            case 'add_to_trip':
            case 'remove_from_trip':
                return styles["trip"];
            default:
                return styles["search"];
        }
    };

    const getBadgeText = (type) => {
        switch (type) {
            case 'search':
                return 'Recherche';
            case 'visit':
                return 'Visite';
            case 'like':
                return 'Like';
            case 'unlike':
                return 'Unlike';
            case 'comment':
                return 'Avis';
            case 'share':
                return 'Partage';
            case 'add_to_trip':
                return 'Voyage +';
            case 'remove_from_trip':
                return 'Voyage -';
            default:
                return type;
        }
    };

    const getIconForType = (type) => {
        switch (type) {
            case 'search':
                return 'fas fa-search';
            case 'visit':
                return 'fas fa-eye';
            case 'like':
                return 'fas fa-heart';
            case 'unlike':
                return 'far fa-heart';
            case 'comment':
                return 'fas fa-comment';
            case 'share':
                return 'fas fa-share-alt';
            case 'add_to_trip':
                return 'fas fa-plus-circle';
            case 'remove_from_trip':
                return 'fas fa-minus-circle';
            default:
                return 'fas fa-history';
        }
    };

    const getActionButton = (type) => {
        switch (type) {
            case 'search':
                return (
                    <Link to="/search" className={styles["search-again-btn"]}>
                        <i className="fas fa-redo"></i> Rechercher à nouveau
                        <div className={styles["btn-glow"]}></div>
                    </Link>
                );
            case 'visit':
                return (
                    <Link to="/search" className={styles["visit-site-btn"]}>
                        <i className="fas fa-eye"></i> Voir d'autres sites
                        <div className={styles["btn-glow"]}></div>
                    </Link>
                );
            case 'like':
            case 'unlike':
            case 'comment':
            case 'share':
                return (
                    <Link to="/favorites" className={styles["view-favorites-btn"]}>
                        <i className="fas fa-star"></i> Voir mes favoris
                        <div className={styles["btn-glow"]}></div>
                    </Link>
                );
            case 'add_to_trip':
            case 'remove_from_trip':
                return (
                    <Link to="/my-trip" className={styles["view-trip-btn"]}>
                        <i className="fas fa-suitcase"></i> Voir mon voyage
                        <div className={styles["btn-glow"]}></div>
                    </Link>
                );
            default:
                return null;
        }
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

    const filteredHistory = filter === 'all'
        ? history
        : history.filter(item => item.type === filter);

    // Trier l'historique par date (plus récent d'abord)
    const sortedHistory = [...filteredHistory].sort((a, b) =>
        new Date(b.date_recherche) - new Date(a.date_recherche)
    );

    if (isLoading) {
        return (
            <Loader />
        );
    }

    return (
        <div className={styles["history-page"]}>
            {/* Particules de temps animées */}
            {timeParticles.map(particle => (
                <div
                    key={particle.id}
                    className={styles["time-particle"]}
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
                        <Link to="/history" className={`${styles["nav-link"]} ${styles.active}`}>
                            <i className="fas fa-history"></i>
                            Historique
                        </Link>
                        <Link to="/blog" className={styles["nav-link"]}>
                            <i className="fas fa-book-open"></i>
                            Conseils
                        </Link>
                    </div>

                    <div className={styles["auth-section"]}>
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
                                    <div className={styles["dropdown-divider"]}></div>
                                    <button
                                        onClick={() => {
                                            localStorage.removeItem('token');
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
            <main className={styles["history-main"]}>
                {/* Hero Section spéciale pour l'historique */}
                <section className={styles["history-hero"]}>
                    <div className={styles["hero-overlay"]}></div>
                    <div className={styles["hero-slides"]}>
                        <div className={styles["hero-slide"]} style={{
                            backgroundImage: `url('https://images.unsplash.com/photo-1566438480900-0609be27a4be?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')`
                        }}></div>
                        <div className={styles["hero-slide"]} style={{
                            backgroundImage: `url('https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')`
                        }}></div>
                        <div className={styles["hero-slide"]} style={{
                            backgroundImage: `url('https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`
                        }}></div>
                    </div>

                    <div className={styles["hero-content"]}>
                        <h1 className={styles["anime-text"]}>
                            <span className={styles["text-gradient"]}>
                                Mon <span className={styles["text-highlight"]}>Historique</span>
                            </span>
                        </h1>

                        <p className={styles["hero-subtitle"]}>
                            Retracez toutes vos activités et retrouvez vos explorations
                        </p>

                        <div className={styles["hero-stats"]}>
                            {[
                                { icon: 'fas fa-history', label: 'Total activités', value: historyStats.total },
                                { icon: 'fas fa-search', label: 'Recherches', value: historyStats.search },
                                { icon: 'fas fa-eye', label: 'Visites', value: historyStats.visit },
                                { icon: 'fas fa-calendar-day', label: "Aujourd'hui", value: historyStats.today },
                                { icon: 'fas fa-heart', label: 'Favoris', value: historyStats.like + historyStats.unlike },
                                { icon: 'fas fa-comment', label: 'Avis', value: historyStats.comment },
                                { icon: 'fas fa-share-alt', label: 'Partages', value: historyStats.share },
                                { icon: 'fas fa-suitcase', label: 'Voyage', value: historyStats.trip }
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

                    {/* Floating elements spéciaux pour l'historique */}
                    <div className={styles["floating-elements"]}>
                        {historyAnimations.floatingElements.map((element, index) => (
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

                <section className={`${styles["history-content"]} ${styles["anime-section"]}`}>
                    <div className={styles["history-header"]}>
                        <div className={styles["history-controls"]}>
                            <div className={styles["filter-controls"]}>
                                <div className={styles["filter-icon-wrapper"]}>
                                    <i className="fas fa-filter"></i>
                                    <div className={styles["icon-glow"]}></div>
                                </div>
                                <label className={styles["filter-label"]}>
                                    Filtrer par type :
                                </label>
                                <select
                                    className={styles["filter-select"]}
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                >
                                    <option value="all">Toutes les actions</option>
                                    <option value="search">Recherches</option>
                                    <option value="visit">Visites</option>
                                    <option value="like">Likes</option>
                                    <option value="comment">Avis</option>
                                    <option value="share">Partages</option>
                                    <option value="add_to_trip">Voyage</option>
                                </select>
                            </div>
                            <div className={styles["history-count"]}>
                                <span className={styles["count-badge"]}>
                                    <i className="fas fa-list"></i> {sortedHistory.length} activités
                                </span>
                            </div>
                        </div>

                        <div className={styles["history-actions"]}>
                            <button
                                className={styles["clear-history-btn"]}
                                onClick={clearHistory}
                                disabled={history.length === 0}
                            >
                                <i className="fas fa-trash"></i>
                                <span>Effacer tout l'historique</span>
                                <div className={styles["btn-glow"]}></div>
                            </button>
                            <Link to="/search" className={styles["explore-history-btn"]}>
                                <i className="fas fa-plus-circle"></i>
                                <span>Nouvelle recherche</span>
                            </Link>
                        </div>
                    </div>

                    <div className={styles["history-list-container"]}>
                        {sortedHistory.length > 0 ? (
                            <div className={styles["history-grid"]}>
                                {sortedHistory.map((item, index) => (
                                    <div
                                        key={item.id_historique}
                                        className={`${styles["history-card"]} ${styles["anime-card"]}`}
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                        onMouseEnter={() => launchTimeParticles(1)}
                                    >
                                        <div className={styles["card-header"]}>
                                            <span className={clsx(
                                                styles["action-badge"],
                                                getBadgeClass(item.type)
                                            )}>
                                                <div className={styles["badge-icon-wrapper"]}>
                                                    <i className={getIconForType(item.type)}></i>
                                                    <div className={styles["badge-glow"]}></div>
                                                </div>
                                                <span className={styles["badge-text"]}>
                                                    {getBadgeText(item.type)}
                                                </span>
                                            </span>
                                            <div className={styles["time-info"]}>
                                                <div className={styles["date-info"]}>
                                                    <i className="far fa-calendar"></i>
                                                    <span>{new Date(item.date_recherche).toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}</span>
                                                </div>
                                                <div className={styles["time-info"]}>
                                                    <i className="far fa-clock"></i>
                                                    <span>{new Date(item.date_recherche).toLocaleTimeString('fr-FR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}</span>
                                                </div>
                                            </div>
                                            <button
                                                className={styles["remove-history-item"]}
                                                onClick={() => removeHistoryItem(item.id_historique)}
                                                disabled={removingId === item.id_historique}
                                                aria-label="Supprimer cet élément"
                                            >
                                                {removingId === item.id_historique
                                                    ? <i className="fas fa-spinner fa-spin"></i>
                                                    : <i className="fas fa-times"></i>}
                                            </button>
                                        </div>

                                        <div className={styles["card-content"]}>
                                            <div className={styles["history-details"]}>
                                                <div className={styles["details-header"]}>
                                                    <h3>
                                                        <i className="fas fa-info-circle"></i>
                                                        Détails de l'action
                                                    </h3>
                                                    <span className={styles["time-ago"]}>
                                                        {(() => {
                                                            const now = new Date();
                                                            const itemDate = new Date(item.date_recherche);
                                                            const diffMs = now - itemDate;
                                                            const diffMins = Math.floor(diffMs / 60000);
                                                            const diffHours = Math.floor(diffMs / 3600000);
                                                            const diffDays = Math.floor(diffMs / 86400000);

                                                            if (diffMins < 1) return 'À l\'instant';
                                                            if (diffMins < 60) return `Il y a ${diffMins} min`;
                                                            if (diffHours < 24) return `Il y a ${diffHours} h`;
                                                            if (diffDays < 7) return `Il y a ${diffDays} j`;
                                                            return `Il y a ${Math.floor(diffDays / 7)} sem`;
                                                        })()}
                                                    </span>
                                                </div>

                                                <div className={styles["details-grid"]}>
                                                    <div className={styles["detail-card"]}>
                                                        <div className={styles["detail-header"]}>
                                                            <i className="fas fa-list"></i>
                                                            <h4>Critères</h4>
                                                        </div>
                                                        <p className={styles["detail-content"]}>
                                                            {item.criteres || 'Aucun critère spécifié'}
                                                        </p>
                                                    </div>

                                                    <div className={styles["detail-card"]}>
                                                        <div className={styles["detail-header"]}>
                                                            <i className="fas fa-check-circle"></i>
                                                            <h4>Résultat</h4>
                                                        </div>
                                                        <p className={styles["detail-content"]}>
                                                            {item.resultats || 'Action effectuée avec succès'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={styles["card-actions"]}>
                                                {getActionButton(item.type)}
                                            </div>
                                        </div>

                                        <div className={styles["card-glow"]}></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles["no-history"]}>
                                <div className={styles["empty-state"]}>
                                    <i className="far fa-clock"></i>
                                    <h3>Aucune activité enregistrée</h3>
                                    <p>Votre historique d'activités sur MadaTour apparaîtra ici</p>
                                    <p className={styles["empty-state-subtitle"]}>
                                        Commencez à explorer pour remplir votre historique !
                                    </p>
                                    <div className={styles["action-buttons"]}>
                                        <Link to="/search" className={styles["explore-btn"]}>
                                            <i className="fas fa-search"></i>
                                            Explorer les sites
                                        </Link>
                                        <Link to="/regions" className={styles["explore-btn-secondary"]}>
                                            <i className="fas fa-globe-africa"></i>
                                            Découvrir les régions
                                        </Link>
                                        <Link to="/activities" className={styles["explore-btn-accent"]}>
                                            <i className="fas fa-hiking"></i>
                                            Voir les activités
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION TÉMOIGNAGES AMÉLIORÉE POUR L'HISTORIQUE */}
                    <section className={`${styles["history-testimonials"]} ${styles["anime-section"]}`}>
                        <div className={styles["section-header"]}>
                            <h2>
                                <span className={styles["title-anime"]}>
                                    Ce que disent nos <span className={styles["title-accent"]}>explorateurs</span>
                                </span>
                            </h2>
                            <p className={styles["subtitle-anime"]}>
                                Découvrez comment l'historique aide nos utilisateurs dans leurs voyages
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
                                {historyTestimonials.map((testimonial, index) => (
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
                            {historyTestimonials.slice(0, Math.ceil(historyTestimonials.length / 3)).map((_, index) => (
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
                                Gardez une trace de toutes vos explorations. Votre historique, votre mémoire de voyage.
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
                                    <i className="fas fa-history"></i>
                                    Historique
                                </h3>
                                <ul>
                                    {['Mes activités', 'Recherches', 'Visites', 'Favoris', 'Statistiques'].map((item) => (
                                        <li key={item}>
                                            <Link to={`/history?filter=${item.toLowerCase().replace(' ', '-')}`}>
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
                                    {['Tableau de bord', 'Profil', 'Mon voyage', 'Avis', 'Paramètres'].map((item) => (
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
                                    {['FAQ historique', 'Contact', 'Confidentialité', 'Conditions'].map((item) => (
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
                                Infos historique
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
                                Fait avec <i className="fas fa-history"></i> pour les voyageurs
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

                {/* Animation footer spéciale historique */}
                <div className={styles["footer-wave"]}></div>
                <div className={styles["footer-clocks"]}>
                    {[...Array(15)].map((_, i) => (
                        <div
                            key={i}
                            className={styles["clock"]}
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 5}s`,
                                fontSize: `${Math.random() * 10 + 10}px`
                            }}
                        >
                            {['🕐', '🕑', '🕒', '🕓', '🕔', '🕕'][Math.floor(Math.random() * 6)]}
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

export default History;