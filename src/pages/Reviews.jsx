import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import styles from './css/Reviews.module.css';
import clsx from 'clsx';
import logos from '../images/logo-site4.png';
import axios from 'axios';
import { useNotification } from '../components/Notification/NotificationProvider';
import { useAuth } from '../context/AuthContext';

// Données pour les animations des avis
const reviewAnimations = {
    starParticles: ['⭐', '🌟', '✨', '💫', '☄️', '⚡', '🔥', '🎯', '🏆', '💎'],
    floatingElements: [
        { type: 'star', emoji: '⭐', size: 'small' },
        { type: 'star', emoji: '🌟', size: 'medium' },
        { type: 'star', emoji: '💫', size: 'large' },
        { type: 'trophy', emoji: '🏆', size: 'small' },
        { type: 'trophy', emoji: '💎', size: 'medium' },
        { type: 'sparkle', emoji: '✨', size: 'small' },
    ]
};

// Témoignages pour les avis
const reviewsTestimonials = [
    {
        id: 1,
        name: 'Thomas L.',
        comment: "J'adore partager mes expériences de voyage ! La section avis me permet de garder une trace de tous les sites visités.",
        avatar: '👨',
        rating: 5,
        location: 'Lyon, France',
        date: 'Janvier 2025'
    },
    {
        id: 2,
        name: 'Claire B.',
        comment: "La gestion des avis est très intuitive. Je peux facilement retrouver mes commentaires et les modifier si besoin.",
        avatar: '👩',
        rating: 4,
        location: 'Bordeaux, France',
        date: 'Décembre 2024'
    },
    {
        id: 3,
        name: 'Marc D.',
        comment: "Les statistiques de mes avis sont très utiles pour suivre mon activité. C'est motivant de voir l'impact de mes partages !",
        avatar: '👨',
        rating: 5,
        location: 'Paris, France',
        date: 'Novembre 2024'
    }
];

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [sortBy, setSortBy] = useState('date');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [starParticles, setStarParticles] = useState([]);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
    const [reviewsStats, setReviewsStats] = useState({
        total: 0,
        averageRating: 0,
        totalCharacters: 0,
        helpfulReviews: 0
    });

    const navigate = useNavigate();
    const testimonialsRef = useRef(null);
    const autoScrollRef = useRef(null);

    // Utilisation du hook de notification
    const { showSuccess, showError, showInfo, showLoading } = useNotification();
    const {user} = useAuth();

    const token = localStorage.getItem('token');
    const userId = user.id || localStorage.getItem('userId') || localStorage.getItem('user_id');

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

    // Fonction pour créer des particules d'étoiles
    const createStarParticle = () => {
        const emoji = reviewAnimations.starParticles[
            Math.floor(Math.random() * reviewAnimations.starParticles.length)
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
    const launchStarParticles = (count = 5) => {
        const newParticles = [];
        for (let i = 0; i < count; i++) {
            newParticles.push(createStarParticle());
        }
        setStarParticles(prev => [...prev, ...newParticles]);

        // Nettoyer les particules après l'animation
        setTimeout(() => {
            setStarParticles(prev => prev.slice(count));
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

    const fetchReviews = async () => {
        try {
            const token = localStorage.getItem('token');

            if (!userId || !token) {
                console.error('Utilisateur non connecté');
                setIsLoading(false);
                return;
            }

            console.log('🔍 Récupération des avis pour userId:', userId);

            const response = await api.get(`/api/user/reviews/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('📝 Avis reçus:', response.data);
            setReviews(response.data);

            // Calculer les statistiques
            const totalReviews = response.data.length;
            const averageRating = totalReviews > 0
                ? (response.data.reduce((acc, review) => acc + (review.note || 0), 0) / totalReviews).toFixed(1)
                : '0.0';
            const totalCharacters = response.data.reduce((acc, review) => acc + (review.commentaire?.length || 0), 0);
            const helpfulReviews = response.data.filter(review => review.note >= 4).length;

            setReviewsStats({
                total: totalReviews,
                averageRating: parseFloat(averageRating),
                totalCharacters,
                helpfulReviews
            });

            setIsLoading(false);
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des avis:', error);
            setIsLoading(false);
            showError('Erreur lors du chargement des avis');
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const deleteReview = async (reviewId) => {
        showConfirmDialog(
            'Êtes-vous sûr de vouloir supprimer cet avis ? Cette action est irréversible.',
            async () => {
                const closeLoading = showLoading('Suppression de l\'avis en cours...');

                try {
                    setDeletingId(reviewId);
                    const token = localStorage.getItem('token');

                    await api.delete(`/api/user/review/${reviewId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    // Mettre à jour localement sans recharger
                    const updatedReviews = reviews.filter(review => review.id_avis !== reviewId);
                    setReviews(updatedReviews);

                    // Mettre à jour les statistiques
                    const totalReviews = updatedReviews.length;
                    const averageRating = totalReviews > 0
                        ? (updatedReviews.reduce((acc, review) => acc + (review.note || 0), 0) / totalReviews).toFixed(1)
                        : '0.0';
                    const totalCharacters = updatedReviews.reduce((acc, review) => acc + (review.commentaire?.length || 0), 0);
                    const helpfulReviews = updatedReviews.filter(review => review.note >= 4).length;

                    setReviewsStats({
                        total: totalReviews,
                        averageRating: parseFloat(averageRating),
                        totalCharacters,
                        helpfulReviews
                    });

                    console.log('✅ Avis supprimé avec succès');
                    closeLoading();
                    showSuccess('Avis supprimé avec succès !');
                    launchStarParticles(3);
                } catch (error) {
                    console.error('❌ Erreur lors de la suppression de l\'avis:', error);
                    closeLoading();
                    showError('Erreur lors de la suppression de l\'avis');
                } finally {
                    setDeletingId(null);
                }
            },
            () => {
                console.log('Suppression annulée');
                showInfo('Suppression annulée');
            }
        );
    };

    // Fonction de tri
    const getSortedReviews = () => {
        const sorted = [...reviews];

        switch (sortBy) {
            case 'date':
                return sorted.sort((a, b) => new Date(b.date_avis) - new Date(a.date_avis));
            case 'rating':
                return sorted.sort((a, b) => (b.note || 0) - (a.note || 0));
            case 'site':
                return sorted.sort((a, b) => a.site_nom?.localeCompare(b.site_nom || ''));
            case 'length':
                return sorted.sort((a, b) => (b.commentaire?.length || 0) - (a.commentaire?.length || 0));
            default:
                return sorted;
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

    const sortedReviews = getSortedReviews();

    if (isLoading) {
        return (
            <div className={styles["loading-container"]}>
                <div className={styles["loading-spinner"]}></div>
                <p>Chargement de vos avis...</p>
            </div>
        );
    }

    return (
        <div className={styles["reviews-page"]}>
            {/* Particules d'étoiles animées */}
            {starParticles.map(particle => (
                <div
                    key={particle.id}
                    className={styles["star-particle"]}
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
                        <Link to="/regions" className={styles["nav-link"]}>
                            <i className="fas fa-map-marked-alt"></i>
                            Destinations
                        </Link>
                        <Link to="/search" className={styles["nav-link"]}>
                            <i className="fas fa-search"></i>
                            Sites
                        </Link>
                        <Link to="/activities" className={styles["nav-link"]}>
                            <i className="fas fa-hiking"></i>
                            Activités
                        </Link>
                        <Link to="/reviews" className={`${styles["nav-link"]} ${styles.active}`}>
                            <i className="fas fa-star"></i>
                            Avis
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
            <main className={styles["reviews-main"]}>
                {/* Hero Section spéciale pour les avis */}
                <section className={styles["reviews-hero"]}>
                    <div className={styles["hero-overlay"]}></div>
                    <div className={styles["hero-slides"]}>
                        <div className={styles["hero-slide"]} style={{
                            backgroundImage: `url('https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')`
                        }}></div>
                        <div className={styles["hero-slide"]} style={{
                            backgroundImage: `url('https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`
                        }}></div>
                        <div className={styles["hero-slide"]} style={{
                            backgroundImage: `url('https://images.unsplash.com/photo-1566438480900-0609be27a4be?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')`
                        }}></div>
                    </div>

                    <div className={styles["hero-content"]}>
                        <h1 className={styles["anime-text"]}>
                            <span className={styles["text-gradient"]}>
                                Mes <span className={styles["text-highlight"]}>Avis</span>
                            </span>
                        </h1>

                        <p className={styles["hero-subtitle"]}>
                            Partagez vos expériences et inspirez d'autres voyageurs
                        </p>

                        <div className={styles["hero-stats"]}>
                            {[
                                { icon: 'fas fa-comments', label: 'Avis publiés', value: reviewsStats.total },
                                { icon: 'fas fa-star', label: 'Note moyenne', value: reviewsStats.averageRating },
                                { icon: 'fas fa-keyboard', label: 'Caractères', value: reviewsStats.totalCharacters },
                                { icon: 'fas fa-thumbs-up', label: 'Avis utiles', value: reviewsStats.helpfulReviews }
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

                    {/* Floating elements spéciaux pour les avis */}
                    <div className={styles["floating-elements"]}>
                        {reviewAnimations.floatingElements.map((element, index) => (
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

                <section className={`${styles["reviews-content"]} ${styles["anime-section"]}`}>
                    <div className={styles["reviews-header"]}>
                        <div className={styles["reviews-controls"]}>
                            <div className={styles["sort-controls"]}>
                                <div className={styles["sort-icon-wrapper"]}>
                                    <i className="fas fa-sort-amount-down"></i>
                                    <div className={styles["icon-glow"]}></div>
                                </div>
                                <label htmlFor="sort-select" className={styles["sort-label"]}>
                                    Trier par :
                                </label>
                                <select
                                    id="sort-select"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className={styles["sort-select"]}
                                >
                                    <option value="date">Date (plus récent)</option>
                                    <option value="rating">Note (plus haute)</option>
                                    <option value="site">Site (A-Z)</option>
                                    <option value="length">Longueur</option>
                                </select>
                            </div>
                            <div className={styles["reviews-count"]}>
                                <span className={styles["count-badge"]}>
                                    <i className="fas fa-list"></i> {sortedReviews.length} avis
                                </span>
                            </div>
                        </div>

                        <div className={styles["add-review-section"]}>
                            <Link to="/search" className={styles["add-review-btn"]}>
                                <i className="fas fa-plus-circle"></i>
                                <span>Ajouter un avis</span>
                                <div className={styles["btn-glow"]}></div>
                            </Link>
                        </div>
                    </div>

                    <div className={styles["reviews-list-container"]}>
                        {sortedReviews.length > 0 ? (
                            <div className={styles["reviews-grid"]}>
                                {sortedReviews.map((review, index) => (
                                    <div
                                        key={review.id_avis}
                                        className={`${styles["review-card"]} ${styles["anime-card"]}`}
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                        onMouseEnter={() => launchStarParticles(1)}
                                    >
                                        <div className={styles["card-image"]}>
                                            <img
                                                src={`${process.env.REACT_APP_BACK_URL}${review.image}`}
                                                alt={review.site_nom || 'Site sans nom'}
                                                onError={(e) => {
                                                    e.target.src = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80';
                                                }}
                                                loading="lazy"
                                            />
                                            <div className={styles["card-badge-reviews"]}>
                                                <span className={styles["review-status"]}>
                                                    <i className="fas fa-check-circle"></i> Publié
                                                </span>
                                            </div>
                                            <div className={styles["review-rating-overlay"]}>
                                                <div className={styles["rating-stars"]}>
                                                    {[...Array(5)].map((_, i) => (
                                                        <i
                                                            key={i}
                                                            className={`fas fa-star ${i < (review.note || 0) ? styles["star-filled"] : styles["star-empty"]}`}
                                                        ></i>
                                                    ))}
                                                </div>
                                                <span className={styles["rating-value"]}>{review.note || 0}/5</span>
                                            </div>
                                            <div className={styles["card-glow"]}></div>
                                        </div>

                                        <div className={styles["card-content"]}>
                                            <div className={styles["review-header"]}>
                                                <h3>
                                                    <i className="fas fa-map-marker-alt"></i>
                                                    {review.site_nom || 'Site inconnu'}
                                                </h3>
                                                <div className={styles["review-date"]}>
                                                    <i className="fas fa-calendar-alt"></i>
                                                    {review.date_avis
                                                        ? new Date(review.date_avis).toLocaleDateString('fr-FR', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })
                                                        : 'Date non spécifiée'}
                                                </div>
                                            </div>

                                            <div className={styles["review-meta"]}>
                                                <div className={styles["review-source"]}>
                                                    <i className="fas fa-tag"></i>
                                                    <span>Source: {review.source || 'Site web'}</span>
                                                </div>
                                                <div className={styles["comment-length"]}>
                                                    <i className="fas fa-keyboard"></i>
                                                    <span>{review.commentaire?.length || 0} caractères</span>
                                                </div>
                                            </div>

                                            <div className={styles["review-comment"]}>
                                                <div className={styles["comment-header"]}>
                                                    <i className="fas fa-comment-dots"></i>
                                                    <span>Votre commentaire</span>
                                                </div>
                                                <p className={styles["comment-text"]}>
                                                    {review.commentaire || 'Aucun commentaire'}
                                                </p>
                                            </div>

                                            <div className={styles["review-actions"]}>
                                                <button
                                                    className={styles["delete-button"]}
                                                    onClick={() => deleteReview(review.id_avis)}
                                                    disabled={deletingId === review.id_avis}
                                                    title="Supprimer cet avis"
                                                >
                                                    {deletingId === review.id_avis ? (
                                                        <i className="fas fa-spinner fa-spin"></i>
                                                    ) : (
                                                        <i className="fas fa-trash"></i>
                                                    )}
                                                    <span>Supprimer</span>
                                                </button>
                                                {review.id_site && (
                                                    <Link
                                                        to={`/site/${review.id_site}`}
                                                        className={styles["view-button"]}
                                                        title="Voir le site"
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                        <span>Voir le site</span>
                                                        <div className={styles["btn-glow"]}></div>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles["no-reviews"]}>
                                <div className={styles["empty-state"]}>
                                    <i className="far fa-star"></i>
                                    <h3>Aucun avis publié</h3>
                                    <p>Vous n'avez pas encore partagé d'avis sur nos sites touristiques.</p>
                                    <p className={styles["empty-state-subtitle"]}>
                                        Partagez votre expérience pour aider d'autres voyageurs !
                                    </p>
                                    <div className={styles["action-buttons"]}>
                                        <Link to="/search" className={styles["explore-btn"]}>
                                            <i className="fas fa-search"></i>
                                            Explorer les sites
                                        </Link>
                                        <Link to="/dashboard" className={styles["explore-btn-secondary"]}>
                                            <i className="fas fa-tachometer-alt"></i>
                                            Tableau de bord
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION TÉMOIGNAGES AMÉLIORÉE POUR LES AVIS */}
                    <section className={`${styles["reviews-testimonials"]} ${styles["anime-section"]}`}>
                        <div className={styles["section-header"]}>
                            <h2>
                                <span className={styles["title-anime"]}>
                                    Ceux que disent nos <span className={styles["title-accent"]}>voyageurs</span>
                                </span>
                            </h2>
                            <p className={styles["subtitle-anime"]}>
                                Découvrez comment nos utilisateurs partagent leurs expériences
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
                                {reviewsTestimonials.map((testimonial, index) => (
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
                            {reviewsTestimonials.slice(0, Math.ceil(reviewsTestimonials.length / 3)).map((_, index) => (
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
                                Partagez vos expériences et aidez d'autres voyageurs à découvrir les merveilles de Madagascar.
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
                                    <i className="fas fa-star"></i>
                                    Avis
                                </h3>
                                <ul>
                                    {['Mes avis', 'Ajouter un avis', 'Avis récents', 'Modifier', 'Statistiques'].map((item) => (
                                        <li key={item}>
                                            <Link to={`/reviews?filter=${item.toLowerCase().replace(' ', '-')}`}>
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
                                    {['Tableau de bord', 'Profil', 'Mon voyage', 'Favoris', 'Paramètres'].map((item) => (
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
                                    {['FAQ avis', 'Contact', 'Confidentialité', 'Conditions'].map((item) => (
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
                                Infos avis
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
                                Fait avec <i className="fas fa-star"></i> pour les voyageurs
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

                {/* Animation footer spéciale avis */}
                <div className={styles["footer-wave"]}></div>
                <div className={styles["footer-stars"]}>
                    {[...Array(15)].map((_, i) => (
                        <div
                            key={i}
                            className={styles["star"]}
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 5}s`,
                                fontSize: `${Math.random() * 10 + 10}px`
                            }}
                        >
                            {['⭐', '🌟', '✨', '💫'][Math.floor(Math.random() * 4)]}
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

export default Reviews;