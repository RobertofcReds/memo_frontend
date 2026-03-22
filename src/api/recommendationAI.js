
// URL de ton API Flask
const FLASK_API_URL = 'https://ia-memo.onrender.com/api/v1';

// Service de recommandation IA
export const recommendationAIService = {
  // Obtenir des recommandations basées sur les critères
  getRecommendationsByCriteria: async (criteria) => {
    
    try {
      const response = await fetch(`${FLASK_API_URL}/recommendations/by-criteria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...criteria,
          n_recommendations: criteria.n_recommendations || 10
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur API recommandation:', error);
      throw error;
    }
  },

  // Recherche sémantique
  semanticSearch: async (query, n = 10) => {
    try {
      const response = await fetch(`${FLASK_API_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          n_results: n
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Erreur recherche sémantique:', error);
      throw error;
    }
  },

  // Obtenir les détails d'un site depuis le modèle
  getSiteDetails: async (siteId) => {
    try {
      const response = await fetch(`${FLASK_API_URL}/sites/${siteId}`);
      return await response.json();
    } catch (error) {
      console.error('Erreur récupération site:', error);
      throw error;
    }
  },

  // Obtenir les statistiques du modèle
  getStats: async () => {
    try {
      const response = await fetch(`${FLASK_API_URL}/stats`);
      return await response.json();
    } catch (error) {
      console.error('Erreur stats:', error);
      throw error;
    }
  },

   // Obtenir les statistiques du modèle
  healthCheck: async () => {
    try {
      const response = await fetch(`${FLASK_API_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Erreur health check:', error);
      throw error;
    }
  }
};

export default recommendationAIService;