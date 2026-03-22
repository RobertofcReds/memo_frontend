// src/components/Notification/NotificationProvider.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import Notification from './Notification';
import styles from './Notification.module.css';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);

    const showNotification = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();

        setNotifications(prev => [
            ...prev,
            { id, message, type, duration }
        ]);

        // Retourner une fonction pour fermer la notification
        return () => {
            removeNotification(id);
        };
    }, [removeNotification]); // ← Ajout de removeNotification aux dépendances

    const showSuccess = useCallback((message, duration) => {
        return showNotification(message, 'success', duration);
    }, [showNotification]);

    const showError = useCallback((message, duration) => {
        return showNotification(message, 'error', duration);
    }, [showNotification]);

    const showWarning = useCallback((message, duration) => {
        return showNotification(message, 'warning', duration);
    }, [showNotification]);

    const showInfo = useCallback((message, duration) => {
        return showNotification(message, 'info', duration);
    }, [showNotification]);

    const showLoading = useCallback((message, duration) => {
        return showNotification(message, 'loading', duration);
    }, [showNotification]);

    return (
        <NotificationContext.Provider value={{
            showNotification,
            showSuccess,
            showError,
            showWarning,
            showInfo,
            showLoading,
            removeNotification
        }}>
            {children}

            <div className={styles.container}>
                {notifications.map(notification => (
                    <Notification
                        key={notification.id}
                        message={notification.message}
                        type={notification.type}
                        duration={notification.duration}
                        onClose={() => removeNotification(notification.id)}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

export default NotificationProvider;