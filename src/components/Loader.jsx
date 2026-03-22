import React from 'react'
import '../pages/css/loader.css'
export const Loader = () => {
    return (
        <div className="loading">
            <div className="loading-spinner"></div>
            <p>Chargement de l'interface...</p>
        </div>
    );
}
