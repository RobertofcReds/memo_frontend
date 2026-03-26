import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import clsx from 'clsx';
import styles from './css/Preferences.module.css';
import logos from '../images/logo-site4.png';
import { convertCurrency, getMultipleRates } from '../utils/currencyService';
import { useNotification } from '../components/Notification/NotificationProvider';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/Loader';

const Preferences = () => {
    const [preferences, setPreferences] = useState({
        type_site: '',
        budget_max: 300,
        id_region: '',
        periode_preferee: ''
    });

    const [regions, setRegions] = useState([]);
    const [siteTypes, setSiteTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currency, setCurrency] = useState('EUR');
    const [exchangeRates, setExchangeRates] = useState({});
    const [isConverting, setIsConverting] = useState(false);
    const [animeTheme] = useState('default');
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [activeTab, setActiveTab] = useState('preferences');
    const {user, logout} = useAuth();

    const navigate = useNavigate();
    const budgetSliderRef = useRef(null);
    const formRef = useRef(null);

    // Utilisation du hook de notification
    const { showSuccess, showError } = useNotification();

    const [budgetSteps, setBudgetSteps] = useState([
        { label: 'Économique', value: 50, icon: 'fa-coins', description: 'Voyage basique', color: '#48bb78' },
        { label: 'Modeste', value: 150, icon: 'fa-wallet', description: 'Bon rapport qualité/prix', color: '#4299e1' },
        { label: 'Confort', value: 300, icon: 'fa-couch', description: 'Confort optimal', color: '#9f7aea' },
        { label: 'Premium', value: 500, icon: 'fa-gem', description: 'Expérience luxueuse', color: '#ed8936' },
        { label: 'Luxe', value: 1000, icon: 'fa-crown', description: 'Prestige absolu', color: '#f56565' }
    ]);

    // Données de conseils enrichies
    const tipsData = {
        preferences: [
            {
                id: 1,
                icon: 'fa-heart',
                title: 'Centres d\'intérêt',
                description: 'Sélectionnez vos types de sites préférés pour des recommandations ultra-personnalisées.',
                details: ['Précisez vos passions', 'Recevez des suggestions pertinentes', 'Découvrez des sites adaptés']
            },
            {
                id: 2,
                icon: 'fa-chart-line',
                title: 'Budget intelligent',
                description: 'Définissez un budget réaliste pour obtenir des propositions adaptées à vos moyens.',
                details: ['Estimation précise des coûts', 'Optimisation de vos dépenses', 'Rapport qualité/prix optimal']
            },
            {
                id: 3,
                icon: 'fa-map-marked-alt',
                title: 'Localisation optimale',
                description: 'Précisez vos régions favorites pour découvrir des trésors près de chez vous.',
                details: ['Découverte locale', 'Temps de trajet réduit', 'Exploration approfondie']
            },
            {
                id: 4,
                icon: 'fa-calendar-check',
                title: 'Période idéale',
                description: 'Sélectionnez vos dates pour des conseils météo et saisonniers pertinents.',
                details: ['Météo favorable', 'Événements spéciaux', 'Affluence réduite']
            }
        ],
        budget: [
            {
                range: 'Économique (50-150€)',
                description: 'Hébergement basique, repas locaux, transports publics',
                icon: 'fa-hiking'
            },
            {
                range: 'Confort (150-400€)',
                description: 'Hôtels confortables, restaurants variés, activités guidées',
                icon: 'fa-umbrella-beach'
            },
            {
                range: 'Premium (400-700€)',
                description: 'Hébergement premium, expériences exclusives, transports privés',
                icon: 'fa-concierge-bell'
            },
            {
                range: 'Luxe (700€+)',
                description: 'Villas privées, chefs personnels, excursions sur mesure',
                icon: 'fa-crown'
            }
        ]
    };

    const seasonData = [
        {
            period: 'Juillet-Août',
            name: 'Saison sèche',
            description: 'Idéal pour les randonnées et les plages',
            icon: 'fa-sun',
            color: '#f6ad55'
        },
        {
            period: 'Avril-Juin',
            name: 'Températures douces',
            description: 'Parfait pour l\'exploration culturelle',
            icon: 'fa-cloud-sun',
            color: '#68d391'
        },
        {
            period: 'Septembre-Novembre',
            name: 'Floraison',
            description: 'Magnifiques paysages et observation faune',
            icon: 'fa-seedling',
            color: '#9f7aea'
        },
        {
            period: 'Décembre-Mars',
            name: 'Saison des pluies',
            description: 'Tarifs avantageux et verdure luxuriante',
            icon: 'fa-cloud-rain',
            color: '#4299e1'
        }
    ];

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userId = user.id;
                console.log(userId)
                const token = localStorage.getItem('token');

                if (!userId || !token) {
                    navigate('/login');
                    return;
                }

                const [prefResponse, regionsResponse, typesResponse] = await Promise.all([
                    api.get(`/api/user/preferences/${userId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    api.get('/api/user/regions/', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    api.get('/api/type/', {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                const userPreferences = prefResponse.data || {
                    type_site: '',
                    budget_max: 300,
                    id_region: '',
                    periode_preferee: ''
                };

                setRegions(regionsResponse.data || []);
                setSiteTypes(typesResponse.data || []);

                // Détecter et configurer la devise
                await setupCurrency(userPreferences.budget_max);

                // Mettre à jour les préférences avec le budget converti
                setPreferences(userPreferences);

            } catch (error) {
                console.error('Erreur:', error);
                showError('Erreur lors du chargement des données');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const setupCurrency = async (budgetInEur) => {
        const detectedCurrency = detectUserCurrency();
        setCurrency(detectedCurrency);
        await fetchExchangeRates(detectedCurrency);
    };

    const detectUserCurrency = () => {
        const userLang = navigator.language || navigator.userLanguage;

        if (userLang.includes('fr') || userLang.includes('FR') ||
            userLang.includes('de') || userLang.includes('es') ||
            userLang.includes('it')) {
            return 'EUR';
        } else if (userLang.includes('en-US') || userLang.includes('en-CA')) {
            return 'USD';
        } else if (userLang.includes('en-GB')) {
            return 'GBP';
        } else if (userLang.includes('mg') || userLang.includes('MG')) {
            return 'MGA';
        } else {
            return 'EUR';
        }
    };

    const fetchExchangeRates = async (baseCurrency) => {
        try {
            const currencies = ['EUR', 'USD', 'GBP', 'MGA'];
            const rates = await getMultipleRates(baseCurrency, currencies);
            setExchangeRates(rates);
        } catch (error) {
            console.error('Erreur lors de la récupération des taux:', error);
            // Fallback rates
            const fallbackRates = {
                'EUR': 1,
                'USD': baseCurrency === 'USD' ? 1 : 1.08,
                'GBP': baseCurrency === 'GBP' ? 1 : 0.85,
                'MGA': baseCurrency === 'MGA' ? 1 : 4500
            };
            setExchangeRates(fallbackRates);
        }
    };

    const getCurrencySymbol = (curr = currency) => {
        const symbols = {
            'EUR': '€',
            'USD': '$',
            'GBP': '£',
            'MGA': 'Ar'
        };
        return symbols[curr] || '€';
    };

    const formatCurrency = (amount, curr = currency) => {
        try {
            const formatter = new Intl.NumberFormat(navigator.language, {
                style: 'currency',
                currency: curr,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
            return formatter.format(amount);
        } catch (error) {
            return `${amount} ${getCurrencySymbol(curr)}`;
        }
    };

    const convertCurrencyAmount = async (amount, from, to) => {
        if (from === to) return amount;

        try {
            setIsConverting(true);
            const converted = await convertCurrency(amount, from, to);
            setIsConverting(false);
            return converted;
        } catch (error) {
            console.error('Erreur de conversion:', error);
            setIsConverting(false);

            if (exchangeRates[to] && from === currency) {
                return Math.round(amount * exchangeRates[to]);
            }

            return amount;
        }
    };

    const getBudgetCategory = (budget) => {
        if (budget <= 100) return 'Économique';
        if (budget <= 250) return 'Modeste';
        if (budget <= 400) return 'Confort';
        if (budget <= 700) return 'Premium';
        return 'Luxe';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPreferences(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBudgetChange = (e) => {
        const value = parseInt(e.target.value);
        setPreferences(prev => ({
            ...prev,
            budget_max: value
        }));
    };

    const handleQuickBudgetSelect = (value) => {
        setPreferences(prev => ({
            ...prev,
            budget_max: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const userId = user.id;
            const token = localStorage.getItem('token');

            const budgetInEur = await convertCurrencyAmount(
                preferences.budget_max,
                currency,
                'EUR'
            );

            const preferencesToSave = {
                ...preferences,
                budget_max: budgetInEur
            };

            await api.put(`/api/user/preferences/${userId}`, preferencesToSave, {
                headers: { Authorization: `Bearer ${token}` }
            });

            showSuccess('Préférences enregistrées avec succès !');

            // Animation de succès
            if (formRef.current) {
                formRef.current.classList.add(styles.submitSuccess);
                setTimeout(() => {
                    formRef.current.classList.remove(styles.submitSuccess);
                }, 2000);
            }

        } catch (error) {
            console.error('Erreur:', error);
            showError('Erreur lors de la sauvegarde des préférences');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        setIsLoggedIn(false);
        navigate('/');
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const handleRegionClick = (regionId) => {
        setPreferences(prev => ({
            ...prev,
            id_region: regionId
        }));
    };

    const handleSeasonClick = (period) => {
        setPreferences(prev => ({
            ...prev,
            periode_preferee: period
        }));
    };

    const [convertedBudgetSteps, setConvertedBudgetSteps] = useState([]);

    useEffect(() => {
        const updateConvertedBudgets = async () => {
            const converted = await Promise.all(
                budgetSteps.map(async (step) => {
                    const displayValue = await convertCurrencyAmount(
                        step.value,
                        'EUR',
                        currency
                    );
                    return {
                        ...step,
                        displayValue
                    };
                })
            );
            setConvertedBudgetSteps(converted);
        };

        if (currency) {
            updateConvertedBudgets();
        }
    }, [currency, exchangeRates]);

    // Slider ticks
    const sliderTicks = [10, 250, 500, 750, 1000];

    if (isLoading) {
        return (
            <Loader />
        );
    }

    const currentBudgetCategory = getBudgetCategory(preferences.budget_max);

    return (
        <div className={`${styles["preferences-page"]} ${styles[animeTheme]}`}>
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
                        <Link to="/dashboard/preferences" className={`${styles["nav-link"]} ${styles.active}`}>
                            <i className="fas fa-sliders-h"></i>
                            Préferences
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

            {/* Hero Section avec animation */}
            <section className={styles["preferences-hero"]}>
                <div className={styles["hero-overlay"]}></div>
                <div className={styles["hero-slides"]}>
                    <div className={styles["hero-slide"]} style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1523805009345-7448845a9e53?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`
                    }}></div>
                    <div className={styles["hero-slide"]} style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1501555088652-021faa106b9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`
                    }}></div>
                    <div className={styles["hero-slide"]} style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`
                    }}></div>
                </div>

                <div className={styles["hero-content"]}>
                    <h1 className={styles["anime-text"]}>
                        <span className={styles["text-gradient"]}>
                            Personnalisez votre <span className={styles["text-highlight"]}>expérience</span>
                        </span>
                    </h1>

                    <p className={styles["hero-subtitle"]}>
                        Adaptez MadaTour à vos goûts pour des recommandations sur mesure
                    </p>

                    <div className={styles["hero-stats"]}>
                        <div className={`${styles["stat-item"]} ${styles["anime-stat"]}`}>
                            <div className={styles["stat-icon"]}>
                                <i className="fas fa-sliders-h"></i>
                            </div>
                            <div className={styles["stat-content"]}>
                                <span className={styles["stat-value"]}>4</span>
                                <span className={styles["stat-label"]}>Paramètres</span>
                            </div>
                        </div>
                        <div className={`${styles["stat-item"]} ${styles["anime-stat"]}`}>
                            <div className={styles["stat-icon"]}>
                                <i className="fas fa-lightbulb"></i>
                            </div>
                            <div className={styles["stat-content"]}>
                                <span className={styles["stat-value"]}>+20%</span>
                                <span className={styles["stat-label"]}>Pertinence</span>
                            </div>
                        </div>
                        <div className={`${styles["stat-item"]} ${styles["anime-stat"]}`}>
                            <div className={styles["stat-icon"]}>
                                <i className="fas fa-clock"></i>
                            </div>
                            <div className={styles["stat-content"]}>
                                <span className={styles["stat-value"]}>30s</span>
                                <span className={styles["stat-label"]}>Configuration</span>
                            </div>
                        </div>
                        <div className={`${styles["stat-item"]} ${styles["anime-stat"]}`}>
                            <div className={styles["stat-icon"]}>
                                <i className="fas fa-chart-line"></i>
                            </div>
                            <div className={styles["stat-content"]}>
                                <span className={styles["stat-value"]}>100%</span>
                                <span className={styles["stat-label"]}>Personnalisation</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles["floating-elements"]}>
                    <div className={styles["floating-settings"]}></div>
                    <div className={styles["floating-gear-1"]}></div>
                    <div className={styles["floating-gear-2"]}></div>
                </div>
            </section>

            {/* Tabs de navigation */}
            <section className={styles["preferences-tabs"]}>
                <div className={styles["tabs-container"]}>
                    <button
                        className={`${styles["tab-button"]} ${activeTab === 'preferences' ? styles.active : ''}`}
                        onClick={() => setActiveTab('preferences')}
                    >
                        <i className="fas fa-sliders-h"></i>
                        <span>Préférences</span>
                        <div className={styles["tab-glow"]}></div>
                    </button>
                    <button
                        className={`${styles["tab-button"]} ${activeTab === 'budget' ? styles.active : ''}`}
                        onClick={() => setActiveTab('budget')}
                    >
                        <i className="fas fa-wallet"></i>
                        <span>Guide Budget</span>
                        <div className={styles["tab-glow"]}></div>
                    </button>
                    <button
                        className={`${styles["tab-button"]} ${activeTab === 'seasons' ? styles.active : ''}`}
                        onClick={() => setActiveTab('seasons')}
                    >
                        <i className="fas fa-calendar-alt"></i>
                        <span>Saisons</span>
                        <div className={styles["tab-glow"]}></div>
                    </button>
                </div>
            </section>

            {/* Contenu principal */}
            <main className={styles["preferences-main"]}>
                {/* Section Préférences */}
                {activeTab === 'preferences' && (
                    <div className={styles["preferences-content"]}>
                        <div className={styles["preferences-grid"]}>
                            {/* Carte du formulaire */}
                            <div className={`${styles["preferences-form-card"]} ${styles["anime-card"]}`}>
                                <div className={styles["card-header"]}>
                                    <div className={styles["card-icon-wrapper"]}>
                                        <i className="fas fa-sliders-h"></i>
                                        <div className={styles["icon-glow"]}></div>
                                    </div>
                                    <h2>Paramètres personnels</h2>
                                    <p>Personnalisez votre expérience MadaTour</p>
                                </div>

                                <form onSubmit={handleSubmit} ref={formRef}>
                                    <div className={styles["form-section"]}>
                                        <div className={styles["section-header"]}>
                                            <div className={styles["section-icon"]}>
                                                <i className="fas fa-heart"></i>
                                            </div>
                                            <h3>Centres d'intérêt</h3>
                                            <p>Quel type de sites touristiques préférez-vous ?</p>
                                        </div>

                                        <div className={styles["form-group"]}>
                                            <label className={styles["form-label"]}>
                                                <i className="fas fa-mountain"></i>
                                                <span>Type de site préféré</span>
                                                <span className={styles["label-badge"]}>Recommandé</span>
                                            </label>
                                            <div className={styles["select-wrapper"]}>
                                                <select
                                                    name="type_site"
                                                    value={preferences.type_site}
                                                    onChange={handleChange}
                                                    className={styles["form-control"]}
                                                    required
                                                >
                                                    <option value="">Sélectionnez un type</option>
                                                    {siteTypes.map(type => (
                                                        <option key={type.id_type} value={type.libele}>
                                                            <i className={`fas ${type.icon || 'fa-map-marker-alt'}`}></i>
                                                            {type.libele}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className={styles["select-arrow"]}>
                                                    <i className="fas fa-chevron-down"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles["form-section"]}>
                                        <div className={styles["section-header"]}>
                                            <div className={styles["section-icon"]}>
                                                <i className="fas fa-wallet"></i>
                                            </div>
                                            <div className={styles["header-content"]}>
                                                <div className={styles["budget-section-header"]}>
                                                    <h3>Budget quotidien</h3>
                                                    <div className={styles["currency-display"]}>
                                                        <span className={styles["currency-label"]}>Devise :</span>
                                                        <div className={styles["currency-selector"]}>
                                                            <button
                                                                type="button"
                                                                className={styles["currency-option"]}
                                                                title={`${currency} ${getCurrencySymbol()}`}
                                                            >
                                                                {currency} {getCurrencySymbol()}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p>Définissez votre budget maximum par jour</p>
                                            </div>
                                        </div>

                                        <div className={styles["budget-display-container"]}>
                                            <div className={styles["budget-display-card"]}>
                                                <div className={styles["budget-value-display"]}>
                                                    <span className={styles["budget-value"]}>
                                                        {formatCurrency(preferences.budget_max)}
                                                    </span>
                                                    <span className={`${styles["budget-category"]} ${styles[`category-${currentBudgetCategory.toLowerCase().replace(' ', '-')}`]}`}>
                                                        <i className="fas fa-tag"></i>
                                                        {currentBudgetCategory}
                                                    </span>
                                                </div>
                                                <div className={styles["budget-per-day"]}>
                                                    <i className="fas fa-calendar-day"></i>
                                                    <span>Par jour</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Slider de budget amélioré */}
                                        <div className={styles["budget-slider-container"]}>
                                            <div className={styles["budget-slider-wrapper"]}>
                                                <input
                                                    ref={budgetSliderRef}
                                                    type="range"
                                                    name="budget_max"
                                                    min="10"
                                                    max="1000"
                                                    step="10"
                                                    value={preferences.budget_max}
                                                    onChange={handleBudgetChange}
                                                    className={styles["budget-slider"]}
                                                    disabled={isConverting}
                                                    style={{
                                                        '--budget-percent': `${(preferences.budget_max - 10) / (1000 - 10) * 100}%`,
                                                        '--slider-color': getBudgetColor(preferences.budget_max)
                                                    }}
                                                />
                                                <div className={styles["budget-ticks"]}>
                                                    {sliderTicks.map(tick => (
                                                        <div
                                                            key={tick}
                                                            className={styles["budget-tick"]}
                                                            style={{ left: `${((tick - 10) / (1000 - 10)) * 100}%` }}
                                                        >
                                                            <span className={styles["tick-marker"]}></span>
                                                            <span className={styles["tick-label"]}>{formatCurrency(tick)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Options de budget préconfigurées */}
                                        <div className={styles["budget-options"]}>
                                            <p className={styles["budget-options-label"]}>
                                                <i className="fas fa-bolt"></i>
                                                <span>Niveaux de budget recommandés :</span>
                                            </p>
                                            <div className={styles["budget-options-grid"]}>
                                                {convertedBudgetSteps.map(step => (
                                                    <button
                                                        key={step.label}
                                                        type="button"
                                                        className={`${styles["budget-option"]} ${preferences.budget_max === step.displayValue ? styles.active : ''}`}
                                                        onClick={() => handleQuickBudgetSelect(step.displayValue)}
                                                        disabled={isConverting}
                                                        style={{ '--option-color': step.color }}
                                                    >
                                                        <div className={styles["budget-option-header"]}>
                                                            <div className={styles["budget-option-icon"]}>
                                                                <i className={`fas ${step.icon}`}></i>
                                                                <div className={styles["icon-aura"]}></div>
                                                            </div>
                                                            <div className={styles["budget-option-content"]}>
                                                                <span className={styles["budget-option-label"]}>{step.label}</span>
                                                                <span className={styles["budget-option-amount"]}>
                                                                    {formatCurrency(step.displayValue)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className={styles["budget-option-description"]}>
                                                            {step.description}
                                                        </div>
                                                        <div className={styles["budget-option-glow"]}></div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Explication du budget */}
                                        <div className={styles["budget-explanation"]}>
                                            <div className={styles["explanation-icon"]}>
                                                <i className="fas fa-info-circle"></i>
                                            </div>
                                            <div className={styles["explanation-content"]}>
                                                <p>
                                                    Ce budget correspond aux dépenses quotidiennes moyennes
                                                    (hébergement, repas, activités, transport).
                                                </p>
                                                <p className={styles["explanation-note"]}>
                                                    <i className="fas fa-lightbulb"></i>
                                                    Conseillé : {formatCurrency(300)} pour un bon équilibre confort/prix
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles["form-section"]}>
                                        <div className={styles["section-header"]}>
                                            <div className={styles["section-icon"]}>
                                                <i className="fas fa-globe-africa"></i>
                                            </div>
                                            <h3>Localisation préférée</h3>
                                            <p>Sélectionnez votre région de prédilection</p>
                                        </div>

                                        <div className={styles["form-group"]}>
                                            <label className={styles["form-label"]}>
                                                <i className="fas fa-map-marked-alt"></i>
                                                <span>Région favorite</span>
                                            </label>
                                            <div className={styles["select-wrapper"]}>
                                                <select
                                                    name="id_region"
                                                    value={preferences.id_region}
                                                    onChange={handleChange}
                                                    className={styles["form-control"]}
                                                >
                                                    <option value="">Sélectionnez une région</option>
                                                    {regions.map(region => (
                                                        <option key={region.id_region} value={region.id_region}>
                                                            {region.nom}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className={styles["select-arrow"]}>
                                                    <i className="fas fa-chevron-down"></i>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Boutons rapides pour les régions */}
                                        <div className={styles["quick-regions"]}>
                                            <p className={styles["quick-label"]}>
                                                <i className="fas fa-bolt"></i>
                                                <span>Sélection rapide :</span>
                                            </p>
                                            <div className={styles["region-buttons"]}>
                                                {regions.slice(0, 6).map(region => (
                                                    <button
                                                        key={region.id_region}
                                                        type="button"
                                                        className={`${styles["region-button"]} ${preferences.id_region === region.id_region ? styles.active : ''}`}
                                                        onClick={() => handleRegionClick(region.id_region)}
                                                    >
                                                        <i className="fas fa-map-marker-alt"></i>
                                                        <span>{region.nom}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles["form-section"]}>
                                        <div className={styles["section-header"]}>
                                            <div className={styles["section-icon"]}>
                                                <i className="fas fa-calendar-alt"></i>
                                            </div>
                                            <h3>Période de voyage</h3>
                                            <p>Quand prévoyez-vous de voyager ?</p>
                                        </div>

                                        <div className={styles["form-group"]}>
                                            <label className={styles["form-label"]}>
                                                <i className="fas fa-sun"></i>
                                                <span>Période préférée</span>
                                                <span className={styles["label-badge"]}>Important</span>
                                            </label>
                                            <div className={styles["select-wrapper"]}>
                                                <select
                                                    name="periode_preferee"
                                                    value={preferences.periode_preferee}
                                                    onChange={handleChange}
                                                    className={styles["form-control"]}
                                                    required
                                                >
                                                    <option value="">Sélectionnez une période</option>
                                                    <option value="Juillet-Août">Juillet-Août (Saison sèche)</option>
                                                    <option value="Avril-Juin">Avril-Juin (Températures douces)</option>
                                                    <option value="Septembre-Novembre">Septembre-Novembre (Floraison)</option>
                                                    <option value="Décembre-Mars">Décembre-Mars (Saison des pluies)</option>
                                                </select>
                                                <div className={styles["select-arrow"]}>
                                                    <i className="fas fa-chevron-down"></i>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Boutons rapides pour les saisons */}
                                        <div className={styles["quick-seasons"]}>
                                            <p className={styles["quick-label"]}>
                                                <i className="fas fa-bolt"></i>
                                                <span>Périodes recommandées :</span>
                                            </p>
                                            <div className={styles["season-cards"]}>
                                                {seasonData.map(season => (
                                                    <button
                                                        key={season.period}
                                                        type="button"
                                                        className={`${styles["season-card"]} ${preferences.periode_preferee === season.period ? styles.active : ''}`}
                                                        onClick={() => handleSeasonClick(season.period)}
                                                        style={{ '--season-color': season.color }}
                                                    >
                                                        <div className={styles["season-icon"]}>
                                                            <i className={`fas ${season.icon}`}></i>
                                                            <div className={styles["season-glow"]}></div>
                                                        </div>
                                                        <div className={styles["season-content"]}>
                                                            <span className={styles["season-period"]}>{season.period}</span>
                                                            <span className={styles["season-name"]}>{season.name}</span>
                                                            <span className={styles["season-desc"]}>{season.description}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles["form-actions"]}>
                                        <button
                                            type="submit"
                                            className={`${styles["save-button"]} ${isSubmitting ? styles.submitting : ''}`}
                                            disabled={isSubmitting || isConverting}
                                        >
                                            <div className={styles["button-content"]}>
                                                {isSubmitting ? (
                                                    <>
                                                        <i className="fas fa-spinner fa-spin"></i>
                                                        <span>Enregistrement en cours...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-save"></i>
                                                        <span>Enregistrer les préférences</span>
                                                    </>
                                                )}
                                            </div>
                                            <div className={styles["button-glow"]}></div>
                                            <div className={styles["button-particles"]}></div>
                                        </button>
                                        <Link to="/dashboard" className={styles["cancel-button"]}>
                                            <i className="fas fa-arrow-left"></i>
                                            <span>Retour au tableau de bord</span>
                                            <div className={styles["button-wave"]}></div>
                                        </Link>
                                    </div>
                                </form>

                                <div className={styles["card-glow"]}></div>
                                <div className={styles["card-sparkle-1"]}></div>
                                <div className={styles["card-sparkle-2"]}></div>
                            </div>

                            {/* Carte des conseils */}
                            <div className={`${styles["preferences-tips-card"]} ${styles["anime-card"]}`}>
                                <div className={styles["card-header"]}>
                                    <div className={styles["card-icon-wrapper"]}>
                                        <i className="fas fa-lightbulb"></i>
                                        <div className={styles["icon-glow"]}></div>
                                    </div>
                                    <h2>Conseils personnalisés</h2>
                                    <p>Optimisez votre expérience avec ces astuces</p>
                                </div>

                                <div className={styles["tips-content"]}>
                                    <div className={styles["tips-grid"]}>
                                        {tipsData.preferences.map(tip => (
                                            <div key={tip.id} className={styles["tip-card"]}>
                                                <div className={styles["tip-icon-wrapper"]}>
                                                    <div className={styles["tip-icon"]}>
                                                        <i className={`fas ${tip.icon}`}></i>
                                                    </div>
                                                    <div className={styles["tip-glow"]}></div>
                                                </div>
                                                <h3>{tip.title}</h3>
                                                <p className={styles["tip-description"]}>{tip.description}</p>
                                                <ul className={styles["tip-details"]}>
                                                    {tip.details.map((detail, idx) => (
                                                        <li key={idx}>
                                                            <i className="fas fa-check"></i>
                                                            <span>{detail}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className={styles["tip-badge"]}>
                                                    <i className="fas fa-star"></i>
                                                    <span>Conseil pro</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className={styles["additional-info"]}>
                                        <div className={styles["info-header"]}>
                                            <div className={styles["info-icon"]}>
                                                <i className="fas fa-chart-pie"></i>
                                            </div>
                                            <h3>Impact des préférences</h3>
                                        </div>
                                        <div className={styles["info-content"]}>
                                            <p>
                                                En renseignant vos préférences, vous augmentez la pertinence des
                                                recommandations de <strong>40%</strong> et économisez jusqu'à
                                                <strong> 25%</strong> de temps dans la planification.
                                            </p>
                                            <div className={styles["info-stats"]}>
                                                <div className={styles["info-stat"]}>
                                                    <span className={styles["stat-value"]}>+40%</span>
                                                    <span className={styles["stat-label"]}>Pertinence</span>
                                                </div>
                                                <div className={styles["info-stat"]}>
                                                    <span className={styles["stat-value"]}>-25%</span>
                                                    <span className={styles["stat-label"]}>Temps de planif.</span>
                                                </div>
                                                <div className={styles["info-stat"]}>
                                                    <span className={styles["stat-value"]}>+60%</span>
                                                    <span className={styles["stat-label"]}>Satisfaction</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section Guide Budget */}
                {activeTab === 'budget' && (
                    <div className={styles["budget-guide-content"]}>
                        <div className={styles["section-header"]}>
                            <h2>
                                <span className={styles["title-anime"]}>
                                    Guide <span className={styles["title-accent"]}>budgétaire</span>
                                </span>
                            </h2>
                            <p className={styles["subtitle-anime"]}>
                                Comprenez ce que chaque niveau de budget vous offre à Madagascar
                            </p>
                        </div>

                        <div className={styles["budget-guide-grid"]}>
                            {tipsData.budget.map((level, index) => (
                                <div
                                    key={index}
                                    className={`${styles["budget-level-card"]} ${styles["anime-budget"]}`}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className={styles["budget-level-header"]}>
                                        <div className={styles["level-icon"]}>
                                            <i className={`fas ${level.icon}`}></i>
                                            <div className={styles["level-glow"]}></div>
                                        </div>
                                        <h3>{level.range}</h3>
                                        <div className={styles["level-indicator"]}></div>
                                    </div>
                                    <p className={styles["budget-description"]}>{level.description}</p>
                                    <div className={styles["budget-details"]}>
                                        <div className={styles["detail-item"]}>
                                            <i className="fas fa-bed"></i>
                                            <span>Hébergement</span>
                                            <span className={styles["detail-value"]}>
                                                {index === 0 ? 'Basique' : index === 1 ? 'Confortable' : index === 2 ? 'Premium' : 'Luxe'}
                                            </span>
                                        </div>
                                        <div className={styles["detail-item"]}>
                                            <i className="fas fa-utensils"></i>
                                            <span>Restauration</span>
                                            <span className={styles["detail-value"]}>
                                                {index === 0 ? 'Local' : index === 1 ? 'Mixte' : index === 2 ? 'Restaurants' : 'Gastronomique'}
                                            </span>
                                        </div>
                                        <div className={styles["detail-item"]}>
                                            <i className="fas fa-car"></i>
                                            <span>Transport</span>
                                            <span className={styles["detail-value"]}>
                                                {index === 0 ? 'Public' : index === 1 ? 'Partagé' : index === 2 ? 'Privé' : 'VIP'}
                                            </span>
                                        </div>
                                        <div className={styles["detail-item"]}>
                                            <i className="fas fa-hiking"></i>
                                            <span>Activités</span>
                                            <span className={styles["detail-value"]}>
                                                {index === 0 ? 'Libres' : index === 1 ? 'Guidées' : index === 2 ? 'Exclusives' : 'Sur mesure'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles["budget-footer"]}>
                                        <span className={styles["budget-tip"]}>
                                            <i className="fas fa-lightbulb"></i>
                                            Recommandé pour {index === 0 ? 'les routards' : index === 1 ? 'les familles' : index === 2 ? 'les couples' : 'le luxe'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={styles["currency-comparison"]}>
                            <h3>
                                <i className="fas fa-exchange-alt"></i>
                                Comparaison des devises
                            </h3>
                            <div className={styles["comparison-grid"]}>
                                <div className={styles["currency-card"]}>
                                    <div className={styles["currency-header"]}>
                                        <i className="fas fa-euro-sign"></i>
                                        <h4>Euro (EUR)</h4>
                                    </div>
                                    <div className={styles["currency-value"]}>
                                        <span>1 EUR =</span>
                                        <span>{exchangeRates.USD ? exchangeRates.USD.toFixed(2) : '1.08'} USD</span>
                                    </div>
                                </div>
                                <div className={styles["currency-card"]}>
                                    <div className={styles["currency-header"]}>
                                        <i className="fas fa-dollar-sign"></i>
                                        <h4>Dollar (USD)</h4>
                                    </div>
                                    <div className={styles["currency-value"]}>
                                        <span>1 USD =</span>
                                        <span>{exchangeRates.EUR ? (1 / exchangeRates.USD).toFixed(2) : '0.93'} EUR</span>
                                    </div>
                                </div>
                                <div className={styles["currency-card"]}>
                                    <div className={styles["currency-header"]}>
                                        <i className="fas fa-pound-sign"></i>
                                        <h4>Livre (GBP)</h4>
                                    </div>
                                    <div className={styles["currency-value"]}>
                                        <span>1 GBP =</span>
                                        <span>{exchangeRates.EUR ? exchangeRates.GBP.toFixed(2) : '1.18'} EUR</span>
                                    </div>
                                </div>
                                <div className={styles["currency-card"]}>
                                    <div className={styles["currency-header"]}>
                                        <i className="fas fa-money-bill-wave"></i>
                                        <h4>Ariary (MGA)</h4>
                                    </div>
                                    <div className={styles["currency-value"]}>
                                        <span>1 EUR =</span>
                                        <span>{exchangeRates.MGA ? exchangeRates.MGA.toLocaleString() : '4,500'} MGA</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section Saisons */}
                {activeTab === 'seasons' && (
                    <div className={styles["seasons-content"]}>
                        <div className={styles["section-header"]}>
                            <h2>
                                <span className={styles["title-anime"]}>
                                    Guide des <span className={styles["title-accent"]}>saisons</span>
                                </span>
                            </h2>
                            <p className={styles["subtitle-anime"]}>
                                Choisissez la meilleure période pour votre voyage à Madagascar
                            </p>
                        </div>

                        <div className={styles["seasons-grid"]}>
                            {seasonData.map((season, index) => (
                                <div
                                    key={season.period}
                                    className={`${styles["season-guide-card"]} ${styles["anime-season"]}`}
                                    style={{
                                        animationDelay: `${index * 0.2}s`,
                                        '--season-color': season.color
                                    }}
                                >
                                    <div className={styles["season-guide-header"]}>
                                        <div className={styles["season-icon-wrapper"]}>
                                            <i className={`fas ${season.icon}`}></i>
                                            <div className={styles["season-icon-glow"]}></div>
                                        </div>
                                        <div className={styles["season-title"]}>
                                            <h3>{season.period}</h3>
                                            <span className={styles["season-subtitle"]}>{season.name}</span>
                                        </div>
                                        <div className={styles["season-badge"]}>
                                            <i className="fas fa-calendar-star"></i>
                                        </div>
                                    </div>

                                    <p className={styles["season-guide-desc"]}>{season.description}</p>

                                    <div className={styles["season-details"]}>
                                        <div className={styles["detail-item"]}>
                                            <i className="fas fa-thermometer-half"></i>
                                            <div>
                                                <span className={styles["detail-label"]}>Température</span>
                                                <span className={styles["detail-value"]}>
                                                    {index === 0 ? '25-30°C' : index === 1 ? '22-28°C' : index === 2 ? '20-25°C' : '18-32°C'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={styles["detail-item"]}>
                                            <i className="fas fa-cloud-rain"></i>
                                            <div>
                                                <span className={styles["detail-label"]}>Précipitations</span>
                                                <span className={styles["detail-value"]}>
                                                    {index === 0 ? 'Faibles' : index === 1 ? 'Modérées' : index === 2 ? 'Faibles' : 'Abondantes'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={styles["detail-item"]}>
                                            <i className="fas fa-users"></i>
                                            <div>
                                                <span className={styles["detail-label"]}>Affluence</span>
                                                <span className={styles["detail-value"]}>
                                                    {index === 0 ? 'Élevée' : index === 1 ? 'Moyenne' : index === 2 ? 'Faible' : 'Très faible'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={styles["detail-item"]}>
                                            <i className="fas fa-tags"></i>
                                            <div>
                                                <span className={styles["detail-label"]}>Prix</span>
                                                <span className={styles["detail-value"]}>
                                                    {index === 0 ? 'Élevés' : index === 1 ? 'Moyens' : index === 2 ? 'Moyens' : 'Bas'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles["season-activities"]}>
                                        <h4>
                                            <i className="fas fa-hiking"></i>
                                            Activités recommandées
                                        </h4>
                                        <div className={styles["activities-list"]}>
                                            {getSeasonActivities(index).map((activity, idx) => (
                                                <span key={idx} className={styles["activity-tag"]}>
                                                    <i className="fas fa-check"></i>
                                                    {activity}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={styles["season-footer"]}>
                                        <button
                                            type="button"
                                            className={styles["season-select-button"]}
                                            onClick={() => handleSeasonClick(season.period)}
                                        >
                                            <i className="fas fa-check-circle"></i>
                                            <span>Choisir cette période</span>
                                        </button>
                                        <div className={styles["season-tip"]}>
                                            <i className="fas fa-lightbulb"></i>
                                            <span>{getSeasonTip(index)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Section CTA */}
            {isLoggedIn ? (
                <section className={styles["user-preferences-cta"]}>
                    <div className={styles["user-cta-content"]}>
                        <div className={styles["user-cta-animation"]}>
                            <div className={styles["user-cta-orbs"]}>
                                <div className={styles["user-orb-1"]}></div>
                                <div className={styles["user-orb-2"]}></div>
                            </div>
                        </div>
                        <h2>Vos préférences sont enregistrées !</h2>
                        <p>Profitez de recommandations personnalisées et planifiez votre voyage parfait</p>
                        <div className={styles["user-cta-buttons"]}>
                            <Link to="/activities" className={`${styles["user-cta-button"]} ${styles["primary"]}`}>
                                <i className="fas fa-compass"></i>
                                <span>Découvrir des activités</span>
                            </Link>
                            <Link to="/my-trip" className={`${styles["user-cta-button"]} ${styles["secondary"]}`}>
                                <i className="fas fa-map-marked-alt"></i>
                                <span>Planifier mon voyage</span>
                            </Link>
                            <Link to="/dashboard" className={`${styles["user-cta-button"]} ${styles["tertiary"]}`}>
                                <i className="fas fa-tachometer-alt"></i>
                                <span>Tableau de bord</span>
                            </Link>
                        </div>
                    </div>
                </section>
            ) : (
                <section className={styles["preferences-cta"]}>
                    <div className={styles["cta-content"]}>
                        <div className={styles["cta-animation"]}>
                            <div className={styles["cta-orbs"]}>
                                <div className={styles["orb-1"]}></div>
                                <div className={styles["orb-2"]}></div>
                                <div className={styles["orb-3"]}></div>
                            </div>
                        </div>
                        <h2>Prêt à personnaliser votre expérience ?</h2>
                        <p>Créez un compte pour sauvegarder vos préférences et recevoir des recommandations uniques</p>
                        <div className={styles["cta-buttons"]}>
                            <Link to="/register" className={`${styles["cta-button"]} ${styles["primary"]}`}>
                                <i className="fas fa-user-plus"></i>
                                <span>S'inscrire gratuitement</span>
                                <div className={styles["button-particles"]}></div>
                            </Link>
                            <Link to="/login" className={`${styles["cta-button"]} ${styles["secondary"]}`}>
                                <i className="fas fa-sign-in-alt"></i>
                                <span>Se connecter</span>
                            </Link>
                            <Link to="/blog/tips" className={`${styles["cta-button"]} ${styles["tertiary"]}`}>
                                <i className="fas fa-book-open"></i>
                                <span>Conseils de voyage</span>
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
                                Personnalisez votre aventure malgache avec nos recommandations sur mesure.
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
                                    <i className="fas fa-sliders-h"></i>
                                    Préférences
                                </h3>
                                <ul>
                                    {['Budget', 'Régions', 'Saisons', 'Types de sites', 'FAQ préférences'].map((item) => (
                                        <li key={item}>
                                            <Link to={`/preferences#${item.toLowerCase().replace(' ', '-')}`}>
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
                                    {['Conseils budget', 'Calendrier saisons', 'FAQ', 'Contact', 'Blog'].map((item) => (
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
                                Infos personnalisées
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

// Fonctions utilitaires
const getBudgetColor = (budget) => {
    if (budget <= 100) return '#48bb78'; // Vert
    if (budget <= 250) return '#4299e1'; // Bleu
    if (budget <= 400) return '#9f7aea'; // Violet
    if (budget <= 700) return '#ed8936'; // Orange
    return '#f56565'; // Rouge
};

const getSeasonActivities = (seasonIndex) => {
    const activities = [
        ['Randonnée', 'Plage', 'Observation baleines'],
        ['Culture', 'Visites', 'Photographie'],
        ['Botanique', 'Observation faune', 'Paysages'],
        ['Villages', 'Marchés', 'Culture locale']
    ];
    return activities[seasonIndex];
};

const getSeasonTip = (seasonIndex) => {
    const tips = [
        'Réservez 6 mois à l\'avance pour les meilleurs tarifs',
        'Parfait pour les familles et les voyages en groupe',
        'Idéal pour les photographes et amoureux de la nature',
        'Profitez des tarifs bas et de la verdure luxuriante'
    ];
    return tips[seasonIndex];
};

export default Preferences;