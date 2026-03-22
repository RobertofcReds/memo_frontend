import React from 'react';
import styles from './SimpleMap.module.css';

const SimpleMap = ({ latitude, longitude, regionName }) => {
    // URL de la carte statique Google Maps
    const googleStaticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=10&size=600x400&markers=color:red%7C${latitude},${longitude}&key=AIzaSyC-H3VO6FOUt-XfTawPzBHyhHx8G9oPm-U`;

    // URL OpenStreetMap (alternative)
    const openStreetMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.5},${latitude - 0.5},${longitude + 0.5},${latitude + 0.5}&layer=mapnik&marker=${latitude},${longitude}`;

    return (
        <div className={styles['map-container']}>
            <div className={styles['map-wrapper']}>
                {/* Solution 1: Iframe OpenStreetMap */}
                <iframe
                    src={openStreetMapUrl}
                    width="100%"
                    height="400"
                    style={{ border: 'none', borderRadius: '8px' }}
                    title={`Carte de ${regionName}`}
                    loading="lazy"
                ></iframe>

                {/* Solution alternative: Image statique avec lien */}
                <div className={styles['map-overlay']}>
                    <a
                        href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles['map-link']}
                    >
                        <i className="fas fa-external-link-alt"></i>
                        Ouvrir dans Google Maps
                    </a>
                </div>
            </div>

            <div className={styles['coordinates-info']}>
                <p>
                    <i className="fas fa-map-marker-alt" style={{ color: '#f77f00' }}></i>
                    <strong>Coordonnées :</strong>
                    Latitude: {latitude?.toFixed(6) || 'N/A'},
                    Longitude: {longitude?.toFixed(6) || 'N/A'}
                </p>
            </div>
        </div>
    );
};

export default SimpleMap;