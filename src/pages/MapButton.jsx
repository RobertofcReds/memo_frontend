import React from 'react';
import './css/MapButton.css';

const MapButton = ({ site, onMapClick }) => {
    const handleClick = () => {
        if (onMapClick) {
            onMapClick(site);
        } else {
            // Ouvrir Google Maps avec les coordonnées du site
            const url = `https://www.google.com/maps?q=${site.latitude},${site.longitude}`;
            window.open(url, '_blank');
        }
    };

    return (
        <button 
            className="map-button"
            onClick={handleClick}
            title="Voir sur la carte"
        >
            <i className="fas fa-map-marker-alt"></i>
            Voir sur la carte
        </button>
    );
};

export default MapButton;