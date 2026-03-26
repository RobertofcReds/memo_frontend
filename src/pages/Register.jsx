import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import clsx from 'clsx';
import styles from './css/Auth.module.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        country: '',
        currency: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isRobot, setIsRobot] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const navigate = useNavigate();

    // src/data/countries.js
    const countries = [
        { country: "Madagascar", abbr: "mg", money: "MGA" },
        { country: "Europe", abbr: "fr", money: "EUR" },
        { country: "United States", abbr: "us", money: "USD" },
        { country: "United Kingdom", abbr: "gb", money: "GBP" },
        { country: "Japan", abbr: "jp", money: "JPY" },
        { country: "India", abbr: "in", money: "INR" },
        { country: "Australia", abbr: "au", money: "AUD" },
        { country: "Canada", abbr: "ca", money: "CAD" },
        { country: "Switzerland", abbr: "ch", money: "CHF" },
        { country: "South Korea", abbr: "kr", money: "KRW" },
        { country: "Russia", abbr: "ru", money: "RUB" },
        { country: "Brazil", abbr: "br", money: "BRL" },
        { country: "South Africa", abbr: "za", money: "ZAR" },
        { country: "Mexico", abbr: "mx", money: "MXN" },
        { country: "China", abbr: "cn", money: "CNY" },
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'country') {
            const selectedCountry = countries.find(option => option.country === value);
            setFormData({
                ...formData,
                country: value,
                currency: selectedCountry ? selectedCountry.money : ''
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const validateStep1 = () => {
        // Validation du nom
        if (!formData.name.trim()) {
            setError('Veuillez saisir votre nom complet');
            return false;
        }

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            setError('Veuillez saisir votre adresse email');
            return false;
        }
        if (!emailRegex.test(formData.email)) {
            setError('Veuillez saisir une adresse email valide');
            return false;
        }

        // Validation du pays
        if (!formData.country) {
            setError('Veuillez sélectionner votre devise d\'origine');
            return false;
        }

        setError('');
        return true;
    };

    const validateStep2 = () => {
        // Validation du mot de passe
        if (!formData.password) {
            setError('Veuillez saisir un mot de passe');
            return false;
        }
        if (!/^[a-zA-Z0-9]{4,}$/.test(formData.password)) {
            setError('Le mot de passe doit contenir au moins 4 caractères alphanumériques');
            return false;
        }

        // Validation de la confirmation du mot de passe
        if (!formData.confirmPassword) {
            setError('Veuillez confirmer votre mot de passe');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return false;
        }

        // Validation de la checkbox robot
        if (!isRobot) {
            setError('Veuillez confirmer que vous n\'êtes pas un robot');
            return false;
        }

        setError('');
        return true;
    };

    const nextStep = () => {
        if (validateStep1()) {
            setCurrentStep(2);
        }
    };

    const prevStep = () => {
        setCurrentStep(1);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep2()) return;

        setIsLoading(true);

        try {
            await axios.post(`${process.env.REACT_APP_BACK_URL}/api/auth/register`, {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                country: formData.country,
                currency: formData.currency
            });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            console.log("err: ", err)
            setError(err.response?.data?.message || "Erreur d'inscription");
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Inscription</h2>
                    <p className={styles.subtitle}>Créez votre compte pour commencer votre aventure</p>

                    {/* Indicateur d'étape */}
                    <div className={styles.stepIndicator}>
                        <div className={clsx(styles.step, { [styles.stepActive]: currentStep === 1 })}>
                            <span>1</span>
                            <p>Informations personnelles</p>
                        </div>
                        <div className={styles.stepLine}></div>
                        <div className={clsx(styles.step, { [styles.stepActive]: currentStep === 2 })}>
                            <span>2</span>
                            <p>Sécurité</p>
                        </div>
                    </div>
                </div>

                {success && (
                    <div className={styles.success}>
                        <i className="fas fa-check-circle"></i>
                        Inscription réussie ! Redirection en cours...
                    </div>
                )}

                {error && (
                    <div className={styles.error}>
                        <i className="fas fa-exclamation-circle"></i>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Étape 1: Informations personnelles */}
                    {currentStep === 1 && (
                        <div className={styles.formStep}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nom complet</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Votre nom complet"
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Adresse email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="exemple@email.com"
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Devise correspondante</label>
                                <select
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    required
                                    className={styles.select}
                                >
                                    <option value="">Sélectionnez votre devise</option>
                                    {countries.map((option, index) => (
                                        <option key={index} value={option.country}>
                                            {option.country} ({option.money})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="button"
                                className={clsx(styles.button, styles.nextButton)}
                                onClick={nextStep}
                            >
                                Suivant <i className="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    )}

                    {/* Étape 2: Sécurité */}
                    {currentStep === 2 && (
                        <div className={styles.formStep}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Mot de passe</label>
                                <div className={styles.passwordInput}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        placeholder="••••••••"
                                        className={styles.input}
                                    />
                                    <button
                                        type="button"
                                        className={styles.passwordToggle}
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                                    >
                                        <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                                    </button>
                                </div>
                                <p className={styles.passwordHint}>Minimum 4 caractères (lettres et chiffres seulement)</p>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Confirmer le mot de passe</label>
                                <div className={styles.passwordInput}>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        placeholder="••••••••"
                                        className={styles.input}
                                    />
                                    <button
                                        type="button"
                                        className={styles.passwordToggle}
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        aria-label={showConfirmPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                                    >
                                        <i className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                                    </button>
                                </div>
                            </div>

                            <div className={styles.checkboxGroup}>
                                <input
                                    type="checkbox"
                                    id="robotCheck"
                                    checked={isRobot}
                                    onChange={() => setIsRobot(!isRobot)}
                                />
                                <label htmlFor="robotCheck">Je ne suis pas un robot</label>
                            </div>

                            <div className={styles.stepButtons}>
                                <button
                                    type="button"
                                    className={clsx(styles.button, styles.prevButton)}
                                    onClick={prevStep}
                                >
                                    <i className="fas fa-arrow-left"></i> Retour
                                </button>
                                <button
                                    type="submit"
                                    className={styles.button}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i> Inscription...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-user-plus"></i> S'inscrire
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </form>

                <div className={styles.socialLogin}>
                    <p>Ou inscrivez-vous avec</p>
                    <div className={styles.socialButtons}>
                        <button type="button" className={clsx(styles.socialButton, styles.facebook)}>
                            <i className="fab fa-facebook-f"></i>
                        </button>
                        <button type="button" className={clsx(styles.socialButton, styles.google)}>
                            <i className="fab fa-google"></i>
                        </button>
                        <button type="button" className={clsx(styles.socialButton, styles.twitter)}>
                            <i className="fab fa-twitter"></i>
                        </button>
                    </div>
                </div>

                <div className={styles.links}>
                    <Link to="/login" className={styles.link}>
                        <i className="fas fa-sign-in-alt"></i> Déjà un compte ? Connectez-vous
                    </Link>
                    <Link to="/" className={styles.link}>
                        <i className="fas fa-home"></i> Revenir à l'accueil
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;