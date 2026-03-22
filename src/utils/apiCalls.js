import api from "../api";

    
    const { token, userId } = localStorage;
    export const getSites = async () => {
        try {
            const result = await api.get('/api/site', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return result.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des sites :', error);
        }
    };

    export const getFavorite = async () => {
        try {
            const result = await api.get(`api/user/likedFavorites/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const resultedited = result.data.map(fav => fav.entite_id);
            return resultedited || [];
        } catch (error) {
            console.error('Erreur lors de la récupération des sites :', error);
        }
    }

    export const getRegions = async () => {
        try {
            const result = await api.get(`api/user/regions/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return result.data
        } catch (error) {
            console.error('Erreur lors de la récupération des sites :', error);
        }
    }