import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import clsx from 'clsx';
import styles from './css/Auth.module.css';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [enteredCode, setEnteredCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const [token, setToken] = useState('');

    // Étape 1: Envoi du code
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        if (!email) {
            setIsLoading(false);
            return setError('Veuillez entrer votre adresse email');
        }
        try {
            // Envoie la demande de code
            const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
            setSuccess(true);
            console.log(res.data);
            setToken(res.data.token);
            setStep(2);
            setIsLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Une erreur est survenue. Veuillez réessayer.');
            setIsLoading(false);
        }
    };

    // Étape 2: Vérification du code
    const handleCodeSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        if (!enteredCode) {
            setIsLoading(false);
            return setError('Veuillez entrer le code reçu par email');
        }
        try {
            // Vérifie le code
            await axios.get(`http://localhost:5000/api/auth/reset-password/${token}`);
            setStep(3);
            setIsLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Code invalide ou expiré.');
            setIsLoading(false);
        }
    };

    // Étape 3: Changement du mot de passe
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        if (!newPassword || !confirmPassword) {
            setIsLoading(false);
            return setError('Veuillez remplir tous les champs');
        }
        if (newPassword !== confirmPassword) {
            setIsLoading(false);
            return setError('Les mots de passe ne correspondent pas');
        }
        try {
            await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, {
                password: newPassword,
            });
            setSuccess(true);
            setIsLoading(false);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors du changement de mot de passe.');
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Mot de passe oublié</h2>
                    <p className={styles.subtitle}>Entrez votre email pour réinitialiser votre mot de passe</p>
                </div>

                {step === 1 && (
                    <>
                        {error && (
                            <div className={styles.error}>
                                <i className="fas fa-exclamation-circle"></i>
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleEmailSubmit}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Adresse email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="exemple@email.com"
                                    className={styles.input}
                                />
                            </div>
                            <button
                                type="submit"
                                className={styles.button}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i> Envoi en cours...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-paper-plane"></i> Envoyer le lien
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className={styles.success}>
                            <i className="fas fa-check-circle"></i>
                            Un token de récupération a été envoyé à {email}. Veuillez vérifier votre boîte de réception.
                        </div>
                        {error && (
                            <div className={styles.error}>
                                <i className="fas fa-exclamation-circle"></i>
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleCodeSubmit}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Token reçu par email</label>
                                <input
                                    type="text"
                                    value={enteredCode}
                                    onChange={(e) => setEnteredCode(e.target.value)}
                                    required
                                    placeholder="5bc8b83da932e7f0e4a3c2c6b1d5f9a1gfd4d"
                                    className={styles.input}
                                />
                            </div>
                            <button
                                type="submit"
                                className={styles.button}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i> Vérification...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-key"></i> Vérifier le token
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                )}

                {step === 3 && (
                    <>
                        <div className={styles.success}>
                            <i className="fas fa-check-circle"></i>
                            Code vérifié. Veuillez entrer un nouveau mot de passe.
                        </div>
                        {error && (
                            <div className={styles.error}>
                                <i className="fas fa-exclamation-circle"></i>
                                {error}
                            </div>
                        )}
                        <form onSubmit={handlePasswordSubmit}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nouveau mot de passe</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder="Nouveau mot de passe"
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Confirmer le mot de passe</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Confirmer le mot de passe"
                                    className={styles.input}
                                />
                            </div>
                            <button
                                type="submit"
                                className={styles.button}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i> Changement...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-save"></i> Enregistrer
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                )}

                <div className={styles.links}>
                    <Link to="/login" className={styles.link}>
                        <i className="fas fa-arrow-left"></i> Retour à la connexion
                    </Link>
                    <Link to="/register" className={styles.link}>
                        <i className="fas fa-user-plus"></i> Créer un compte
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;