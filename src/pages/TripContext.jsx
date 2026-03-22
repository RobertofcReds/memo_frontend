import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../api';

const TripContext = createContext();

const tripReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_TO_TRIP':
            if (state.items.some(item => item.id_site === action.payload.id_site)) {
                return state;
            }
            return {
                ...state,
                items: [...state.items, {
                    ...action.payload,
                    addedAt: new Date().toISOString(),
                    duration: action.payload.duration || 1,
                    notes: action.payload.notes || ''
                }]
            };
        case 'REMOVE_FROM_TRIP':
            return {
                ...state,
                items: state.items.filter(item => item.id_site !== action.payload)
            };
        case 'CLEAR_TRIP':
            return {
                ...state,
                items: []
            };
        case 'UPDATE_TRIP_ITEM':
            return {
                ...state,
                items: state.items.map(item =>
                    item.id_site === action.payload.id_site
                        ? { ...item, ...action.payload.updates }
                        : item
                )
            };
        case 'SET_TRIP':
            return {
                ...state,
                ...action.payload
            };
        case 'SET_CURRENT_ITINERAIRE':
            return {
                ...state,
                currentItineraireId: action.payload
            };
        default:
            return state;
    }
};

const loadFromLocalStorage = () => {
    try {
        const saved = localStorage.getItem('madatour_trip');
        return saved ? JSON.parse(saved) : { items: [] };
    } catch (error) {
        console.error('Erreur lors du chargement du localStorage:', error);
        return { items: [] };
    }
};

const saveToLocalStorage = (trip) => {
    try {
        localStorage.setItem('madatour_trip', JSON.stringify(trip));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde dans le localStorage:', error);
    }
};

const syncWithDatabase = async (trip, userId) => {
    try {
        if (!userId) return;

        const response = await api.syncItineraire({
            userId: parseInt(userId),
            tripData: trip
        });

        if (response.data.success) {
            return response.data.id_itineraire;
        }
    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation:', error);
    }
    return null;
};

const TripProvider = ({ children }) => {
    const [trip, dispatch] = useReducer(tripReducer, loadFromLocalStorage());
    const [isSyncing, setIsSyncing] = React.useState(false);

    useEffect(() => {
        saveToLocalStorage(trip);
    }, [trip]);

    useEffect(() => {
        const syncTrip = async () => {
            const userId = localStorage.getItem('userId');
            if (userId && trip.items.length > 0 && !isSyncing) {
                setIsSyncing(true);
                try {
                    const itineraireId = await syncWithDatabase(trip, userId);
                    if (itineraireId) {
                        dispatch({
                            type: 'SET_CURRENT_ITINERAIRE',
                            payload: itineraireId
                        });
                    }
                } finally {
                    setIsSyncing(false);
                }
            }
        };

        const timeoutId = setTimeout(() => {
            syncTrip();
        }, 2000);

        return () => clearTimeout(timeoutId);
    }, [trip.items, isSyncing]);

    const addToTrip = async (site) => {
        dispatch({ type: 'ADD_TO_TRIP', payload: site });

        try {
            const userId = localStorage.getItem('userId');
            const token = localStorage.getItem('token');

            if (userId && token) {
                await api.post('/api/user/history/log', {
                    userId: parseInt(userId),
                    type: 'add_to_trip',
                    criteres: `Ajout au voyage: ${site.nom}`,
                    resultats: 'Site ajouté à "Mon Voyage"',
                    entityId: site.id_site,
                    entityName: site.nom,
                    actionDetails: {}
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (error) {
            console.error('Erreur historique:', error);
        }
    };

    const removeFromTrip = async (siteId) => {
        dispatch({ type: 'REMOVE_FROM_TRIP', payload: siteId });

        try {
            const userId = localStorage.getItem('userId');
            const token = localStorage.getItem('token');
            const site = trip.items.find(item => item.id_site === siteId);

            if (userId && token && site) {
                await api.post('/api/user/history/log', {
                    userId: parseInt(userId),
                    type: 'remove_from_trip',
                    criteres: `Retrait du voyage: ${site.nom}`,
                    resultats: 'Site retiré de "Mon Voyage"',
                    entityId: site.id_site,
                    entityName: site.nom,
                    actionDetails: {}
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (error) {
            console.error('Erreur historique:', error);
        }
    };

    const clearTrip = async () => {
        dispatch({ type: 'CLEAR_TRIP' });

        try {
            const userId = localStorage.getItem('userId');
            const token = localStorage.getItem('token');

            if (userId && token) {
                await api.post('/api/user/history/log', {
                    userId: parseInt(userId),
                    type: 'clear_trip',
                    criteres: 'Voyage vidé',
                    resultats: 'Tous les sites retirés',
                    entityId: null,
                    entityName: null,
                    actionDetails: {}
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (error) {
            console.error('Erreur historique:', error);
        }
    };

    const updateTripItem = (siteId, updates) => {
        dispatch({ type: 'UPDATE_TRIP_ITEM', payload: { id_site: siteId, updates } });
    };

    const setTrip = (tripData) => {
        dispatch({ type: 'SET_TRIP', payload: tripData });
    };

    const saveTripToDatabase = async (tripData, selectedDates, nom, description) => {
        try {
            const userId = localStorage.getItem('userId');
            const token = localStorage.getItem('token');

            if (!userId || !token) {
                throw new Error('Utilisateur non connecté');
            }

            const response = await api.saveCurrentItineraire({
                userId: parseInt(userId),
                items: tripData.items,
                nom: nom || 'Mon voyage à Madagascar',
                description: description || '',
                selectedDates: selectedDates,
                devise: localStorage.getItem('userCurrency') || 'EUR'
            });

            if (response.data.success) {
                dispatch({
                    type: 'SET_CURRENT_ITINERAIRE',
                    payload: response.data.id_itineraire
                });
                return response.data;
            }
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
            throw error;
        }
    };

    const loadTripFromDatabase = async (itineraireId) => {
        try {
            const response = await api.getItineraire(itineraireId);
            const itineraire = response.data;

            const tripData = {
                items: itineraire.sites.map(site => ({
                    id_site: site.id_site,
                    nom: site.site.nom,
                    description: site.site.description,
                    image: site.site.image,
                    cout_estime: site.site.cout_estime,
                    duration: site.duree_jours,
                    notes: site.notes,
                    addedAt: new Date().toISOString()
                })),
                currentItineraireId: itineraire.id_itineraire
            };

            dispatch({ type: 'SET_TRIP', payload: tripData });

            const selectedDates = {};
            itineraire.sites.forEach(site => {
                if (site.date_debut && site.date_fin) {
                    selectedDates[site.id_site] = {
                        startDate: site.date_debut,
                        endDate: site.date_fin
                    };
                }
            });

            return {
                trip: tripData,
                selectedDates,
                nom: itineraire.nom,
                description: itineraire.description
            };
        } catch (error) {
            console.error('❌ Erreur lors du chargement:', error);
            throw error;
        }
    };

    return (
        <TripContext.Provider value={{
            trip,
            addToTrip,
            removeFromTrip,
            clearTrip,
            updateTripItem,
            setTrip,
            saveTripToDatabase,
            loadTripFromDatabase,
            isSyncing
        }}>
            {children}
        </TripContext.Provider>
    );
};

export const useTrip = () => {
    const context = useContext(TripContext);
    if (!context) {
        throw new Error('useTrip must be used within a TripProvider');
    }
    return context;
};

export default TripProvider;