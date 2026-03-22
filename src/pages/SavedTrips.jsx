import React, { useState, useEffect } from 'react';
import api from '../api';
import { useTrip } from './TripContext';
import { useNotification } from '../components/Notification/NotificationProvider';

const SavedTrips = () => {
    const [savedTrips, setSavedTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const { loadTripFromDatabase } = useTrip();
    const userId = localStorage.getItem('userId');
    
    // Utilisation du hook de notification
    const { showSuccess, showError, showWarning } = useNotification();

    useEffect(() => {
        if (userId) {
            loadSavedTrips();
        }
    }, [userId]);

    const loadSavedTrips = async () => {
        try {
            const response = await api.getItineraires(userId);
            setSavedTrips(response.data || []);
        } catch (error) {
            console.error('Erreur chargement voyages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadTrip = async (itineraireId) => {
        try {
            await loadTripFromDatabase(itineraireId);
            showSuccess('Voyage chargé avec succès !');
        } catch (error) {
            console.error('Erreur chargement:', error);
            showError('Erreur lors du chargement');
        }
    };

    const handleDeleteTrip = async (itineraireId) => {
        if (window.confirm('Supprimer ce voyage ?')) {
            try {
                await api.deleteItineraire(itineraireId);
                setSavedTrips(prev => prev.filter(t => t.id_itineraire !== itineraireId));
                showSuccess('Voyage supprimé avec succès');
            } catch (error) {
                console.error('Erreur suppression:', error);
                showError('Erreur lors de la suppression');
            }
        }
    };

    if (!userId) {
        return (
            <div className="saved-trips-container">
                <p>Connectez-vous pour voir vos voyages sauvegardés</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="saved-trips-container">
                <p>Chargement des voyages...</p>
            </div>
        );
    }

    return (
        <div className="saved-trips-container">
            <h3>Mes voyages sauvegardés</h3>

            {savedTrips.length === 0 ? (
                <p>Aucun voyage sauvegardé</p>
            ) : (
                <div className="trips-list">
                    {savedTrips.map(trip => (
                        <div key={trip.id_itineraire} className="trip-card">
                            <div className="trip-info">
                                <h4>{trip.nom}</h4>
                                <p className="trip-stats">
                                    {trip.nombre_sites} sites • {trip.duree_total} jours • {trip.cout_total} {trip.devise}
                                </p>
                                <p className="trip-date">
                                    Modifié le {new Date(trip.date_modification).toLocaleDateString('fr-FR')}
                                </p>
                            </div>
                            <div className="trip-actions">
                                <button
                                    className="load-btn"
                                    onClick={() => handleLoadTrip(trip.id_itineraire)}
                                >
                                    Charger
                                </button>
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteTrip(trip.id_itineraire)}
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SavedTrips;