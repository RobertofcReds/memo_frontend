import React from 'react'
import styles from './css/Dashboard.module.css';
export const Loader = () => {
    return (
            <div className={styles["dashboard-loading"]}>
                <div className={styles["loading-container"]}>
                    <div className={styles["loading-spinner"]}>
                        <div className={styles["spinner-inner"]}></div>
                        <div className={styles["spinner-orbits"]}>
                            <div className={styles["orbit-1"]}></div>
                            <div className={styles["orbit-2"]}></div>
                            <div className={styles["orbit-3"]}></div>
                        </div>
                    </div>
                    <div className={styles["loading-text"]}>
                        <h3>Préparation de votre espace</h3>
                        <p>Chargement de votre aventure malgache...</p>
                        <div className={styles["loading-dots"]}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            </div>
        );
}
