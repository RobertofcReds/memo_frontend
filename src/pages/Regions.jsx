import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import clsx from 'clsx';
import styles from './css/Regions.module.css';
import logos from '../images/logo-site4.png';
import { useNotification } from '../components/Notification/NotificationProvider';
import { useAuth } from '../context/AuthContext';

// Composant IA de recommandation (chargement différé pour performance)
const RecommendationAI = lazy(() => import('../components/recommendation/RecommendationAI'));

// Import simple du composant de carte
const SimpleMap = ({ latitude, longitude, regionName }) => {
  if (!latitude || !longitude) return <div>Carte non disponible</div>;

  const openStreetMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.5},${latitude - 0.5},${longitude + 0.5},${latitude + 0.5}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <div style={{ width: '100%', height: '400px', borderRadius: '8px', overflow: 'hidden' }}>
      <iframe
        src={openStreetMapUrl}
        width="100%"
        height="400"
        style={{ border: 'none' }}
        title={`Carte de ${regionName}`}
        loading="lazy"
      ></iframe>
    </div>
  );
};

const Regions = () => {
  const [showRecommendationAI, setShowRecommendationAI] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRegions, setFilteredRegions] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [regions, setRegions] = useState([]);
  const [regionTypes, setRegionTypes] = useState([]);
  const [regionProvinces, setRegionProvinces] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [expandedCards, setExpandedCards] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [typingText, setTypingText] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const typingRef = useRef(null);
  const {user, logout} = useAuth();
  

  // États pour les modals
  const [showMapModal, setShowMapModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [shareUrl, setShareUrl] = useState('');

  // États pour le chatbox
  const [showChatbox, setShowChatbox] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatbotTyping, setIsChatbotTyping] = useState(false);
  const chatboxRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const chatInputRef = useRef(null);

  // Utilisation du hook de notification
  const { showSuccess, showError, showInfo } = useNotification();

  // Images HD pour le carrousel
  const heroImages = [
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    'https://upload.wikimedia.org/wikipedia/commons/3/3f/Nosy_Be_Airport.JPG',
    'https://upload.wikimedia.org/wikipedia/commons/1/13/Princess_Bora_Lodge%2C_%C3%8Ele_Sainte-Marie_%283958615912%29.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/f/f5/Couch%C3%A9_de_soleil_et_ponton%2C_ciel_d%C3%A9gag%C3%A9_depuis_la_plage_-_Sainte-Marie-_Madagascar.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/c/c4/Fondation_H_Antananarivo_Madagascar_%2874363%29.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/c/c0/Tamatave_-_panoramio.jpg',
  ];

  // Texte défilant pour l'effet anime
  const typingTexts = [
    "Découvrez la biodiversité unique de Madagascar",
    "Explorez des paysages à couper le souffle",
    "Plongez dans une culture riche et authentique",
    "Vivez des aventures inoubliables"
  ];

  // Messages par défaut pour le chatbot des destinations
  const defaultChatMessages = [
    {
      id: 1,
      text: "Bonjour ! Je suis votre assistant spécialisé en destinations de Madagascar. Je peux vous aider à :",
      sender: 'bot',
      timestamp: new Date(),
      options: [
        "Trouver des régions par type",
        "Découvrir les meilleures périodes",
        "Conseils pour un premier voyage",
        "Destinations hors des sentiers battus"
      ]
    },
    {
      id: 2,
      text: "Pour commencer, dites-moi ce que vous cherchez ou choisissez une option ci-dessus !",
      sender: 'bot',
      timestamp: new Date()
    }
  ];

  // Fonction pour ouvrir le modal IA avec positionnement correct
  const handleOpenAI = () => {
    // SCROLL INSTANTANÉ vers le haut
    window.scrollTo(0, 0);

    // Petit délai pour s'assurer que le scroll est fait
    requestAnimationFrame(() => {
      setShowRecommendationAI(true);

      // Empêcher TOUT défilement
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.classList.add('modal-open');
    });
  };

  // Fonction pour fermer le modal IA
  const handleCloseAI = () => {
    setShowRecommendationAI(false);

    // Restaurer le défilement
    document.body.style.overflow = 'auto';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.classList.remove('modal-open');
  };

  // Vérifier si l'utilisateur est connecté et charger les données
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = user.id;

    setIsLoggedIn(!!token);

    // Charger toutes les données
    loadAllData(token);

    // Charger les favoris seulement si l'utilisateur est connecté
    if (token && userId) {
      loadUserFavorites(userId, token);
    } else {
      // Si pas connecté, vider les favoris
      setFavorites([]);
    }

    // Initialiser les messages du chat
    setChatMessages(defaultChatMessages);

    // Animation du carrousel
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev === heroImages.length - 1 ? 0 : prev + 1));
    }, 5000);

    // === EFFET DE TEXTE DÉFILANT OPTIMISÉ ET ACCÉLÉRÉ ===
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingTimeout;

    const typeEffect = () => {
      const currentText = typingTexts[textIndex];

      if (!isDeleting && charIndex < currentText.length) {
        setTypingText(currentText.substring(0, charIndex + 1));
        charIndex++;
      } else if (isDeleting && charIndex > 0) {
        setTypingText(currentText.substring(0, charIndex - 1));
        charIndex--;
      }

      if (!isDeleting && charIndex === currentText.length) {
        // Délai réduit à la fin du texte (500ms au lieu de 2000ms)
        typingTimeout = setTimeout(() => { isDeleting = true; }, 500);
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % typingTexts.length;
      }

      // Vitesse augmentée: 40ms pour effacer, 60ms pour écrire (au lieu de 50/100)
      const typingSpeed = isDeleting ? 40 : 60;
      typingTimeout = setTimeout(typeEffect, typingSpeed);
    };

    // Démarrer l'effet
    typingTimeout = setTimeout(typeEffect, 100);

    return () => {
      clearInterval(interval);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, []);

  // Gestion du bouton retour en haut
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll automatique des messages du chat
  useEffect(() => {
    if (chatMessagesRef.current && chatMessages.length > 0) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const loadAllData = async (token) => {
    try {
      setIsLoading(true);

      // Charger les régions (avec ou sans token selon ce que l'API accepte)
      const regionsPromise = getRegion(token);

      // Charger les types (avec ou sans token)
      const typesPromise = getTypes(token);

      // Charger les provinces (avec ou sans token)
      const provincesPromise = getProvinces(token);

      // Attendre que toutes les données soient chargées
      await Promise.all([regionsPromise, typesPromise, provincesPromise]);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      showError('Erreur lors du chargement des destinations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserFavorites = async (userId, token) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACK_URL}/api/user/favorites-regions/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Extraire seulement les IDs des régions favorites
      const favoriteIds = response.data.map(item => item.entite_id);
      setFavorites(favoriteIds);

      console.log('✅ Favoris chargés pour l\'utilisateur:', userId, favoriteIds);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des favoris:', error);
      setFavorites([]);
    }
  };

  const handleLogout = () => {
    logout();
    setFavorites([]); // Vider les favoris à la déconnexion
    navigate('/');
    showSuccess('Déconnexion réussie');
  };

  const toggleFavorite = async (regionId) => {
    const token = localStorage.getItem('token');
    const userId = user.id;

    if (!token || !userId) {
      showError('Vous devez être connecté pour ajouter aux favoris');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      return;
    }

    const isCurrentlyFavorited = favorites.includes(regionId);

    try {
      if (isCurrentlyFavorited) {
        // Supprimer une région des favoris
        await axios.delete(`${process.env.REACT_APP_BACK_URL}/api/user/favorites-regions/${userId}/${regionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Mettre à jour l'état local
        const updatedFavorites = favorites.filter(id => id !== regionId);
        setFavorites(updatedFavorites);

        showSuccess('Région retirée des favoris');
      } else {
        // Ajouter une région aux favoris
        await axios.post(
          `${process.env.REACT_APP_BACK_URL}/api/user/favorites-regions/${userId}`,
          { regionId: regionId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Mettre à jour l'état local
        const updatedFavorites = [...favorites, regionId];
        setFavorites(updatedFavorites);

        showSuccess('Région ajoutée aux favoris !');
      }
    } catch (error) {
      console.error('Erreur lors de la gestion des favoris:', error);

      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError('Erreur lors de la gestion des favoris. Veuillez réessayer.');
      }
    }
  };

  const toggleCardExpansion = (regionId) => {
    setExpandedCards(prev => ({
      ...prev,
      [regionId]: !prev[regionId]
    }));
  };

  const getRegion = async (token) => {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const result = await axios.get(`${process.env.REACT_APP_BACK_URL}/api/user/regions/`, config);
      setRegions(result.data);
      console.log('✅ Régions chargées:', result.data.length);
    } catch (error) {
      console.error('Erreur lors du chargement des régions:', error);

      // Essayer sans token si la première tentative a échoué
      if (token) {
        try {
          const result = await axios.get(`${process.env.REACT_APP_BACK_URL}/api/user/regions/`);
          setRegions(result.data);
          console.log('✅ Régions chargées (sans token):', result.data.length);
        } catch (fallbackError) {
          console.error('Erreur fallback:', fallbackError);
          showError('Impossible de charger les régions');
        }
      } else {
        showError('Impossible de charger les régions');
      }
    }
  };

  const getTypes = async (token) => {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const result = await axios.get(`${process.env.REACT_APP_BACK_URL}/api/type/`, config);
      setRegionTypes(result.data);
      console.log('✅ Types chargés:', result.data.length);
    } catch (error) {
      console.error('Erreur lors du chargement des types:', error);

      // Essayer sans token si la première tentative a échoué
      if (token) {
        try {
          const result = await axios.get(`${process.env.REACT_APP_BACK_URL}/api/type/`);
          setRegionTypes(result.data);
          console.log('✅ Types chargés (sans token):', result.data.length);
        } catch (fallbackError) {
          console.error('Erreur fallback types:', fallbackError);
        }
      }
    }
  };

  const getProvinces = async (token) => {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const result = await axios.get(`${process.env.REACT_APP_BACK_URL}/api/provinces/`, config);
      setRegionProvinces(result.data);
      console.log('✅ Provinces chargées:', result.data.length);
    } catch (error) {
      console.error('Erreur lors du chargement des provinces:', error);

      // Essayer sans token si la première tentative a échoué
      if (token) {
        try {
          const result = await axios.get(`${process.env.REACT_APP_BACK_URL}/api/provinces/`);
          setRegionProvinces(result.data);
          console.log('✅ Provinces chargées (sans token):', result.data.length);
        } catch (fallbackError) {
          console.error('Erreur fallback provinces:', fallbackError);
        }
      }
    }
  };

  // Fonctions pour les modals
  const handleShowMap = (region) => {
    setSelectedRegion(region);
    setShowMapModal(true);
  };

  const handleShare = (region) => {
    setSelectedRegion(region);
    const url = `${window.location.origin}/region/${region.id_region}`;
    setShareUrl(url);
    setShowShareModal(true);
  };

  const closeMapModal = () => {
    setShowMapModal(false);
    setSelectedRegion(null);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setSelectedRegion(null);
    setShareUrl('');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showSuccess('Lien copié dans le presse-papier !');
    } catch (err) {
      console.error('Erreur lors de la copie :', err);
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showSuccess('Lien copié dans le presse-papier !');
    }
  };

  // Recherche avec suggestions
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length > 2) {
      const suggestions = regions.filter(region =>
        region.nom.toLowerCase().includes(value.toLowerCase()) ||
        JSON.parse(region.liste_site).some(site =>
          site.toLowerCase().includes(value.toLowerCase())
        )
      ).slice(0, 5);
      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    setSearchTerm(suggestion.nom);
    setShowSuggestions(false);
    const element = document.getElementById(`region-${suggestion.id_region}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.animation = 'highlight 2s ease';
    }
  };

  // Filtrage des régions
  useEffect(() => {
    const results = regions.filter(region => {
      const matchesSearch = region.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.parse(region.liste_site).some(highlight =>
          highlight.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesType = !selectedType || region.id_type == selectedType;
      const matchesProvince = !selectedProvince || region.id_province == selectedProvince;

      return matchesSearch && matchesType && matchesProvince;
    });

    setFilteredRegions(results);
  }, [searchTerm, selectedType, selectedProvince, regions]);

  const clearSearch = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedProvince('');
    setShowSuggestions(false);
    showInfo('Filtres réinitialisés');
  };

  // Fonction pour retourner en haut de la page
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Gestion de la chatbox des destinations
  const toggleChatbox = () => {
    setShowChatbox(!showChatbox);
    if (!showChatbox && chatInputRef.current) {
      setTimeout(() => {
        chatInputRef.current.focus();
      }, 100);
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // Ajouter le message de l'utilisateur
    const userMessage = {
      id: chatMessages.length + 1,
      text: chatInput,
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatbotTyping(true);

    // Réponses spécifiques aux destinations
    setTimeout(() => {
      const responses = [
        "Pour découvrir les régions par type, je vous recommande d'utiliser le filtre 'Tous les types' en haut de la page. Vous pouvez filtrer par plage, nature, culture ou aventure.",
        "La meilleure période pour visiter Madagascar est généralement d'avril à novembre (saison sèche). Les côtes sont agréables toute l'année, sauf pendant la saison des cyclones de janvier à mars.",
        "Pour un premier voyage à Madagascar, je vous suggère de combiner Antananarivo (culture), Nosy Be (plages) et Morondava (baobabs). 10-14 jours est une bonne durée.",
        "Pour des destinations moins touristiques, découvrez l'île Sainte-Marie pour les baleines, le Parc National d'Andasibe pour les lémuriens, ou le Sud pour ses paysages uniques.",
        "Chaque région de Madagascar a sa spécificité ! Les Hautes Terres pour la culture, la Côte Est pour la forêt tropicale, l'Ouest pour les baobabs, et le Nord pour les plages de rêve."
      ];

      const botMessage = {
        id: chatMessages.length + 2,
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: 'bot',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, botMessage]);
      setIsChatbotTyping(false);
    }, 1500);
  };

  const handleQuickOptionClick = (option) => {
    const userMessage = {
      id: chatMessages.length + 1,
      text: option,
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsChatbotTyping(true);

    // Réponses spécifiques selon l'option
    setTimeout(() => {
      let response = "";
      switch (option) {
        case "Trouver des régions par type":
          response = "Je peux vous aider ! Madagascar propose 4 types principaux de destinations : Plages (Nosy Be, Île Sainte-Marie), Nature (Parcs nationaux, réserves), Culture (Antananarivo, villages traditionnels) et Aventure (Tsingy, randonnées). Quel type vous intéresse ?";
          break;
        case "Découvrir les meilleures périodes":
          response = "Voici un guide rapide :\n• Côte Est : Avril à décembre (éviter janvier-mars)\n• Côte Ouest : Mai à octobre (meilleure période)\n• Hautes Terres : Avril à novembre (températures douces)\n• Sud : Avril à décembre (très sec)\nQuelle région vous intéresse ?";
          break;
        case "Conseils pour un premier voyage":
          response = "Conseils essentiels :\n1. Prévoir 10-14 jours minimum\n2. Combinez 2-3 régions max\n3. Réservez les vols intérieurs à l'avance\n4. Prévoyez des espèces pour les marchés locaux\n5. Vaccins : fièvre jaune recommandée\nAvez-vous des questions spécifiques ?";
          break;
        case "Destinations hors des sentiers battus":
          response = "Destinations authentiques :\n• Parc National d'Ankarana (tsingy)\n• Réserve de Nahampoana\n• Canal des Pangalanes\n• Massif de l'Isalo\n• Village d'Ambositra (artisanat)\nCes lieux préservent l'authenticité malgache !";
          break;
        default:
          response = "Je peux vous aider avec cela. Pourriez-vous me donner plus de détails sur ce que vous cherchez ?";
      }

      const botMessage = {
        id: chatMessages.length + 2,
        text: response,
        sender: 'bot',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, botMessage]);
      setIsChatbotTyping(false);
    }, 1000);
  };

  // Générer les étoiles de notation
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <i
          key={`full-${i}`}
          className={`fas fa-star ${styles.starAnimation}`}
          style={{ animationDelay: `${i * 0.1}s` }}
        ></i>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <i
          key="half"
          className={`fas fa-star-half-alt ${styles.starAnimation}`}
          style={{ animationDelay: `${fullStars * 0.1}s` }}
        ></i>
      );
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <i
          key={`empty-${i}`}
          className={`far fa-star ${styles.starAnimation}`}
          style={{ animationDelay: `${(fullStars + (hasHalfStar ? 1 : 0) + i) * 0.1}s` }}
        ></i>
      );
    }

    return stars;
  };

  return (
    <div className={`${styles["regions-page"]} ${styles["home-container"]}`}>
      {/* Header amélioré avec animation */}
      <header className={`${styles["header"]} ${styles.animatedHeader}`}>
        <div className={styles["logo-container"]}>
          <Link to="/" className={styles["logo"]}>
            <div className={styles["logo-animation"]}>
              <img src={logos} alt="MadaTour Logo" className={styles["logo-img"]} />
              <div className={styles["logo-glow"]}></div>
            </div>
            <span className={styles["logo-text"]}>
              Mada<span className={styles["logo-accent"]}>Tour</span>
            </span>
          </Link>
        </div>

        <nav className={styles["nav-container"]}>
          <div className={styles["nav-links"]}>
            <Link to="/search" className={styles["nav-link"]}>
              <i className="fas fa-search"></i>
              Sites
            </Link>
            <Link to="/regions" className={`${styles["nav-link"]} ${styles["active"]}`}>
              <i className="fas fa-map-marked-alt"></i>
              Destinations
            </Link>
            <Link to="/activities" className={styles["nav-link"]}>
              <i className="fas fa-hiking"></i>
              Activités
            </Link>
            <Link to="/blog" className={styles["nav-link"]}>
              <i className="fas fa-book-open"></i>
              Conseils
            </Link>
            <Link to="/about" className={styles["nav-link"]}>
              <i className="fas fa-info-circle"></i>
              À propos
            </Link>
          </div>

          <div className={styles["auth-section"]}>
            {/* Bouton AI - CORRIGÉ pour ouvrir un modal */}
            <button
              className={styles["ai-button"]}
              onClick={handleOpenAI}
              title="Assistant IA de voyage"
            >
              <i className="fas fa-robot"></i>
              <span className={styles["ai-tooltip"]}>Assistant IA</span>
            </button>

            {isLoggedIn ? (
              <div className={styles["user-dropdown"]}>
                <button className={styles["auth-button-on"]}>
                  <i className="fas fa-user-circle"></i>
                  <span>Mon compte</span>
                  <i className="fas fa-chevron-down"></i>
                </button>
                <div className={styles["dropdown-menu"]}>
                  <Link to="/dashboard" className={styles["dropdown-item"]}>
                    <i className="fas fa-tachometer-alt"></i> Tableau de bord
                  </Link>
                  <Link to="/dashboard/favorites" className={styles["dropdown-item"]}>
                    <i className="fas fa-heart"></i> Mes favoris
                  </Link>
                  <Link to="/dashboard/reviews" className={styles["dropdown-item"]}>
                    <i className="fas fa-star"></i> Mes avis
                  </Link>
                  <Link to="/dashboard/preferences" className={styles["dropdown-item"]}>
                    <i className="fas fa-sliders-h"></i> Mes préférences
                  </Link>
                  <Link to="/my-trip" className={styles["dropdown-item"]}>
                    <i className="fas fa-suitcase"></i> Mes voyages
                  </Link>
                  <Link to="/dashboard/history" className={styles["dropdown-item"]}>
                    <i className="fas fa-history"></i> Mes historiques
                  </Link>
                  <div className={styles["dropdown-divider"]}></div>
                  <button onClick={handleLogout} className={styles["dropdown-item"]}>
                    <i className="fas fa-sign-out-alt"></i> Déconnexion
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className={`${styles["auth-button"]} ${styles["secondary"]}`}>
                  <i className="fas fa-sign-in-alt"></i>
                  Connexion
                </Link>
                <Link to="/register" className={`${styles["auth-button"]} ${styles["primary"]}`}>
                  <i className="fas fa-user-plus"></i>
                  Inscription
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero section avec animations améliorées */}
      <section className={styles["hero"]} ref={heroRef}>
        <div className={styles["hero-carousel"]}>
          {heroImages.map((img, index) => (
            <div
              key={index}
              className={clsx(
                styles["hero-slide"],
                styles["anime-slide"],
                { [styles.active]: index === currentImageIndex }
              )}
              style={{
                backgroundImage: `url(${img})`,
                animationDelay: `${index * 0.5}s`
              }}
            >
              <div className={styles["slide-overlay"]}></div>
              <div className={styles["anime-glow"]}></div>
            </div>
          ))}
        </div>

        <div className={styles["hero-content"]}>
          <h1 className={styles["anime-text"]}>
            <span className={styles["text-gradient"]}>
              Explorez les <span className={styles["text-highlight"]}>trésors</span> de Madagascar
            </span>
          </h1>

          <div className={styles["typing-container"]}>
            <p className={styles["typing-text"]}>
              {typingText}
              <span className={styles["cursor"]}>|</span>
            </p>
          </div>

          <div className={styles["hero-search-container"]}>
            <div className={styles["hero-search"]}>
              <input
                type="text"
                placeholder="Rechercher une région, un site touristique..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => searchTerm.length > 2 && setShowSuggestions(true)}
              />
              <button><i className="fas fa-search"></i></button>

              {showSuggestions && searchSuggestions.length > 0 && (
                <div className={styles["search-suggestions"]}>
                  {searchSuggestions.map(suggestion => (
                    <div
                      key={suggestion.id_region}
                      className={styles["suggestion-item"]}
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      <i className="fas fa-map-marker-alt"></i>
                      <div className={styles["suggestion-info"]}>
                        <span className={styles["suggestion-name"]}>{suggestion.nom}</span>
                        <span className={styles["suggestion-sites"]}>
                          {JSON.parse(suggestion.liste_site).slice(0, 2).join(', ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {regions.length > 0 && (
              <div className={styles["search-tags"]}>
                <span>Populaire : </span>
                {regions.slice(0, 3).map(region => (
                  <button
                    key={region.id_region}
                    className={styles["search-tag"]}
                    onClick={() => setSearchTerm(region.nom)}
                  >
                    {region.nom}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles["hero-stats"]}>
            {[
              { icon: 'fas fa-map-marked-alt', label: 'Régions', value: regions.length },
              { icon: 'fas fa-mountain', label: 'Sites', value: '100+' },
              { icon: 'fas fa-star', label: 'Favoris', value: favorites.length },
              { icon: 'fas fa-leaf', label: 'Biodiversité', value: '100%' }
            ].map((stat, index) => (
              <div
                key={index}
                className={`${styles["stat-item"]} ${styles["anime-stat"]}`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className={styles["stat-icon"]}>
                  <i className={stat.icon}></i>
                </div>
                <div className={styles["stat-content"]}>
                  <span className={styles["stat-value"]}>{stat.value}</span>
                  <span className={styles["stat-label"]}>{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating elements anime */}
        <div className={styles["floating-elements"]}>
          <div className={styles["floating-leaf"]}></div>
          <div className={styles["floating-baobab"]}></div>
          <div className={styles["floating-wave"]}></div>
        </div>
      </section>

      {/* Assistant IA de recommandation */}
      <Suspense fallback={<div className={styles["loading-ai"]}>Chargement de l'assistant IA...</div>}>
        {showRecommendationAI && (
          <RecommendationAI onClose={handleCloseAI} />
        )}
      </Suspense>

      {/* Filters Section */}
      <section className={styles["region-filters"]}>
        <div className={styles["container"]}>
          <div className={styles["section-header"]}>
            <h2>
              <span className={styles["title-anime"]}>
                Filtrer par <span className={styles["title-accent"]}>provinces</span>
              </span>
            </h2>
            <p className={styles["subtitle-anime"]}>
              Explorez les régions par province pour planifier votre voyage
            </p>
          </div>

          <div className={styles["filter-buttons"]}>
            <button
              className={clsx(styles["filter-btn"], {
                [styles['active']]: selectedProvince === ''
              })}
              onClick={() => setSelectedProvince('')}
            >
              <i className="fas fa-globe"></i> Toutes les provinces
            </button>
            {regionProvinces.length > 0 ? (
              regionProvinces.map(provinces => (
                <button
                  key={provinces.id_province}
                  className={clsx(styles["filter-btn"], {
                    [styles['active']]: selectedProvince === provinces.id_province
                  })}
                  onClick={() => setSelectedProvince(provinces.id_province)}
                >
                  <i className={provinces.icon}></i> {provinces.nom}
                </button>
              ))
            ) : (
              <p className={styles['loading-text']}>Chargement des provinces...</p>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className={styles["regions-main"]}>
        <div className={styles["container"]}>
          <div className={styles["results-header"]}>
            <div className={styles["results-count"]}>
              <span>{filteredRegions.length}</span> {filteredRegions.length === 1 ? 'région trouvée' : 'régions trouvées'}
            </div>
            <div className={styles["sort-options"]}>
              <span>Trier par :</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className={styles["type-select"]}
              >
                <option value="">Tous les types</option>
                {regionTypes.map(type => (
                  <option key={type.id_type} value={type.id_type}>{type.libele}</option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className={styles["loading-container"]}>
              <div className={styles["loading-spinner"]}></div>
              <p>Chargement des destinations...</p>
              <p className={styles["loading-subtext"]}>Veuillez patienter quelques instants</p>
            </div>
          ) : filteredRegions.length > 0 ? (
            <div className={styles["regions-grid"]}>
              {filteredRegions.map((region, index) => (
                <div
                  key={region.id_region}
                  id={`region-${region.id_region}`}
                  className={clsx(
                    styles["region-card"],
                    { [styles['expanded']]: expandedCards[region.id_region] }
                  )}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Badge Populaire */}
                  {region.total_site > 5 && (
                    <div className={styles["popular-badge"]}>
                      <i className="fas fa-fire"></i> Populaire
                    </div>
                  )}

                  <div className={styles["card-image"]}>
                    <img
                      src={region.image || 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80'}
                      alt={region.nom}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80';
                      }}
                    />
                    <div className={styles["image-overlay"]}>
                      <div className={styles["favorite-section"]}>
                        <button
                          className={clsx(styles["favorite-btn"], {
                            [styles['favorited']]: favorites.includes(region.id_region)
                          })}
                          onClick={() => toggleFavorite(region.id_region)}
                        >
                          <i className={favorites.includes(region.id_region) ? 'fas fa-heart' : 'far fa-heart'}></i>
                        </button>
                        <span className={styles["region-name-overlay"]}>
                          {regionProvinces.find(province => province.id_province == region.id_province)?.nom || 'Province inconnue'}
                        </span>
                      </div>
                      <div className={styles["region-badge"]}>
                        <i className="fas fa-map-marker-alt"></i> {region.total_site || 0} sites
                      </div>
                    </div>
                  </div>

                  <div className={styles["card-content"]}>
                    <div className={styles["card-header"]}>
                      <h3>{region.nom}</h3>
                      <span className={styles["region-type"]}>
                        <i className={regionTypes.find(t => t.id_type === region.id_type)?.icon || "fas fa-map"}></i>
                        {regionTypes.find(t => t.id_type === region.id_type)?.libele || 'Type inconnu'}
                      </span>
                    </div>

                    <div className={styles["region-meta"]}>
                      <span className={styles["meta-item"]}>
                        <i className="fas fa-calendar-alt"></i> {region.meilleure_periode || 'Toute l\'année'}
                      </span>
                      <span className={styles["meta-item"]}>
                        <i className="fas fa-cloud"></i> {region.climat_general || 'Climat tropical'}
                      </span>
                    </div>

                    <p className={styles["description"]}>
                      {expandedCards[region.id_region]
                        ? region.description
                        : `${(region.description || '').substring(0, 120)}...`
                      }
                    </p>

                    <button
                      className={styles["read-more-btn"]}
                      onClick={() => toggleCardExpansion(region.id_region)}
                    >
                      {expandedCards[region.id_region] ? 'Voir moins' : 'Lire plus'}
                      <i className={`fas fa-chevron-${expandedCards[region.id_region] ? 'up' : 'down'}`}></i>
                    </button>

                    {/* Contenu expandable */}
                    <div className={clsx(
                      styles["expandable-content"],
                      { [styles['expanded']]: expandedCards[region.id_region] }
                    )}>
                      <div className={styles["highlights"]}>
                        <h4><i className="fas fa-star"></i> À découvrir :</h4>
                        <div className={styles["highlights-grid"]}>
                          {region.liste_site ? (
                            JSON.parse(region.liste_site).map((highlight, index) => (
                              <span key={index} className={styles["highlight-item"]}>
                                <i className="fas fa-landmark"></i> {highlight}
                              </span>
                            ))
                          ) : (
                            <p>Aucun site spécifié</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles["card-actions"]}>
                      <Link to={`/region/${region.id_region}`} className={styles["explore-btn"]}>
                        <i className="fas fa-compass"></i>
                        Explorer la région
                      </Link>
                      <button
                        className={styles["map-btn"]}
                        title="Voir sur la carte"
                        onClick={() => handleShowMap(region)}
                        disabled={!region.latitude || !region.longitude}
                      >
                        <i className="fas fa-map-marked-alt"></i>
                      </button>
                      <button
                        className={styles["share-btn"]}
                        title="Partager"
                        onClick={() => handleShare(region)}
                      >
                        <i className="fas fa-share-alt"></i>
                      </button>
                    </div>
                  </div>

                  {/* Effets anime pour la carte */}
                  <div className={styles["card-glow"]}></div>
                  <div className={styles["card-sparkles"]}></div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles["no-results"]}>
              <div className={styles["no-results-content"]}>
                <i className="fas fa-search"></i>
                <h3>Aucune région ne correspond à votre recherche</h3>
                <p>Essayez d'ajuster vos filtres ou de rechercher d'autres termes</p>
                <button onClick={clearSearch} className={styles["clear-filters-btn"]}>
                  <i className="fas fa-filter"></i> Réinitialiser les filtres
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Section Pourquoi choisir MadaTour avec animations */}
      <section
        className={`${styles["why-us-section"]} ${styles["anime-section"]}`}
        data-animate="true"
      >
        <div className={styles["section-header"]}>
          <h2>
            <span className={styles["title-anime"]}>
              Pourquoi explorer <span className={styles["title-accent"]}>Madagascar</span> ?
            </span>
          </h2>
          <p className={styles["subtitle-anime"]}>
            Une expérience de voyage unique et authentique vous attend
          </p>
        </div>

        <div className={styles["features-grid"]}>
          {[
            {
              icon: 'fas fa-leaf',
              title: 'Biodiversité unique',
              description: 'Découvrez 5% des espèces animales et végétales mondiales',
              color: 'green',
              delay: 0
            },
            {
              icon: 'fas fa-users',
              title: 'Cultures authentiques',
              description: 'Rencontrez des communautés accueillantes et leurs traditions',
              color: 'orange',
              delay: 0.1
            },
            {
              icon: 'fas fa-water',
              title: 'Plages paradisiaques',
              description: 'Des côtes préservées et des eaux cristallines',
              color: 'blue',
              delay: 0.2
            },
            {
              icon: 'fas fa-mountain',
              title: 'Paysages époustouflants',
              description: 'De la forêt tropicale aux formations rocheuses uniques',
              color: 'purple',
              delay: 0.3
            }
          ].map((feature, index) => (
            <div
              key={index}
              className={`${styles["feature-card"]} ${styles[`feature-${feature.color}`]}`}
              style={{ animationDelay: `${feature.delay}s` }}
            >
              <div className={styles["feature-icon-wrapper"]}>
                <div className={styles["feature-icon"]}>
                  <i className={feature.icon}></i>
                </div>
                <div className={styles["feature-glow"]}></div>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className={styles["feature-wave"]}></div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal pour la carte */}
      {showMapModal && selectedRegion && (
        <div className={styles['modal-overlay']} onClick={closeMapModal}>
          <div
            className={styles['modal-content']}
          >
            <div className={styles['modal-header']}>
              <h2>
                <i className="fas fa-map-marked-alt" style={{ color: '#2a6f97' }}></i>
                {selectedRegion.nom} - Localisation
              </h2>
              <button className={styles['modal-close']} onClick={closeMapModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles['modal-body']}>
              <SimpleMap
                latitude={selectedRegion.latitude}
                longitude={selectedRegion.longitude}
                regionName={selectedRegion.nom}
              />

              <div className={styles['location-details']}>
                <div className={styles['detail-item']}>
                  <i className="fas fa-map-pin" style={{ color: '#f77f00' }}></i>
                  <div>
                    <strong>Coordonnées GPS</strong>
                    <p>Latitude: {selectedRegion.latitude?.toFixed(6) || 'Non disponible'}</p>
                    <p>Longitude: {selectedRegion.longitude?.toFixed(6) || 'Non disponible'}</p>
                  </div>
                </div>
                <div className={styles['detail-item']}>
                  <i className="fas fa-info-circle" style={{ color: '#2a6f97' }}></i>
                  <div>
                    <strong>Informations</strong>
                    <p>Province: {regionProvinces.find(p => p.id_province == selectedRegion.id_province)?.nom || 'Inconnue'}</p>
                    <p>Type: {regionTypes.find(t => t.id_type === selectedRegion.id_type)?.libele || 'Non spécifié'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles['modal-footer']}>
              <button className={styles['modal-btn-secondary']} onClick={closeMapModal}>
                Fermer
              </button>
              <a
                href={`https://www.google.com/maps?q=${selectedRegion.latitude},${selectedRegion.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles['modal-btn-primary']}
              >
                <i className="fas fa-external-link-alt"></i> Ouvrir dans Google Maps
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour partager */}
      {showShareModal && selectedRegion && (
        <div className={styles['modal-overlay']} onClick={closeShareModal}>
          <div
            className={styles['modal-content']}
          >
            <div className={styles['modal-header']}>
              <h2>
                <i className="fas fa-share-alt" style={{ color: '#2a6f97' }}></i>
                Partager {selectedRegion.nom}
              </h2>
              <button className={styles['modal-close']} onClick={closeShareModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles['modal-body']}>
              <div className={styles['share-options']}>
                <div className={styles['share-link-container']}>
                  <p className={styles['share-label']}>
                    <i className="fas fa-link" style={{ color: '#f77f00' }}></i>
                    Lien à partager :
                  </p>
                  <div className={styles['link-input-group']}>
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className={styles['link-input']}
                    />
                    <button className={styles['copy-btn']} onClick={copyToClipboard}>
                      <i className="fas fa-copy"></i> Copier
                    </button>
                  </div>
                </div>

                <div className={styles['social-share']}>
                  <p className={styles['share-label']}>
                    <i className="fas fa-share-square" style={{ color: '#f77f00' }}></i>
                    Partager sur :
                  </p>
                  <div className={styles['social-buttons']}>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles['social-btn']}
                      style={{ backgroundColor: '#1877F2' }}
                    >
                      <i className="fab fa-facebook-f"></i> Facebook
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Découvrez ${selectedRegion.nom} sur MadaTour!`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles['social-btn']}
                      style={{ backgroundColor: '#1DA1F2' }}
                    >
                      <i className="fab fa-twitter"></i> Twitter
                    </a>
                    <a
                      href={`mailto:?subject=${encodeURIComponent(`Découvrez ${selectedRegion.nom}`)}&body=${encodeURIComponent(`Je te partage cette magnifique région de Madagascar : ${shareUrl}`)}`}
                      className={styles['social-btn']}
                      style={{ backgroundColor: '#EA4335' }}
                    >
                      <i className="fas fa-envelope"></i> Email
                    </a>
                    <a
                      href={`whatsapp://send?text=${encodeURIComponent(`Découvrez ${selectedRegion.nom} sur MadaTour : ${shareUrl}`)}`}
                      className={styles['social-btn']}
                      style={{ backgroundColor: '#25D366' }}
                    >
                      <i className="fab fa-whatsapp"></i> WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles['modal-footer']}>
              <button className={styles['modal-btn-secondary']} onClick={closeShareModal}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section améliorée */}
      {/* Section CTA conditionnelle - REMPLACER TOUTE LA SECTION */}
      {!isLoggedIn ? (
        <section className={styles["cta-section"]}>
          <div className={styles["cta-content"]}>
            <div className={styles["cta-animation"]}>
              <div className={styles["cta-orbs"]}>
                <div className={styles["orb-1"]}></div>
                <div className={styles["orb-2"]}></div>
                <div className={styles["orb-3"]}></div>
              </div>
            </div>

            <h2>Prêt à explorer Madagascar ?</h2>
            <p>Créez votre compte et planifiez votre voyage dès maintenant</p>

            <div className={styles["cta-buttons"]}>
              <Link to="/register" className={`${styles["cta-button"]} ${styles["primary"]}`}>
                <i className="fas fa-rocket"></i>
                <span>S'inscrire gratuitement</span>
                <div className={styles["button-particles"]}></div>
              </Link>
              <Link to="/contact" className={`${styles["cta-button"]} ${styles["secondary"]}`}>
                <i className="fas fa-envelope"></i>
                <span>Contactez-nous</span>
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className={styles["user-cta-section"]}>
          <div className={styles["user-cta-content"]}>
            <div className={styles["user-cta-animation"]}>
              <div className={styles["user-cta-orbs"]}>
                <div className={styles["user-orb-1"]}></div>
                <div className={styles["user-orb-2"]}></div>
              </div>
            </div>

            <h2>Continuez votre aventure à Madagascar !</h2>
            <p>Explorez plus de destinations, gérez vos favoris et planifiez vos prochains voyages</p>

            <div className={styles["user-cta-buttons"]}>
              <Link to="/dashboard" className={`${styles["user-cta-button"]} ${styles["primary"]}`}>
                <i className="fas fa-compass"></i>
                <span>Voir mon tableau de bord</span>
              </Link>
              <Link to="/activities" className={`${styles["user-cta-button"]} ${styles["secondary"]}`}>
                <i className="fas fa-hiking"></i>
                <span>Découvrir des activités</span>
              </Link>
              <Link to="/profile" className={`${styles["user-cta-button"]} ${styles["tertiary"]}`}>
                <i className="fas fa-user-edit"></i>
                <span>Compléter mon profil</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer amélioré */}
      <footer className={styles["footer"]}>
        <div className={styles["footer-content"]}>
          <div className={styles["footer-main"]}>
            <div className={styles["footer-brand"]}>
              <Link to="/" className={styles["footer-logo"]}>
                <div className={styles["footer-logo-animation"]}>
                  <img src={logos} alt="MadaTour Logo" />
                  <div className={styles["logo-aura"]}></div>
                </div>
                <span className={styles["footer-logo-text"]}>
                  Mada<span className={styles["footer-logo-accent"]}>Tour</span>
                </span>
              </Link>
              <p className={styles["footer-description"]}>
                Votre guide ultime pour explorer les merveilles de Madagascar.
                Tourisme responsable et authentique.
              </p>

              <div className={styles["social-links-home"]}>
                {['facebook-f', 'instagram', 'twitter', 'youtube', 'tiktok'].map((platform) => (
                  <a
                    key={platform}
                    href={`https://${platform}.com/madatour`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles["social-link"]}
                    aria-label={platform}
                  >
                    <i className={`fab fa-${platform}`}></i>
                    <div className={styles["social-glow"]}></div>
                  </a>
                ))}
              </div>
            </div>

            <div className={styles["footer-links"]}>
              <div className={styles["links-column"]}>
                <h3>
                  <i className="fas fa-compass"></i>
                  Destinations
                </h3>
                <ul>
                  {['Régions', 'Sites touristiques', 'Activités', 'Itinéraires', 'Guides locaux'].map((item) => (
                    <li key={item}>
                      <Link to={`/${item.toLowerCase().replace(' ', '-')}`}>
                        <i className="fas fa-chevron-right"></i>
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles["links-column"]}>
                <h3>
                  <i className="fas fa-info-circle"></i>
                  Informations
                </h3>
                <ul>
                  {['Conseils voyage', 'À propos', 'FAQ', 'Contact', 'Blog'].map((item) => (
                    <li key={item}>
                      <Link to={`/${item.toLowerCase().replace(' ', '-')}`}>
                        <i className="fas fa-chevron-right"></i>
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles["links-column"]}>
                <h3>
                  <i className="fas fa-shield-alt"></i>
                  Légal
                </h3>
                <ul>
                  {['Conditions d\'utilisation', 'Politique de confidentialité', 'Cookies', 'Mentions légales'].map((item) => (
                    <li key={item}>
                      <Link to={`/${item.toLowerCase().replace(' ', '-')}`}>
                        <i className="fas fa-chevron-right"></i>
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className={styles["footer-bottom"]}>
            <div className={styles["newsletter"]}>
              <h4>
                <i className="fas fa-envelope"></i>
                Restez informé
              </h4>
              <form className={styles["newsletter-form"]}>
                <input
                  type="email"
                  placeholder="Votre email"
                  className={styles["newsletter-input"]}
                />
                <button type="submit" className={styles["newsletter-button"]}>
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            </div>

            <p className={styles["copyright"]}>
              <i className="fas fa-copyright"></i>
              {new Date().getFullYear()} MadaTour. Tous droits réservés.
              <span className={styles["made-with"]}>
                Fait avec <i className="fas fa-heart"></i> à Madagascar
              </span>
            </p>

            <div className={styles["footer-apps"]}>
              <span>Téléchargez notre application :</span>
              <div className={styles["app-buttons"]}>
                <a href="/" className={styles["app-button"]}>
                  <i className="fab fa-apple"></i>
                  <div>
                    <span>Télécharger sur</span>
                    <strong>App Store</strong>
                  </div>
                </a>
                <a href="/" className={styles["app-button"]}>
                  <i className="fab fa-google-play"></i>
                  <div>
                    <span>Disponible sur</span>
                    <strong>Google Play</strong>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Animation footer */}
        <div className={styles["footer-wave"]}></div>
        <div className={styles["footer-stars"]}>
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={styles["star"]}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`
              }}
            ></div>
          ))}
        </div>
      </footer>

      {/* Chatbox des destinations */}
      <div className={styles["chatbox-container"]} ref={chatboxRef}>
        <button
          className={`${styles["chatbox-toggle"]} ${showChatbox ? styles.active : ''}`}
          onClick={toggleChatbox}
          aria-label={showChatbox ? "Fermer le chat" : "Ouvrir le chat"}
        >
          <i className="fas fa-map-marked-alt"></i>
          {!showChatbox && <span className={styles["notification-badge"]}>1</span>}
        </button>

        {showChatbox && (
          <div className={styles["chatbox-window"]}>
            <div className={styles["chatbox-header"]}>
              <div className={styles["chatbox-header-content"]}>
                <div className={styles["chatbox-avatar"]}>
                  <i className="fas fa-compass"></i>
                  <div className={styles["avatar-status"]}></div>
                </div>
                <div className={styles["chatbox-info"]}>
                  <h3>Guide des Destinations</h3>
                  <p>Spécialiste Madagascar • En ligne</p>
                </div>
              </div>
              <button
                className={styles["chatbox-close"]}
                onClick={toggleChatbox}
                aria-label="Fermer le chat"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className={styles["chatbox-messages"]} ref={chatMessagesRef}>
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`${styles["message"]} ${styles[message.sender]}`}
                >
                  <div className={styles["message-content"]}>
                    <p>{message.text}</p>
                    <span className={styles["message-time"]}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {message.options && (
                    <div className={styles["message-options"]}>
                      {message.options.map((option, idx) => (
                        <button
                          key={idx}
                          className={styles["option-button"]}
                          onClick={() => handleQuickOptionClick(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isChatbotTyping && (
                <div className={`${styles["message"]} ${styles.bot}`}>
                  <div className={styles["typing-indicator"]}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </div>

            <form className={styles["chatbox-input-container"]} onSubmit={handleChatSubmit}>
              <div className={styles["input-wrapper"]}>
                <input
                  ref={chatInputRef}
                  type="text"
                  placeholder="Posez-moi une question sur les destinations..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className={styles["chatbox-input"]}
                />
                <div className={styles["input-actions"]}>
                  <button
                    type="button"
                    className={styles["input-action-button"]}
                    title="Joindre un fichier"
                  >
                    <i className="fas fa-paperclip"></i>
                  </button>
                  <button
                    type="button"
                    className={styles["input-action-button"]}
                    title="Émojis"
                  >
                    <i className="fas fa-smile"></i>
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className={styles["chatbox-send-button"]}
                disabled={!chatInput.trim()}
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Bouton retour en haut amélioré */}
      <button
        className={`${styles["back-to-top"]} ${showBackToTop ? styles.visible : ''}`}
        onClick={scrollToTop}
        aria-label="Retour en haut"
      >
        <i className="fas fa-chevron-up"></i>
        <div className={styles["back-to-top-glow"]}></div>
      </button>
    </div>
  );
};

export default Regions;