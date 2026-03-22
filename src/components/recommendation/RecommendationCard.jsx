// RecommendationCard.jsx - Version complète
import React from 'react';
import PropTypes from 'prop-types'; 
import styles from './RecommendationIA.module.css';

const RecommendationCard = ({ site, onClick, badge }) => {
    // Fonction pour obtenir le texte du badge selon le type
    const getBadgeText = () => {
        switch(badge) {
            case 'recherche':
                return '🔍 Correspond à votre recherche';
            case 'favori':
            case 'favorites':
                return '❤️ Similaire à vos favoris';
            case 'historique':
            case 'history':
                return '📊 Basé sur votre historique';
            case 'populaire':
            case 'popular':
                return '🔥 Tendance';
            case 'itinéraire':
            case 'trips':
                return '✈️ Complète votre itinéraire';
            case 'recommandé':
                return '⭐ Recommandé pour vous';
            default:
                return badge || 'Recommandé';
        }
    };

    // Fonction pour obtenir la classe CSS du badge
    const getBadgeClass = () => {
        switch(badge) {
            case 'populaire':
            case 'popular':
                return styles.popular;
            case 'itinéraire':
            case 'trips':
                return styles.similar;
            case 'recherche':
                return styles.search;
            case 'favori':
            case 'favorites':
                return styles.favorite;
            case 'historique':
            case 'history':
                return styles.history;
            default:
                return '';
        }
    };

    // Fonction pour formater le prix
    const formatPrice = (price) => {
        if (!price && price !== 0) return 'Prix sur demande';
        if (typeof price === 'number') {
            return price.toLocaleString('fr-FR') + ' Ar';
        }
        return price + ' Ar';
    };

    // Fonction pour obtenir l'URL de l'image (avec fallback)
    const getImageUrl = () => {
        if (site.image) return site.image;
        if (site.image_url) return site.image_url;
        // Image par défaut selon le type
        const defaultImages = {
            'Plage': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
            'Nature': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
            'Culture': 'https://images.unsplash.com/photo-1551993003-75a5a13c6e9c',
            'Aventure': 'https://images.unsplash.com/photo-1537907690979-ee2b1382f6c3',
            'Parc National': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
            'Randonnée': 'https://images.unsplash.com/photo-1551632811-561732d1e306',
            'default': 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1'
        };
        return defaultImages[site.type] || defaultImages.default;
    };

    // Fonction pour obtenir les tags à afficher
    const getTags = () => {
        if (site.tags && Array.isArray(site.tags)) {
            return site.tags;
        }
        if (site.tags && typeof site.tags === 'string') {
            return site.tags.split(';').filter(tag => tag.trim());
        }
        if (site.sous_types_tags) {
            return site.sous_types_tags.split(';').filter(tag => tag.trim());
        }
        return ['Tourisme', 'Madagascar'];
    };

    // Fonction pour obtenir la note
    const getRating = () => {
        if (site.rating) return site.rating;
        if (site.note) return site.note;
        if (site.note_moyenne) return site.note_moyenne;
        return 'N/A';
    };

    // Fonction pour obtenir le score de correspondance
    const getMatchScore = () => {
        if (site.matchScore) return site.matchScore;
        if (site.score) return Math.round(site.score * 100);
        // Score par défaut basé sur la note
        const rating = getRating();
        if (rating !== 'N/A' && !isNaN(rating)) {
            return Math.round(rating * 20); // 4.5 → 90%
        }
        return Math.floor(Math.random() * 10 + 85); // 85-95%
    };

    return (
        <div 
            className={styles["recommendation-card"]} 
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    onClick();
                }
            }}
        >
            {/* Badge de recommandation */}
            <div className={`${styles["card-badge"]} ${getBadgeClass()}`}>
                {getBadgeText()}
            </div>

            {/* Image du site */}
            <div className={styles["card-image"]}>
                <img 
                    src={getImageUrl()} 
                    alt={site.nom || 'Site touristique'} 
                    loading="lazy"
                    onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1';
                    }}
                />
                <div className={styles["image-overlay"]}>
                    <div className={styles["match-score"]}>
                        <i className="fas fa-chart-line"></i>
                        <span>{getMatchScore()}% de correspondance</span>
                    </div>
                </div>
            </div>

            {/* Contenu de la carte */}
            <div className={styles["card-content"]}>
                <h4>{site.nom || 'Site sans nom'}</h4>
                
                {/* Localisation */}
                <div className={styles["card-location"]}>
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{site.region || 'Madagascar'}</span>
                </div>

                {/* Description courte */}
                <p className={styles["card-description"]}>
                    {site.description 
                        ? (site.description.length > 100 
                            ? site.description.substring(0, 100) + '...' 
                            : site.description)
                        : 'Découvrez ce magnifique site touristique de Madagascar'}
                </p>

                {/* Tags */}
                <div className={styles["card-tags"]}>
                    {getTags().slice(0, 3).map((tag, index) => (
                        <span key={index} className={styles["tag"]}>
                            {tag.trim()}
                        </span>
                    ))}
                    {getTags().length > 3 && (
                        <span className={styles["tag"]}>+{getTags().length - 3}</span>
                    )}
                </div>

                {/* Footer avec prix et note */}
                <div className={styles["card-footer"]}>
                    <div className={styles["card-price"]}>
                        <i className="fas fa-tag"></i>
                        {site.prix ? (
                            <>
                                {typeof site.prix === 'number' && site.prix < 1000 
                                    ? site.prix + '€' 
                                    : formatPrice(site.prix)}
                            </>
                        ) : (
                            <span>Prix sur demande</span>
                        )}
                    </div>
                    <div className={styles["card-rating"]}>
                        <i className="fas fa-star"></i>
                        <span>{getRating()}</span>
                        {site.avis && (
                            <span className={styles["review-count"]}>
                                ({site.avis} avis)
                            </span>
                        )}
                    </div>
                </div>

                {/* Informations supplémentaires (optionnel) */}
                {(site.duree || site.duree_visite) && (
                    <div className={styles["card-duration"]}>
                        <i className="fas fa-clock"></i>
                        <span>{site.duree || site.duree_visite}</span>
                    </div>
                )}
            </div>

            {/* Effet de survol */}
            <div className={styles["card-hover-effect"]}></div>
        </div>
    );
};

// Ajout des PropTypes pour la validation (optionnel mais recommandé)
RecommendationCard.propTypes = {
    site: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        nom: PropTypes.string,
        region: PropTypes.string,
        description: PropTypes.string,
        description_courte: PropTypes.string,
        image: PropTypes.string,
        image_url: PropTypes.string,
        prix: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        cout_estime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        type: PropTypes.string,
        type_activite: PropTypes.string,
        tags: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
        sous_types_tags: PropTypes.string,
        rating: PropTypes.number,
        note: PropTypes.number,
        note_moyenne: PropTypes.number,
        matchScore: PropTypes.number,
        score: PropTypes.number,
        avis: PropTypes.number,
        duree: PropTypes.string,
        duree_visite: PropTypes.string
    }).isRequired,
    onClick: PropTypes.func,
    badge: PropTypes.string
};

export default RecommendationCard;