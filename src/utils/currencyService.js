// utils/currencyService.js

const API_KEY = '8e90cf7b16c06916f4f6c559'; // Remplacez par votre clé API
const BASE_URL = 'https://api.exchangerate-api.com/v4/latest';

// Cache pour stocker les taux de change
let exchangeRates = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes

// Fonction pour récupérer les taux de change
export const fetchExchangeRates = async (baseCurrency = 'EUR') => {
    try {
        // Vérifier si le cache est encore valide
        const currentTime = Date.now();
        if (exchangeRates && lastFetchTime &&
            (currentTime - lastFetchTime) < CACHE_DURATION &&
            exchangeRates.base === baseCurrency) {
            return exchangeRates;
        }

        const response = await fetch(`${BASE_URL}/${baseCurrency}`);

        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`);
        }

        const data = await response.json();

        // Mettre à jour le cache
        exchangeRates = data;
        lastFetchTime = currentTime;

        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération des taux de change:', error);

        // En cas d'erreur, utiliser des taux de secours
        return getFallbackRates(baseCurrency);
    }
};

// Taux de secours (approximatifs)
const getFallbackRates = (baseCurrency) => {
    const fallbackRates = {
        'EUR': {
            base: 'EUR',
            rates: {
                'EUR': 1,
                'USD': 1.08,
                'GBP': 0.85,
                'MGA': 4500
            }
        },
        'USD': {
            base: 'USD',
            rates: {
                'EUR': 0.93,
                'USD': 1,
                'GBP': 0.79,
                'MGA': 4200
            }
        },
        'GBP': {
            base: 'GBP',
            rates: {
                'EUR': 1.18,
                'USD': 1.27,
                'GBP': 1,
                'MGA': 5300
            }
        },
        'MGA': {
            base: 'MGA',
            rates: {
                'EUR': 0.00022,
                'USD': 0.00024,
                'GBP': 0.00019,
                'MGA': 1
            }
        }
    };

    return fallbackRates[baseCurrency] || fallbackRates['EUR'];
};

// Fonction pour convertir un montant
export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
    try {
        if (fromCurrency === toCurrency) return amount;

        const ratesData = await fetchExchangeRates(fromCurrency);

        if (!ratesData.rates[toCurrency]) {
            console.warn(`Taux non disponible pour ${toCurrency}, utilisation des taux de secours`);
            const fallback = getFallbackRates(fromCurrency);
            return Math.round(amount * (fallback.rates[toCurrency] || 1));
        }

        const converted = amount * ratesData.rates[toCurrency];
        return Math.round(converted * 100) / 100; // Arrondir à 2 décimales
    } catch (error) {
        console.error('Erreur de conversion:', error);
        const fallback = getFallbackRates(fromCurrency);
        return Math.round(amount * (fallback.rates[toCurrency] || 1));
    }
};

// Fonction pour récupérer plusieurs taux de conversion en une seule fois
export const getMultipleRates = async (baseCurrency, targetCurrencies) => {
    try {
        const ratesData = await fetchExchangeRates(baseCurrency);
        const result = {};

        targetCurrencies.forEach(currency => {
            if (ratesData.rates[currency]) {
                result[currency] = ratesData.rates[currency];
            } else {
                const fallback = getFallbackRates(baseCurrency);
                result[currency] = fallback.rates[currency] || 1;
            }
        });

        return result;
    } catch (error) {
        console.error('Erreur lors de la récupération des taux multiples:', error);
        const fallback = getFallbackRates(baseCurrency);
        const result = {};
        targetCurrencies.forEach(currency => {
            result[currency] = fallback.rates[currency] || 1;
        });
        return result;
    }
};