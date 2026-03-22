// src/components/Notification/Notification.jsx
import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './Notification.module.css';

const Notification = ({ message, type, duration = 4000, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        if (!isVisible) return;

        const totalTime = duration;
        const intervalTime = 50;
        const totalSteps = totalTime / intervalTime;
        const stepValue = 100 / totalSteps;

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev <= 0) {
                    clearInterval(progressInterval);
                    return 0;
                }
                return prev - stepValue;
            });
        }, intervalTime);

        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onClose) onClose();
        }, duration);

        return () => {
            clearTimeout(timer);
            clearInterval(progressInterval);
        };
    }, [duration, isVisible, onClose]);

    const handleClose = () => {
        setIsVisible(false);
        if (onClose) onClose();
    };

    if (!isVisible) return null;

    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle',
        loading: 'fas fa-spinner fa-spin'
    };

    const colors = {
        success: '#2ecc71',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db',
        loading: '#3498db'
    };

    const notificationClasses = clsx(
        styles.notification,
        styles[type] // Ajoute la classe du type (success, error, etc...)
    );

    return (
        <div
            className={notificationClasses}
            style={{ borderLeftColor: colors[type] }}
        >
            <div className={styles.content}>
                <div className={styles.icon}>
                    <i
                        className={icons[type]}
                        style={{ color: colors[type] }}
                    ></i>
                </div>
                <div className={styles.message}>
                    <p>{message}</p>
                </div>
                <button
                    className={styles.close}
                    onClick={handleClose}
                    aria-label="Fermer la notification"
                >
                    <i className="fas fa-times"></i>
                </button>
            </div>
            <div
                className={styles.progress}
                style={{
                    width: `${progress}%`,
                    backgroundColor: colors[type]
                }}
            />
        </div>
    );
};

export default Notification;