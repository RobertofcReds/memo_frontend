import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const AuthContext = createContext();

// Liste des devises supportées par l'API (à adapter selon votre API)
const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'MGA', 'GBP', 'CHF', 'CAD', 'AUD'];

const getCurrency = async (currency) => {
    // Si la devise n'est pas supportée, utiliser EUR par défaut
    if (!SUPPORTED_CURRENCIES.includes(currency)) {
        console.warn(`Devise ${currency} non supportée, utilisation d'EUR`);
        currency = 'EUR';
    }

    try {
        const response = await axios.get(`${process.env.REACT_APP_CURRENCY_API}/pair/EUR/${currency}`);
        return response.data;
    } catch (error) {
        console.error('Erreur récupération taux de change:', error);
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        setUserToken(null);
        setUser(null);
        localStorage.clear();
        console.log("Localstorage cleaned.")
    }, []);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');

            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    setUserToken(token);

                    // Vérifier que la devise est supportée
                    let currency = decoded.currency || 'EUR';
                    if (!SUPPORTED_CURRENCIES.includes(currency)) {
                        currency = 'EUR';
                    }

                    const currencyData = await getCurrency(currency);
                    if (currencyData) {
                        console.log('Taux de change EUR/MGA:', currencyData.conversion_rate);
                        localStorage.setItem('userCurrency', currency);
                        localStorage.setItem('currencyRate', currencyData.conversion_rate);
                        setUser({
                            id: decoded.userId,
                            name: decoded.userName,
                            currency: currency,
                            currencyRate: currencyData.conversion_rate,
                            role: decoded.role || 'user'
                        });
                    } else {
                        // Fallback si l'API de change échoue
                        setUser({
                            id: decoded.userId,
                            name: decoded.userName,
                            currency: currency,
                            currencyRate: 1,
                            role: decoded.role || 'user'
                        });
                    }
                } catch (error) {
                    console.error('Erreur décodage token:', error);
                    logout();
                }
            }

            setLoading(false);
        };

        loadUser();
    }, [logout]);

    const login = useCallback(async (tokenDB) => {
        setUserToken(tokenDB);
        localStorage.setItem('token', tokenDB);

        try {
            const decoded = jwtDecode(tokenDB);
            console.log(decoded);

            // Vérifier que la devise est supportée
            let currency = decoded.currency || 'EUR';
            if (!SUPPORTED_CURRENCIES.includes(currency)) {
                currency = 'EUR';
            }

            const currencyData = await getCurrency(currency);
            if (currencyData) {
                localStorage.setItem('userCurrency', currency);
                localStorage.setItem('currencyRate', currencyData.conversion_rate);
                setUser({
                    id: decoded.userId,
                    name: decoded.userName,
                    currency: currency,
                    currencyRate: currencyData.conversion_rate,
                    role: decoded.role || 'user'
                });
            } else {
                // Fallback si l'API de change échoue
                setUser({
                    id: decoded.userId,
                    name: decoded.userName,
                    currency: currency,
                    currencyRate: 1,
                    role: decoded.role || 'user'
                });
            }
        } catch (error) {
            console.error('Erreur décodage token:', error);
        }
    }, []);

    const value = useMemo(() => ({
        userToken,
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!userToken
    }), [userToken, user, login, logout, loading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);