import React from 'react';
import styles from './RecommendationIA.module.css';

const WeatherAlert = ({ alert, onAlternativeClick }) => {
    const isCyclone = alert.type === 'cyclone';

    return (
        <div className={`${styles["weather-alert"]} ${!isCyclone ? styles.warning : ''}`}>
            <div className={styles["alert-icon"]}>
                <i className={`fas fa-${isCyclone ? 'wind' : 'cloud-rain'}`}></i>
            </div>
            <h3>⚠️ Alerte {isCyclone ? 'cyclonique' : 'météo'}</h3>
            <p className={styles["alert-destination"]}>
                <i className="fas fa-map-marker-alt"></i> {alert.destination}
            </p>
            <p className={styles["alert-message"]}>
                {alert.message} pour le {new Date(alert.date).toLocaleDateString('fr-FR')}
            </p>
            <div className={styles["alert-suggestions"]}>
                {alert.alternatives.map((alt, index) => (
                    <button 
                        key={index}
                        className={styles["suggestion-btn"]}
                        onClick={() => onAlternativeClick(alt)}
                    >
                        <i className="fas fa-compass"></i> Découvrir {alt}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default WeatherAlert;