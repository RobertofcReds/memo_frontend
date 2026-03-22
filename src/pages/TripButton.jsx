import React, { useState, useEffect } from 'react';
import { useTrip } from './TripContext';
import clsx from 'clsx';
import styles from './css/TripButton.module.css';
import { logHistoryAction } from '../api';
import { useAuth } from '../context/AuthContext';

const TripButton = ({ site }) => {
    const { trip, addToTrip, removeFromTrip, isSyncing } = useTrip();
    const [isLoading, setIsLoading] = useState(false);
    const [isInTrip, setIsInTrip] = useState(false);

    const {user} = useAuth();
    
    const token = localStorage.getItem('token');

    // Mettre à jour l'état local quand le trip change
    useEffect(() => {
        setIsInTrip(trip.items.some(item => item.id_site === site.id_site));
    }, [trip.items, site.id_site]);

    // const logTripAction = async (actionType, site) => {
    //     try {

    //         if (!userId || !token) return;

    //         await api.post('/api/user/history/log', {
    //             userId: parseInt(userId),
    //             type: actionType,
    //             criteres: '',
    //             resultats: '',
    //             entityId: site.id_site,
    //             entityName: site.nom,
    //             actionDetails: {}
    //         }, {
    //             headers: { Authorization: `Bearer ${token}` }
    //         });
    //     } catch (error) {
    //         console.error(`❌ Erreur enregistrement historique:`, error);
    //     }
    // };

    const handleClick = async () => {
        setIsLoading(true);

        try {
            if (isInTrip) {
                removeFromTrip(site.id_site);
                await logHistoryAction(user?.id, 'remove_from_trip', {} ,site.id_site, site.nom);
            } else {
                addToTrip(site);
                await logHistoryAction(user?.id, 'add_to_trip', {} ,site.id_site, site.nom);
            }
        } catch (error) {
            console.error('❌ Erreur action voyage:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const buttonClasses = clsx(
        styles.button,
        { [styles.inTrip]: isInTrip },
        { [styles.loading]: isLoading || isSyncing }
    );

    return (
        <button
            className={buttonClasses}
            onClick={handleClick}
            title={isInTrip ? 'Retirer du voyage' : 'Ajouter à mon voyage'}
            disabled={isLoading || isSyncing}
        >
            {isLoading || isSyncing ? (
                <i className="fas fa-spinner fa-spin"></i>
            ) : (
                <i className={isInTrip ? 'fas fa-check-circle' : 'fas fa-plus-circle'}></i>
            )}
            {isLoading || isSyncing ? 'Chargement...' : (isInTrip ? 'Dans mon voyage' : 'Ajouter à mon voyage')}
        </button>
    );
};

export default TripButton;