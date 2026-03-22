import React from 'react';
import styles from './RecommendationIA.module.css';

const AlternativeSuggestion = ({ destination, originalDestination, reason, onClick }) => {
    return (
        <div className={styles["alternative-card"]} onClick={onClick}>
            <div className={styles["alternative-icon"]}>
                <i className="fas fa-sync-alt"></i>
            </div>
            <div className={styles["alternative-info"]}>
                <h4>{destination}</h4>
                <p>Alternative à {originalDestination}</p>
                <div className={styles["similarity"]}>
                    <i className="fas fa-chart-line"></i>
                    <span>Raison : {reason}</span>
                </div>
            </div>
        </div>
    );
};

export default AlternativeSuggestion;