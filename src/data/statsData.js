// src/data/statsData.js
export const statsData = {
    // Données pour le graphique en camembert (sites par type)
    sitesByType: [
        { name: 'Culturel', value: 35, color: '#2a6f97' },
        { name: 'Nature', value: 28, color: '#28a745' },
        { name: 'Plage', value: 22, color: '#00b4d8' },
        { name: 'Aventure', value: 15, color: '#f77f00' },
        { name: 'Historique', value: 10, color: '#6f42c1' }
    ],

    // Données pour le graphique linéaire (nouveaux utilisateurs)
    newUsersByDay: [
        { day: 'Lun', count: 12 },
        { day: 'Mar', count: 19 },
        { day: 'Mer', count: 15 },
        { day: 'Jeu', count: 25 },
        { day: 'Ven', count: 22 },
        { day: 'Sam', count: 30 },
        { day: 'Dim', count: 28 }
    ],

    // Données pour le graphique en barres (visites par région)
    visitsByRegion: [
        { region: 'Analamanga', visits: 245, color: '#2a6f97' },
        { region: 'Atsinanana', visits: 189, color: '#468faf' },
        { region: 'Vakinankaratra', visits: 167, color: '#00b4d8' },
        { region: 'Boeny', visits: 154, color: '#28a745' },
        { region: 'Diana', visits: 132, color: '#f77f00' }
    ],

    // Tendances mensuelles
    monthlyTrends: [
        { month: 'Jan', sites: 5, users: 25, reviews: 45 },
        { month: 'Fév', sites: 8, users: 32, reviews: 52 },
        { month: 'Mar', sites: 12, users: 45, reviews: 68 },
        { month: 'Avr', sites: 10, users: 38, reviews: 61 },
        { month: 'Mai', sites: 15, users: 52, reviews: 78 },
        { month: 'Jun', sites: 18, users: 68, reviews: 92 }
    ],

    // Répartition des utilisateurs
    usersByRole: [
        { role: 'Admin', count: 3, color: '#f77f00' },
        { role: 'Éditeur', count: 7, color: '#2a6f97' },
        { role: 'Utilisateur', count: 185, color: '#28a745' }
    ]
};