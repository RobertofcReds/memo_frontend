import axios from "axios";


const api = axios.create({
    baseURL: process.env.REACT_APP_BACK_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Intercepteur pour ajouter le token à toutes les requêtes
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les erreurs globalement
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            console.error('❌ Erreur API:', {
                status: error.response.status,
                url: error.config.url,
                message: error.response.data?.message || 'Erreur serveur'
            });

            if (error.response.status === 401) {
                console.warn('⚠️ Token expiré ou invalide');
            }
        } else if (error.request) {
            console.error('❌ Pas de réponse du serveur:', error.request);
        } else {
            console.error('❌ Erreur de configuration:', error.message);
        }

        return Promise.reject(error);
    }
);

// Fonctions pour l'admin
export const getAdminUsers = () => {
    return api.get('/admin/users');
};

export const createSite = (siteData) => {
    return api.post('/admin/sites', siteData);
};

export const updateSite = (id, siteData) => {
    return api.put(`/admin/sites/${id}`, siteData);
};

export const deleteSite = (id) => {
    return api.delete(`/admin/sites/${id}`);
};

// Fonctions pour les favoris - MODIFIÉES
export const getFavorites = (userId) => {
    return api.get(`/api/user/favorites/${userId}`);
};

export const addFavorite = async (userId, favoriteData) => {
    // Le backend s'attend à { updatedFavorites: { ... } }
    console.log(favoriteData)
    await logHistoryAction(userId, 'add_favorite', {} ,favoriteData.entite_id, favoriteData.nom);
    return api.post(`/api/user/favorites/${userId}`, {
        updatedFavorites: favoriteData
    });
};

export const removeFavorite = (userId, entite_id, type = 'site') => {
    return api.delete(`/api/user/favorites/${userId}`, {
        params: {
            userId: userId,
            entite_id: entite_id,
            type: type
        }
    });
};

// Fonctions pour les avis
export const getReviews = (userId) => {
    return api.get(`/api/user/reviews/${userId}`);
};

export const addReview = (reviewData) => {
    return api.post('/api/user/review', reviewData);
};

export const deleteReview = (reviewId) => {
    return api.delete(`/api/user/review/${reviewId}`);
};

// ============ NOUVELLES FONCTIONS POUR L'HISTORIQUE ============

// Fonctions pour l'historique
export const getHistory = (userId) => {
    return api.get(`/api/user/history/${userId}`);
};

export const clearHistory = (userId) => {
    return api.delete(`/api/user/history/${userId}`);
};

export const deleteHistoryItem = (itemId) => {
    return api.delete(`/api/user/history/item/${itemId}`);
};

// export const logHistoryAction = (historyData) => {
//     return api.post('/api/user/history/log', historyData);
// };

export const logHistoryAction = async (userId, actionType, details = {}, entityId, entityName) => {
        try {
            if (!userId) return;
            console.log({userId, actionType, details, entityId, entityName})

            await api.post('/api/user/history/log', {
                userId: parseInt(userId),
                type: actionType,
                criteres: '',
                resultats: '',
                entityId: parseInt(entityId),
                entityName: entityName,
                actionDetails: details
            });

            console.log(`✅ Action "${actionType}" enregistrée dans l'historique`);
        } catch (error) {
            console.error(`❌ Erreur lors de l'enregistrement de l'action "${actionType}":`, error);
        }
    };

// ============ FONCTIONS POUR LES ITINERAIRES ============

// Récupérer tous les itinéraires d'un utilisateur
export const getItineraires = (userId) => {
    return api.get(`/api/user/itineraires/${userId}`);
};

// Récupérer un itinéraire spécifique
export const getItineraire = (id) => {
    return api.get(`/api/user/itineraire/${id}`);
};

// Créer un nouvel itinéraire
export const createItineraire = (itineraireData) => {
    return api.post('/api/user/itineraire', itineraireData);
};

// Mettre à jour un itinéraire
export const updateItineraire = (id, itineraireData) => {
    return api.put(`/api/user/itineraire/${id}`, itineraireData);
};

// Supprimer un itinéraire
export const deleteItineraire = (id) => {
    return api.delete(`/api/user/itineraire/${id}`);
};

// Ajouter un site à un itinéraire
export const addSiteToItineraire = (itineraireId, siteData) => {
    return api.post(`/api/user/itineraire/${itineraireId}/sites`, siteData);
};

// Mettre à jour un site dans un itinéraire
export const updateSiteInItineraire = (itineraireId, siteId, siteData) => {
    return api.put(`/api/user/itineraire/${itineraireId}/sites/${siteId}`, siteData);
};

// Supprimer un site d'un itinéraire
export const removeSiteFromItineraire = (itineraireId, siteId) => {
    return api.delete(`/api/user/itineraire/${itineraireId}/sites/${siteId}`);
};

// Sauvegarder l'itinéraire actuel
export const saveCurrentItineraire = (itineraireData) => {
    return api.post('/api/user/itineraire/save-current', itineraireData);
};

// Synchroniser le localStorage avec la BDD
export const syncItineraire = (syncData) => {
    return api.post('/api/user/itineraire/sync', syncData);
};

// Récupérer les statistiques de l'utilisateur
export const getUserStats = (userId) => {
    return api.get(`/api/user/stats/${userId}`);
};

// Alternative : Attachez les fonctions directement à l'instance api
api.getItineraires = getItineraires;
api.getItineraire = getItineraire;
api.createItineraire = createItineraire;
api.updateItineraire = updateItineraire;
api.deleteItineraire = deleteItineraire;
api.saveCurrentItineraire = saveCurrentItineraire;
api.syncItineraire = syncItineraire;

export default api;