import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import styles from './cssR/RegionDetail.module.css';
import logos from '../images/logo-site4.png';
import { useAuth } from '../context/AuthContext';

const RegionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
            setShowBackToTop(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        navigate('/');
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className={styles["region-detail-container"]}>
            {/* Header amélioré avec animation */}
            <header className={`${styles["header"]} ${isScrolled ? styles.scrolled : ''} ${styles.animatedHeader}`}>
                <div className={styles["header-content"]}>
                    <div className={styles["logo-container"]}>
                        <Link to="/" className={styles["logo-link"]}>
                            <div className={styles["logo-animation"]}>
                                <img src={logos} alt="MadaTour Logo" className={styles["logo-img"]} />
                                <div className={styles["logo-glow"]}></div>
                            </div>
                            <span className={styles["logo-text"]}>
                                Mada<span className={styles["logo-accent"]}>Tour</span>
                            </span>
                        </Link>
                    </div>

                    <nav className={styles["nav"]}>
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
                    </nav>

                    <div className={styles["auth-section"]}>
                        {isLoggedIn ? (
                            <div className={styles["user-dropdown"]}>
                                <button className={styles["auth-button-on"]}>
                                    <i className="fas fa-user-circle"></i>
                                    <span>{user?.name || 'Mon compte'}</span>
                                    <i className="fas fa-chevron-down"></i>
                                </button>
                                <div className={styles["dropdown-menu"]}>
                                    <Link to="/dashboard" className={styles["dropdown-item"]}>
                                        <i className="fas fa-tachometer-alt"></i> Tableau de bord
                                    </Link>
                                    <Link to="/dashboard/favorites" className={styles["dropdown-item"]}>
                                        <i className="fas fa-heart"></i> Mes favoris
                                    </Link>
                                    <Link to="/my-trip" className={styles["dropdown-item"]}>
                                        <i className="fas fa-suitcase"></i> Mes voyages
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
                </div>
            </header>

            {/* Hero Section améliorée avec fond bleu/noir et étoiles */}
            <section className={`${styles["region-hero"]} ${styles["construction-hero"]}`}>
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
                            Région <span className={styles["text-highlight"]}>en développement</span>
                        </span>
                    </h1>
                    <p className={styles["hero-subtitle"]}>
                        La page détaillée pour la région <strong>ID: {id}</strong> est en cours de développement.
                    </p>
                    <p className={styles["hero-description"]}>
                        Revenez bientôt pour découvrir tous les détails de cette magnifique région !
                    </p>
                    <button
                        className={styles["back-button"]}
                        onClick={() => navigate('/regions')}
                    >
                        <i className="fas fa-arrow-left"></i>
                        <span>Retour aux régions</span>
                        <div className={styles["button-glow"]}></div>
                    </button>
                </div>
            </section>

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
                            <p className={styles["footer-description"]}>
                                Votre guide pour découvrir les merveilles de Madagascar.
                            </p>
                            <div className={styles["social-links"]}>
                                <a href="#" className={styles["social-link"]}><i className="fab fa-facebook-f"></i></a>
                                <a href="#" className={styles["social-link"]}><i className="fab fa-instagram"></i></a>
                                <a href="#" className={styles["social-link"]}><i className="fab fa-twitter"></i></a>
                                <a href="#" className={styles["social-link"]}><i className="fab fa-youtube"></i></a>
                            </div>
                        </div>

                        <div className={styles["footer-links"]}>
                            <div className={styles["links-column"]}>
                                <h4>Explorer</h4>
                                <ul>
                                    <li><Link to="/regions">Régions</Link></li>
                                    <li><Link to="/activities">Activités</Link></li>
                                    <li><Link to="/blog">Conseils</Link></li>
                                </ul>
                            </div>
                            <div className={styles["links-column"]}>
                                <h4>À propos</h4>
                                <ul>
                                    <li><Link to="/about">Qui sommes-nous</Link></li>
                                    <li><Link to="/contact">Contact</Link></li>
                                    <li><Link to="/privacy">Confidentialité</Link></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className={styles["footer-bottom"]}>
                        <p className={styles["copyright"]}>
                            <i className="fas fa-copyright"></i> {new Date().getFullYear()} MadaTour. Tous droits réservés.
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

export default RegionDetail;