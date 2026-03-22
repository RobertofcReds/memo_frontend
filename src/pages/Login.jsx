import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import clsx from 'clsx';
import styles from './css/Auth.module.css';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errors.email = 'Veuillez saisir votre adresse email';
    } else if (!emailRegex.test(email)) {
      errors.email = 'Veuillez saisir une adresse email valide';
    }

    if (!password) {
      errors.password = 'Veuillez saisir votre mot de passe';
    } else if (password.length < 4) {
      errors.password = 'Le mot de passe doit contenir au moins 4 caractères';
    } else if (!/^[a-zA-Z0-9]+$/.test(password)) {
      errors.password = 'Le mot de passe ne doit contenir que des lettres et des chiffres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACK_URL}/api/auth/login`, {
        email,
        password
      });

      await login(response.data.token);
      setSuccess(`Bienvenue, ${response.data.userName} !`);

    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
      setIsLoading(false);
    }
  };

  const emailInputClass = clsx(
    styles.input,
    { [styles.inputError]: formErrors.email }
  );

  const passwordInputClass = clsx(
    styles.input,
    { [styles.inputError]: formErrors.password }
  );

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Connexion</h2>
          <p className={styles.subtitle}>Connectez-vous pour accéder à votre compte</p>
        </div>

        {success && (
          <div className={styles.success}>
            <i className="fas fa-check-circle"></i>
            {success}
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Adresse email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="exemple@email.com"
              className={emailInputClass}
            />
            {formErrors.email && <span className={styles.fieldError}>{formErrors.email}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Mot de passe</label>
            <div className={styles.passwordInput}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className={passwordInputClass}
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
            {formErrors.password ? (
              <span className={styles.fieldError}>{formErrors.password}</span>
            ) : (
              <p className={styles.passwordHint}>Minimum 4 caractères (lettres et chiffres seulement)</p>
            )}
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Connexion...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i> Se connecter
              </>
            )}
          </button>
        </form>

        <div className={styles.socialLogin}>
          <p>Ou connectez-vous avec</p>
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
          <Link to="/register" className={styles.link}>
            <i className="fas fa-user-plus"></i> Créer un compte
          </Link>
          <Link to="/forgot-password" className={styles.link}>
            <i className="fas fa-key"></i> Mot de passe oublié ?
          </Link>
          <Link to="/" className={styles.link}>
            <i className="fas fa-home"></i> Revenir à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;