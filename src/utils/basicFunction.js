export const formattedGermanCurrency = (number, currency) => {
  return new Intl.NumberFormat('de-DE', { style: "currency", currency: currency }).format(number).replace(/\./g, ' ');;
};