import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTrip } from './TripContext';
import api from '../api';
import { useNotification } from '../components/Notification/NotificationProvider';
import clsx from 'clsx';
import styles from './css/TripPage.module.css';

const TripPage = () => {
    const {
        trip,
        removeFromTrip,
        clearTrip,
        updateTripItem,
        saveTripToDatabase,
        loadTripFromDatabase,
        isSyncing
    } = useTrip();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('calendar');
    const [selectedDates, setSelectedDates] = useState({});
    const [dateConflicts, setDateConflicts] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [savedItineraires, setSavedItineraires] = useState([]);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [tripName, setTripName] = useState('Mon voyage à Madagascar');
    const [tripDescription, setTripDescription] = useState('');
    const [showLoadModal, setShowLoadModal] = useState(false);
    const { showSuccess, showError, showWarning, showLoading: showLoadingNotification } = useNotification();

    const currency = localStorage.getItem('userCurrency') || 'EUR';
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        const loadSavedItineraires = async () => {
            if (!userId) return;

            try {
                const response = await api.getItineraires(userId);
                setSavedItineraires(response.data || []);
            } catch (error) {
                console.error('Erreur chargement itinéraires:', error);
            }
        };

        loadSavedItineraires();
    }, [userId]);

    useEffect(() => {
        if (trip.items.length === 0) return;

        const newDates = {};
        let currentDate = new Date();

        trip.items.forEach((item, index) => {
            if (!selectedDates[item.id_site]) {
                const startDate = new Date(currentDate);
                const endDate = new Date(startDate);
                const duration = item.duration || 1;
                endDate.setDate(startDate.getDate() + duration - 1);

                newDates[item.id_site] = {
                    startDate: startDate.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0]
                };

                currentDate = new Date(endDate);
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });

        if (Object.keys(newDates).length > 0) {
            setSelectedDates(prev => ({ ...prev, ...newDates }));
        }
    }, [trip.items, selectedDates]); // ← Ajout de selectedDates aux dépendances

    useEffect(() => {
        const conflicts = {};
        const allDates = [];

        trip.items.forEach(item => {
            const dates = selectedDates[item.id_site];
            if (dates && dates.startDate && dates.endDate) {
                const start = new Date(dates.startDate);
                const end = new Date(dates.endDate);
                const currentDate = new Date(start);

                while (currentDate <= end) {
                    allDates.push({
                        date: currentDate.toISOString().split('T')[0],
                        siteId: item.id_site,
                        siteName: item.nom
                    });
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }
        });

        const dateMap = {};
        allDates.forEach(dateObj => {
            if (!dateMap[dateObj.date]) {
                dateMap[dateObj.date] = [];
            }
            dateMap[dateObj.date].push(dateObj.siteId);
        });

        trip.items.forEach(item => {
            const dates = selectedDates[item.id_site];
            if (dates && dates.startDate && dates.endDate) {
                const start = new Date(dates.startDate);
                const end = new Date(dates.endDate);
                const currentDate = new Date(start);
                let hasConflict = false;
                const conflictSites = [];

                while (currentDate <= end) {
                    const dateStr = currentDate.toISOString().split('T')[0];
                    if (dateMap[dateStr] && dateMap[dateStr].length > 1) {
                        hasConflict = true;
                        dateMap[dateStr].forEach(siteId => {
                            if (siteId !== item.id_site && !conflictSites.includes(siteId)) {
                                conflictSites.push(siteId);
                            }
                        });
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }

                if (hasConflict) {
                    conflicts[item.id_site] = conflictSites;
                }
            }
        });

        setDateConflicts(conflicts);
    }, [selectedDates, trip.items]);

    const calculateTotalCost = () => {
        return trip.items.reduce((total, item) => {
            const cost = parseFloat(item.cout_estime) || 0;
            const days = calculateSiteDuration(item.id_site);
            return total + (cost * days);
        }, 0);
    };

    const calculateTotalDays = () => {
        const uniqueDates = new Set();
        trip.items.forEach(item => {
            const dates = selectedDates[item.id_site];
            if (dates && dates.startDate && dates.endDate) {
                const start = new Date(dates.startDate);
                const end = new Date(dates.endDate);
                const currentDate = new Date(start);

                while (currentDate <= end) {
                    uniqueDates.add(currentDate.toISOString().split('T')[0]);
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }
        });
        return uniqueDates.size;
    };

    const calculateSiteDuration = (siteId) => {
        const dates = selectedDates[siteId];
        if (dates && dates.startDate && dates.endDate) {
            const start = new Date(dates.startDate);
            const end = new Date(dates.endDate);
            return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        }
        return 1;
    };

    const handleDurationChange = (siteId, duration) => {
        const newDuration = Math.max(1, parseInt(duration) || 1);
        updateTripItem(siteId, { duration: newDuration });

        const dates = selectedDates[siteId];
        if (dates && dates.startDate) {
            const startDate = new Date(dates.startDate);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + newDuration - 1);

            setSelectedDates(prev => ({
                ...prev,
                [siteId]: {
                    ...prev[siteId],
                    endDate: endDate.toISOString().split('T')[0]
                }
            }));
        }
    };

    const handleDateChange = (siteId, dateType, date) => {
        setSelectedDates(prev => ({
            ...prev,
            [siteId]: {
                ...prev[siteId],
                [dateType]: date
            }
        }));

        if (dateType === 'startDate') {
            const dates = selectedDates[siteId];
            if (dates && dates.endDate) {
                const startDate = new Date(dates.startDate);
                const endDate = new Date(dates.endDate);
                const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

                const newStartDate = new Date(date);
                const newEndDate = new Date(newStartDate);
                newEndDate.setDate(newStartDate.getDate() + duration - 1);

                setSelectedDates(prev => ({
                    ...prev,
                    [siteId]: {
                        ...prev[siteId],
                        endDate: newEndDate.toISOString().split('T')[0]
                    }
                }));
            }
        }
    };

    const handleNotesChange = (siteId, notes) => {
        updateTripItem(siteId, { notes });
    };

    const generateItinerary = () => {
        const itinerary = trip.items.map((item, index) => {
            const dates = selectedDates[item.id_site];
            const duration = calculateSiteDuration(item.id_site);

            return {
                ...item,
                day: index + 1,
                startDate: dates?.startDate ? new Date(dates.startDate).toLocaleDateString('fr-FR') : 'Non défini',
                endDate: dates?.endDate ? new Date(dates.endDate).toLocaleDateString('fr-FR') : 'Non défini',
                duration: duration,
                hasConflict: !!dateConflicts[item.id_site]
            };
        });

        return itinerary.sort((a, b) => {
            const dateA = selectedDates[a.id_site]?.startDate ? new Date(selectedDates[a.id_site].startDate) : new Date(0);
            const dateB = selectedDates[b.id_site]?.startDate ? new Date(selectedDates[b.id_site].startDate) : new Date(0);
            return dateA - dateB;
        });
    };

    const downloadItinerary = () => {
        const itinerary = generateItinerary();
        const itineraryText = itinerary
            .map(item => `📍 ${item.nom}\n📅 ${item.startDate} - ${item.endDate} (${item.duration} jour(s))\n💶 Coût: ${item.cout_estime} ${currency}\n${item.hasConflict ? '⚠️  Conflit de dates!\n' : ''}`)
            .join('\n---\n');

        const blob = new Blob([itineraryText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'itineraire-madagascar.txt';
        a.click();
        URL.revokeObjectURL(url);

        showSuccess('Itinéraire téléchargé avec succès !', 3000);
    };

    const handleSaveTrip = async () => {
        if (!userId) {
            showWarning('Veuillez vous connecter pour sauvegarder', 3000);
            return;
        }

        if (trip.items.length === 0) {
            showWarning('Votre voyage est vide', 3000);
            return;
        }

        const closeLoading = showLoadingNotification('Sauvegarde du voyage...');
        setIsSaving(true);

        try {
            // CORRECTION : Suppression de la variable 'result' inutilisée
            await saveTripToDatabase(trip, selectedDates, tripName, tripDescription);

            closeLoading();
            showSuccess('Voyage sauvegardé avec succès !', 3000);
            setShowSaveModal(false);

            const response = await api.getItineraires(userId);
            setSavedItineraires(response.data || []);

        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            closeLoading();
            showError('Erreur lors de la sauvegarde', 4000);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLoadTrip = async (itineraireId) => {
        const closeLoading = showLoadingNotification('Chargement du voyage...');
        setIsLoading(true);

        try {
            // CORRECTION : Suppression de la variable 'result' inutilisée
            await loadTripFromDatabase(itineraireId);

            // Note: loadTripFromDatabase modifie probablement le contexte directement
            // Si vous avez besoin de récupérer les données, modifiez la fonction
            // pour retourner les données nécessaires

            closeLoading();
            showSuccess('Voyage chargé avec succès !', 3000);
            setShowLoadModal(false);
        } catch (error) {
            console.error('Erreur chargement:', error);
            closeLoading();
            showError('Erreur lors du chargement', 4000);
        } finally {
            setIsLoading(false);
        }
    };


    const handleDeleteTrip = async (itineraireId) => {
        if (!window.confirm('Voulez-vous vraiment supprimer cet itinéraire ?')) {
            return;
        }

        const closeLoading = showLoadingNotification('Suppression en cours...');

        try {
            await api.deleteItineraire(itineraireId);
            closeLoading();
            showSuccess('Itinéraire supprimé', 3000);

            const response = await api.getItineraires(userId);
            setSavedItineraires(response.data || []);

        } catch (error) {
            console.error('Erreur suppression:', error);
            closeLoading();
            showError('Erreur lors de la suppression', 4000);
        }
    };

    const getDateSuggestions = () => {
        const suggestions = [];
        const today = new Date();

        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        suggestions.push(nextWeek.toISOString().split('T')[0]);

        const nextSaturday = new Date(today);
        const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
        nextSaturday.setDate(today.getDate() + daysUntilSaturday);
        suggestions.push(nextSaturday.toISOString().split('T')[0]);

        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        suggestions.push(nextMonth.toISOString().split('T')[0]);

        return suggestions;
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    if (trip.items.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <button className={styles.backButton} onClick={() => navigate(-1)}>
                        <i className="fas fa-arrow-left"></i> Retour
                    </button>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>Mon Voyage à Madagascar</h1>
                        <p className={styles.subtitle}>Planifiez votre aventure à travers l'île</p>
                    </div>
                </div>

                <div className={styles.emptyTrip}>
                    <div className={styles.emptyIcon}>
                        <i className="fas fa-suitcase-rolling"></i>
                    </div>
                    <h2 className={styles.emptyTitle}>Votre voyage est vide</h2>
                    <p className={styles.emptyDescription}>Commencez par ajouter des sites touristiques à votre voyage</p>

                    <div className={styles.emptyActions}>
                        <Link to="/search" className={styles.exploreButton}>
                            <i className="fas fa-search"></i> Explorer les sites
                        </Link>

                        {userId && savedItineraires.length > 0 && (
                            <button
                                className={styles.loadTripButton}
                                onClick={() => setShowLoadModal(true)}
                            >
                                <i className="fas fa-folder-open"></i> Charger un voyage
                            </button>
                        )}
                    </div>
                </div>

                {showLoadModal && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalContent}>
                            <div className={styles.modalHeader}>
                                <h3>Charger un voyage</h3>
                                <button className={styles.modalClose} onClick={() => setShowLoadModal(false)}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className={styles.modalBody}>
                                {savedItineraires.length === 0 ? (
                                    <p>Aucun voyage sauvegardé</p>
                                ) : (
                                    <div className={styles.savedItinerairesList}>
                                        {savedItineraires.map(itineraire => (
                                            <div key={itineraire.id_itineraire} className={styles.itineraireItem}>
                                                <div className={styles.itineraireInfo}>
                                                    <h4>{itineraire.nom}</h4>
                                                    <p>{itineraire.nombre_sites || 0} sites • {itineraire.duree_total || 0} jours</p>
                                                    <small>Modifié le {new Date(itineraire.date_modification).toLocaleDateString('fr-FR')}</small>
                                                </div>
                                                <div className={styles.itineraireActions}>
                                                    <button
                                                        className={styles.loadBtn}
                                                        onClick={() => handleLoadTrip(itineraire.id_itineraire)}
                                                        disabled={isLoading}
                                                    >
                                                        {isLoading ? 'Chargement...' : 'Charger'}
                                                    </button>
                                                    <button
                                                        className={styles.deleteBtn}
                                                        onClick={() => handleDeleteTrip(itineraire.id_itineraire)}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const itinerary = generateItinerary();
    const dateSuggestions = getDateSuggestions();

    return (
        <div className={styles.container}>
            {showSaveModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>Sauvegarder le voyage</h3>
                            <button className={styles.modalClose} onClick={() => setShowSaveModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.modalFormGroup}>
                                <label>Nom du voyage</label>
                                <input
                                    type="text"
                                    value={tripName}
                                    onChange={(e) => setTripName(e.target.value)}
                                    placeholder="Mon voyage à Madagascar"
                                    className={styles.modalInput}
                                />
                            </div>
                            <div className={styles.modalFormGroup}>
                                <label>Description</label>
                                <textarea
                                    value={tripDescription}
                                    onChange={(e) => setTripDescription(e.target.value)}
                                    placeholder="Description de votre voyage..."
                                    rows="3"
                                    className={styles.modalTextarea}
                                />
                            </div>
                            <div className={styles.modalFormGroup}>
                                <label>Statistiques</label>
                                <div className={styles.statsSummary}>
                                    <span><i className="fas fa-map-marker-alt"></i> {trip.items.length} sites</span>
                                    <span><i className="fas fa-clock"></i> {calculateTotalDays()} jours</span>
                                    <span><i className="fas fa-tag"></i> {calculateTotalCost().toFixed(0)} {currency}</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setShowSaveModal(false)}
                            >
                                Annuler
                            </button>
                            <button
                                className={styles.saveBtn}
                                onClick={handleSaveTrip}
                                disabled={isSaving || !tripName.trim()}
                            >
                                {isSaving ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i> Sauvegarde...
                                    </>
                                ) : (
                                    'Sauvegarder'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.header}>
                <button className={styles.backButton} onClick={() => navigate(-1)}>
                    <i className="fas fa-arrow-left"></i> Retour
                </button>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>{tripName}</h1>
                    <p className={styles.subtitle}>Planifiez votre aventure à travers l'île</p>
                </div>
                <div className={styles.headerActions}>
                    {isSyncing && (
                        <span className={styles.syncStatus}>
                            <i className="fas fa-sync fa-spin"></i> Synchronisation...
                        </span>
                    )}
                </div>
            </div>

            <div className={styles.tripContent}>
                <div className={styles.tripSidebar}>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryHeader}>
                            <i className="fas fa-chart-pie"></i>
                            <h3 className={styles.summaryTitle}>Résumé du voyage</h3>
                        </div>
                        <div className={styles.summaryStats}>
                            <div className={styles.stat}>
                                <div className={styles.statIcon}>
                                    <i className="fas fa-map-marker-alt"></i>
                                </div>
                                <div className={styles.statContent}>
                                    <span className={styles.statNumber}>{trip.items.length}</span>
                                    <span className={styles.statLabel}>sites</span>
                                </div>
                            </div>
                            <div className={styles.stat}>
                                <div className={styles.statIcon}>
                                    <i className="fas fa-clock"></i>
                                </div>
                                <div className={styles.statContent}>
                                    <span className={styles.statNumber}>{calculateTotalDays()}</span>
                                    <span className={styles.statLabel}>jours</span>
                                </div>
                            </div>
                            <div className={styles.stat}>
                                <div className={styles.statIcon}>
                                    <i className="fas fa-tag"></i>
                                </div>
                                <div className={styles.statContent}>
                                    <span className={styles.statNumber}>{calculateTotalCost().toFixed(0)}</span>
                                    <span className={styles.statLabel}>{currency} estimés</span>
                                </div>
                            </div>
                            <div className={styles.stat}>
                                <div className={styles.statIcon}>
                                    <i className="fas fa-exclamation-triangle"></i>
                                </div>
                                <div className={styles.statContent}>
                                    <span className={styles.statNumber}>{Object.keys(dateConflicts).length}</span>
                                    <span className={styles.statLabel}>conflits</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.summaryActions}>
                            <button className={styles.downloadBtn} onClick={downloadItinerary}>
                                <i className="fas fa-download"></i> Télécharger
                            </button>
                            {userId && (
                                <button
                                    className={styles.saveDbBtn}
                                    onClick={() => setShowSaveModal(true)}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <i className="fas fa-spinner fa-spin"></i>
                                    ) : (
                                        <i className="fas fa-save"></i>
                                    )}
                                    Sauvegarder
                                </button>
                            )}
                            <button className={styles.clearTripBtn} onClick={clearTrip}>
                                <i className="fas fa-trash"></i> Vider le voyage
                            </button>
                        </div>
                    </div>

                    <div className={styles.quickTips}>
                        <div className={styles.tipsHeader}>
                            <i className="fas fa-lightbulb"></i>
                            <h4 className={styles.tipsTitle}>Conseils de planification</h4>
                        </div>
                        <ul className={styles.tipsList}>
                            <li className={styles.tipsListItem}><i className="fas fa-check-circle"></i> Évitez les conflits de dates</li>
                            <li className={styles.tipsListItem}><i className="fas fa-check-circle"></i> Prévoyez du temps pour les transports</li>
                            <li className={styles.tipsListItem}><i className="fas fa-check-circle"></i> Vérifiez les saisons touristiques</li>
                            <li className={styles.tipsListItem}><i className="fas fa-calendar-alt"></i> Dates suggérées: {dateSuggestions.map(d => new Date(d).toLocaleDateString('fr-FR')).join(', ')}</li>
                        </ul>
                    </div>

                    {userId && savedItineraires.length > 0 && (
                        <div className={styles.savedItineraires}>
                            <div className={styles.savedHeader}>
                                <i className="fas fa-history"></i>
                                <h4 className={styles.savedTitle}>Vos voyages sauvegardés</h4>
                            </div>
                            <div className={styles.savedList}>
                                {savedItineraires.slice(0, 3).map(itineraire => (
                                    <div key={itineraire.id_itineraire} className={styles.savedItem}>
                                        <div className={styles.savedItemInfo}>
                                            <h5>{itineraire.nom}</h5>
                                            <p>{itineraire.nombre_sites} sites • {itineraire.duree_total} jours</p>
                                        </div>
                                        <button
                                            className={styles.loadSmallBtn}
                                            onClick={() => handleLoadTrip(itineraire.id_itineraire)}
                                        >
                                            <i className="fas fa-upload"></i>
                                        </button>
                                    </div>
                                ))}
                                {savedItineraires.length > 3 && (
                                    <button
                                        className={styles.viewMoreBtn}
                                        onClick={() => setShowLoadModal(true)}
                                    >
                                        <i className="fas fa-eye"></i> Voir tous ({savedItineraires.length})
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.tripMain}>
                    <div className={styles.tabs}>
                        <button
                            className={clsx(styles.tab, { [styles.tabActive]: activeTab === 'calendar' })}
                            onClick={() => setActiveTab('calendar')}
                        >
                            <div className={styles.tabIcon}>
                                <i className="fas fa-calendar-alt"></i>
                            </div>
                            <span>Calendrier</span>
                        </button>
                        <button
                            className={clsx(styles.tab, { [styles.tabActive]: activeTab === 'itinerary' })}
                            onClick={() => setActiveTab('itinerary')}
                        >
                            <div className={styles.tabIcon}>
                                <i className="fas fa-route"></i>
                            </div>
                            <span>Itinéraire</span>
                        </button>
                        <button
                            className={clsx(styles.tab, { [styles.tabActive]: activeTab === 'details' })}
                            onClick={() => setActiveTab('details')}
                        >
                            <div className={styles.tabIcon}>
                                <i className="fas fa-list"></i>
                            </div>
                            <span>Détails</span>
                        </button>
                    </div>

                    {activeTab === 'calendar' && (
                        <div className={styles.calendarView}>
                            <div className={styles.viewHeader}>
                                <h2 className={styles.viewTitle}>Planification du Calendrier</h2>
                                <p className={styles.viewDescription}>
                                    Choisissez librement les dates pour chaque site. Les conflits seront signalés en rouge.
                                </p>
                            </div>

                            <div className={styles.calendarItems}>
                                {trip.items.map((item) => {
                                    const dates = selectedDates[item.id_site];
                                    const hasConflict = dateConflicts[item.id_site];
                                    const duration = calculateSiteDuration(item.id_site);
                                    const dateInputClass = clsx(
                                        styles.dateInput,
                                        { [styles.dateInputError]: hasConflict }
                                    );

                                    return (
                                        <div key={item.id_site} className={clsx(
                                            styles.calendarItem,
                                            { [styles.calendarItemHasConflict]: hasConflict }
                                        )}>
                                            <div className={styles.calendarItemHeader}>
                                                <div className={styles.itemTitleSection}>
                                                    <h3>{item.nom}</h3>
                                                    <span className={styles.itemTypeBadge}>{item.type}</span>
                                                </div>
                                                {hasConflict && (
                                                    <span className={styles.conflictBadge}>
                                                        <i className="fas fa-exclamation-triangle"></i> Conflit de dates
                                                    </span>
                                                )}
                                            </div>

                                            <div className={styles.calendarControls}>
                                                <div className={styles.dateControls}>
                                                    <div className={styles.dateInputGroup}>
                                                        <label>Date de début:</label>
                                                        <input
                                                            type="date"
                                                            value={dates?.startDate || ''}
                                                            onChange={(e) => handleDateChange(item.id_site, 'startDate', e.target.value)}
                                                            className={dateInputClass}
                                                            min={new Date().toISOString().split('T')[0]}
                                                        />
                                                    </div>

                                                    <div className={styles.dateInputGroup}>
                                                        <label>Date de fin:</label>
                                                        <input
                                                            type="date"
                                                            value={dates?.endDate || ''}
                                                            onChange={(e) => handleDateChange(item.id_site, 'endDate', e.target.value)}
                                                            className={dateInputClass}
                                                            min={dates?.startDate || new Date().toISOString().split('T')[0]}
                                                        />
                                                    </div>

                                                    <div className={styles.durationDisplay}>
                                                        <i className="fas fa-clock"></i>
                                                        <span>{duration} jour(s)</span>
                                                    </div>
                                                </div>

                                                <div className={styles.durationControl}>
                                                    <label>Durée (jours):</label>
                                                    <div className={styles.durationInputWrapper}>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="30"
                                                            value={item.duration || 1}
                                                            onChange={(e) => handleDurationChange(item.id_site, e.target.value)}
                                                        />
                                                        <span className={styles.durationUnit}>jours</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {hasConflict && (
                                                <div className={styles.conflictInfo}>
                                                    <div className={styles.conflictHeader}>
                                                        <i className="fas fa-exclamation-circle"></i>
                                                        <strong>Conflit avec:</strong>
                                                    </div>
                                                    <div className={styles.conflictSites}>
                                                        {dateConflicts[item.id_site].map(conflictSiteId => {
                                                            const conflictSite = trip.items.find(s => s.id_site === conflictSiteId);
                                                            return conflictSite ? (
                                                                <span key={conflictSiteId} className={styles.conflictSite}>
                                                                    {conflictSite.nom}
                                                                </span>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {dates?.startDate && dates?.endDate && !hasConflict && (
                                                <div className={styles.dateSummary}>
                                                    <i className="fas fa-calendar-check"></i>
                                                    <span>Réservé du {formatDateForInput(dates.startDate)} au {formatDateForInput(dates.endDate)}</span>
                                                </div>
                                            )}

                                            <button
                                                className={styles.removeItemBtn}
                                                onClick={() => removeFromTrip(item.id_site)}
                                                title="Retirer du voyage"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'itinerary' && (
                        <div className={styles.itineraryView}>
                            <div className={styles.viewHeader}>
                                <h2 className={styles.viewTitle}>Votre Itinéraire</h2>
                                <p className={styles.viewDescription}>
                                    Visualisez votre voyage jour par jour
                                </p>
                            </div>
                            <div className={styles.itineraryTimeline}>
                                {itinerary.map((item, index) => (
                                    <div key={item.id_site} className={clsx(
                                        styles.timelineItem,
                                        { [styles.calendarItemHasConflict]: item.hasConflict }
                                    )}>
                                        <div className={styles.timelineMarker}>
                                            <div className={styles.dayNumber}>Jour {item.day}</div>
                                            <div className={clsx(
                                                styles.timelineDot,
                                                { [styles.timelineDotConflict]: item.hasConflict }
                                            )}>
                                                {item.hasConflict ? (
                                                    <i className="fas fa-exclamation"></i>
                                                ) : (
                                                    <i className="fas fa-check"></i>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.timelineContent}>
                                            <div className={clsx(
                                                styles.timelineCard,
                                                { [styles.timelineCardConflict]: item.hasConflict }
                                            )}>
                                                <div className={styles.timelineImage}>
                                                    <img
                                                        src={`${process.env.REACT_APP_BACK_URL}${item.image}`}
                                                        alt={item.nom}
                                                        onError={(e) => {
                                                            e.target.src = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80';
                                                        }}
                                                    />
                                                </div>
                                                <div className={styles.timelineInfo}>
                                                    <div className={styles.timelineHeader}>
                                                        <h3>{item.nom}</h3>
                                                        <span className={styles.timelineItemType}>{item.type}</span>
                                                    </div>
                                                    <div className={styles.timelineDetails}>
                                                        <div className={styles.detailItem}>
                                                            <i className="fas fa-calendar"></i>
                                                            <span>{item.startDate} {item.duration > 1 && `- ${item.endDate}`}</span>
                                                        </div>
                                                        <div className={styles.detailItem}>
                                                            <i className="fas fa-clock"></i>
                                                            <span>{item.duration} jour(s)</span>
                                                        </div>
                                                        <div className={styles.detailItem}>
                                                            <i className="fas fa-tag"></i>
                                                            <span>{item.cout_estime} {currency}</span>
                                                        </div>
                                                    </div>
                                                    {item.hasConflict && (
                                                        <div className={styles.conflictWarning}>
                                                            <i className="fas fa-exclamation-triangle"></i>
                                                            <span>Conflit de dates détecté</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'details' && (
                        <div className={styles.detailsView}>
                            <div className={styles.viewHeader}>
                                <h2 className={styles.viewTitle}>Détails des Sites</h2>
                                <p className={styles.viewDescription}>
                                    Gérez les détails et notes pour chaque site
                                </p>
                            </div>
                            <div className={styles.tripItemsGrid}>
                                {trip.items.map((item) => {
                                    const hasConflict = dateConflicts[item.id_site];
                                    const dates = selectedDates[item.id_site];

                                    return (
                                        <div key={item.id_site} className={clsx(
                                            styles.tripItemDetail,
                                            { [styles.tripItemDetailHasConflict]: hasConflict }
                                        )}>
                                            <div className={styles.detailImage}>
                                                <img
                                                    src={`${process.env.REACT_APP_BACK_URL}${item.image}`}
                                                    alt={item.nom}
                                                    onError={(e) => {
                                                        e.target.src = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80';
                                                    }}
                                                />
                                            </div>
                                            <div className={styles.detailContent}>
                                                <div className={styles.detailHeader}>
                                                    <h3>{item.nom}</h3>
                                                    <span className={styles.detailItemType}>{item.type}</span>
                                                </div>

                                                <div className={styles.detailMeta}>
                                                    <div className={styles.metaItem}>
                                                        <i className="fas fa-tag"></i>
                                                        <span>Coût estimé: {item.cout_estime} {currency}</span>
                                                    </div>
                                                    {dates && (
                                                        <div className={styles.metaItem}>
                                                            <i className="fas fa-calendar"></i>
                                                            <span>{dates.startDate ? formatDateForInput(dates.startDate) : 'Non défini'} - {dates.endDate ? formatDateForInput(dates.endDate) : 'Non défini'}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={styles.detailControls}>
                                                    <div className={styles.durationControl}>
                                                        <label>Durée (jours):</label>
                                                        <div className={styles.durationInputWrapper}>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max="30"
                                                                value={item.duration || 1}
                                                                onChange={(e) => handleDurationChange(item.id_site, e.target.value)}
                                                            />
                                                            <span className={styles.durationUnit}>jours</span>
                                                        </div>
                                                    </div>

                                                    <div className={styles.notesControl}>
                                                        <label>Notes personnelles:</label>
                                                        <textarea
                                                            placeholder="Ajoutez des notes, conseils, ou rappels pour ce site..."
                                                            value={item.notes || ''}
                                                            onChange={(e) => handleNotesChange(item.id_site, e.target.value)}
                                                            rows="3"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                className={styles.removeItemBtn}
                                                onClick={() => removeFromTrip(item.id_site)}
                                                title="Retirer du voyage"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TripPage;