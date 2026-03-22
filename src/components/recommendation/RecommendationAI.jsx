import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './RecommendationAI.module.css';

const RecommendationAI = ({ onClose }) => {
    const [step, setStep] = useState(1);
    const [userPreferences, setUserPreferences] = useState({
        travelType: '',
        budget: '',
        duration: '',
        interests: [],
        season: ''
    });
    const [loading, setLoading] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const currencyRate = localStorage.getItem('currencyRate') || 1;

    const travelTypes = [
        { id: 'romantic', label: 'Romantique', icon: 'fas fa-heart' },
        { id: 'family', label: 'Familial', icon: 'fas fa-users' },
        { id: 'adventure', label: 'Aventure', icon: 'fas fa-hiking' },
        { id: 'culture', label: 'Culturel', icon: 'fas fa-landmark' },
        { id: 'beach', label: 'Plage', icon: 'fas fa-umbrella-beach' },
        { id: 'luxury', label: 'Luxe', icon: 'fas fa-crown' }
    ];

    const interestsList = [
        { id: 'wildlife', label: 'Faune & Flore', icon: 'fas fa-paw' },
        { id: 'photography', label: 'Photographie', icon: 'fas fa-camera' },
        { id: 'food', label: 'Gastronomie', icon: 'fas fa-utensils' },
        { id: 'hiking', label: 'Randonnée', icon: 'fas fa-mountain' },
        { id: 'diving', label: 'Plongée', icon: 'fas fa-water' },
        { id: 'history', label: 'Histoire', icon: 'fas fa-history' },
        { id: 'relaxation', label: 'Détente', icon: 'fas fa-spa' },
        { id: 'shopping', label: 'Shopping', icon: 'fas fa-shopping-bag' }
    ];

    const budgets = [
        { id: 'budget', label: 'Économique', icon: 'fas fa-wallet' },
        { id: 'mid', label: 'Moyen', icon: 'fas fa-money-bill-wave' },
        { id: 'luxury', label: 'Luxe', icon: 'fas fa-gem' }
    ];

    const durations = [
        { id: 'weekend', label: 'Week-end', icon: 'fas fa-calendar-day' },
        { id: 'week', label: '1 semaine', icon: 'fas fa-calendar-week' },
        { id: 'two-weeks', label: '2 semaines', icon: 'fas fa-calendar-alt' },
        { id: 'month', label: '1 mois+', icon: 'fas fa-calendar' }
    ];

    const seasons = [
        { id: 'summer', label: 'Été', icon: 'fas fa-sun' },
        { id: 'winter', label: 'Hiver', icon: 'fas fa-snowflake' },
        { id: 'spring', label: 'Printemps', icon: 'fas fa-seedling' },
        { id: 'autumn', label: 'Automne', icon: 'fas fa-leaf' }
    ];

    const handleInterestToggle = (interestId) => {
        setUserPreferences(prev => ({
            ...prev,
            interests: prev.interests.includes(interestId)
                ? prev.interests.filter(id => id !== interestId)
                : [...prev.interests, interestId]
        }));
    };
    useEffect(() => {
        console.log('recommendations :', recommendations);
    }, [recommendations]);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Simulation d'appel API IA
            const response = await axios.post('http://localhost:8000/api/v1/itineraries/generate', {
                userPreferences
            });

            // En attendant le backend, utilisation de données simulées
            const simulatedRecommendations = [
                {
                    id: 1,
                    name: 'Circuit Baobabs & Plages',
                    description: 'Découvrez l\'allée des baobabs et les plages de Nosy Be',
                    matchScore: 95,
                    duration: '8 jours',
                    price: '€1,200',
                    highlights: ['Baobabs', 'Plongée', 'Coucher de soleil']
                },
                {
                    id: 2,
                    name: 'Aventure Tsingy',
                    description: 'Exploration des formations karstiques uniques',
                    matchScore: 88,
                    duration: '5 jours',
                    price: '€850',
                    highlights: ['Randonnée', 'Paysages', 'Lémuriens']
                },
                {
                    id: 3,
                    name: 'Culture Malgache',
                    description: 'Immersion dans la culture et traditions',
                    matchScore: 92,
                    duration: '7 jours',
                    price: '€1,100',
                    highlights: ['Marchés', 'Artisanat', 'Cuisine']
                }
            ];

            setRecommendations(response.data.itineraries || []);
            console.log(response.data.itineraries)
            setShowResults(true);
        } catch (error) {
            console.error('Erreur IA:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.aiOverlay}>
            <div className={styles.aiContainer}>
                <div className={styles.aiHeader}>
                    <h2>
                        <i className="fas fa-robot"></i>
                        Assistant IA de Voyage
                    </h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {!showResults ? (
                    <div className={styles.aiSteps}>
                        {/* Étape 1 : Type de voyage */}
                        {step === 1 && (
                            <div className={styles.step}>
                                <h3>Quel type de voyage cherchez-vous ?</h3>
                                <div className={styles.optionsGrid}>
                                    {travelTypes.map(type => (
                                        <button
                                            key={type.id}
                                            className={`${styles.optionButton} ${userPreferences.travelType === type.id ? styles.selected : ''
                                                }`}
                                            onClick={() => setUserPreferences({
                                                ...userPreferences,
                                                travelType: type.id
                                            })}
                                        >
                                            <i className={type.icon}></i>
                                            <span>{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Étape 2 : Budget */}
                        {step === 2 && (
                            <div className={styles.step}>
                                <h3>Quel est votre budget ?</h3>
                                <div className={styles.optionsGrid}>
                                    {budgets.map(budget => (
                                        <button
                                            key={budget.id}
                                            className={`${styles.optionButton} ${userPreferences.budget === budget.id ? styles.selected : ''
                                                }`}
                                            onClick={() => setUserPreferences({
                                                ...userPreferences,
                                                budget: budget.id
                                            })}
                                        >
                                            <i className={budget.icon}></i>
                                            <span>{budget.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Étape 3 : Durée */}
                        {step === 3 && (
                            <div className={styles.step}>
                                <h3>Combien de temps ?</h3>
                                <div className={styles.optionsGrid}>
                                    {durations.map(duration => (
                                        <button
                                            key={duration.id}
                                            className={`${styles.optionButton} ${userPreferences.duration === duration.id ? styles.selected : ''
                                                }`}
                                            onClick={() => setUserPreferences({
                                                ...userPreferences,
                                                duration: duration.id
                                            })}
                                        >
                                            <i className={duration.icon}></i>
                                            <span>{duration.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Étape 4 : Centres d'intérêt */}
                        {step === 4 && (
                            <div className={styles.step}>
                                <h3>Quels sont vos centres d'intérêt ?</h3>
                                <p className={styles.subtitle}>Sélectionnez plusieurs options</p>
                                <div className={styles.interestsGrid}>
                                    {interestsList.map(interest => (
                                        <button
                                            key={interest.id}
                                            className={`${styles.interestButton} ${userPreferences.interests.includes(interest.id) ? styles.selected : ''
                                                }`}
                                            onClick={() => handleInterestToggle(interest.id)}
                                        >
                                            <i className={interest.icon}></i>
                                            <span>{interest.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Étape 5 : Saison */}
                        {step === 5 && (
                            <div className={styles.step}>
                                <h3>Quand comptez-vous voyager ?</h3>
                                <div className={styles.optionsGrid}>
                                    {seasons.map(season => (
                                        <button
                                            key={season.id}
                                            className={`${styles.optionButton} ${userPreferences.season === season.id ? styles.selected : ''
                                                }`}
                                            onClick={() => setUserPreferences({
                                                ...userPreferences,
                                                season: season.id
                                            })}
                                        >
                                            <i className={season.icon}></i>
                                            <span>{season.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className={styles.navigation}>
                            {step > 1 && (
                                <button
                                    onClick={() => setStep(step - 1)}
                                    className={styles.navButton}
                                >
                                    <i className="fas fa-arrow-left"></i> Précédent
                                </button>
                            )}

                            {step < 5 ? (
                                <button
                                    onClick={() => setStep(step + 1)}
                                    className={styles.navButton}
                                    disabled={
                                        (step === 1 && !userPreferences.travelType) ||
                                        (step === 2 && !userPreferences.budget) ||
                                        (step === 3 && !userPreferences.duration) ||
                                        (step === 4 && userPreferences.interests.length === 0)
                                    }
                                >
                                    Suivant <i className="fas fa-arrow-right"></i>
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    className={styles.submitButton}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i>
                                            Analyse en cours...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-magic"></i>
                                            Générer mes recommandations
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={styles.results}>
                        <div className={styles.resultsHeader}>
                            <h3>Recommandations personnalisées</h3>
                            <p>Basé sur vos préférences</p>
                        </div>

                        <div className={styles.recommendationsList}>
                            {recommendations.map(rec => (
                                <div key={rec.id} className={styles.recommendationCard}>
                                    <div className={styles.matchScore}>
                                        <div className={styles.scoreCircle}>
                                            <span>{rec.matchScore || 90}%</span>
                                        </div>
                                        <span>Correspondance</span>
                                    </div>

                                    <div className={styles.recommendationContent}>
                                        <h4>{rec.nom}</h4>
                                        <p>{rec.description}</p>

                                        <div className={styles.recommendationMeta}>
                                            <div className={styles.metaItem}>
                                                <i className="fas fa-clock"></i>
                                                <span>{rec.duree_jours}</span>
                                            </div>
                                            <div className={styles.metaItem}>
                                                <i className="fas fa-euro-sign"></i>
                                                <span>{(rec.prix_total / currencyRate).toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div className={styles.highlights}>
                                            {rec.types.map((highlight, index) => (
                                                <span key={index} className={styles.highlight}>
                                                    {highlight}
                                                </span>
                                            ))}
                                        </div>

                                        <button className={styles.viewDetailsButton}>
                                            Voir les détails <i className="fas fa-external-link-alt"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowResults(false)}
                            className={styles.restartButton}
                        >
                            <i className="fas fa-redo"></i>
                            Recommencer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecommendationAI;