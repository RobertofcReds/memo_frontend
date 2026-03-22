import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import clsx from 'clsx';
import styles from './css/Activities.module.css';
import logos from '../images/logo-site4.png';

// Composant IA de recommandation (chargement différé pour performance)
const RecommendationAI = React.lazy(() => import('../components/recommendation/RecommendationAI'));

// Données d'activités enrichies
const activityCategories = [
  {
    id: 1,
    name: 'Randonnée',
    icon: 'fas fa-hiking',
    type: 'nature',
    color: 'linear-gradient(135deg, #48bb78 0%, #68d391 100%)',
    activities: [
      {
        id: 1,
        name: 'Parc National d\'Andringitra',
        difficulty: 'Difficile',
        highlight: "L'un des meilleurs treks de Madagascar avec vue sur le Pic Boby (2658m)",
        image: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Andringitra%2C_Madagascar_by_Effervescing_Elephant-09.jpg',
        rating: 4.9,
        duration: '3-5 jours',
        bestSeason: 'Avril à Novembre',
        price: 'À partir de 250€',
        participants: '2-8 personnes',
        included: ['Guide local', 'Nuit en refuge', 'Repas inclus']
      },
      {
        id: 2,
        name: 'Massif de l\'Isalo',
        difficulty: 'Moyen',
        highlight: "Paysages lunaires, canyons et piscines naturelles",
        image: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Massif_de_l%27Isalo.jpg',
        rating: 4.7,
        duration: '2-3 jours',
        bestSeason: 'Toute l\'année',
        price: 'À partir de 180€',
        participants: '2-12 personnes',
        included: ['Guide certifié', 'Transport', 'Pique-nique']
      },
      {
        id: 3,
        name: 'Montagne d\'Ambre',
        difficulty: 'Facile',
        highlight: "Forêt tropicale luxuriante, cascades et lémuriens",
        image: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Cryptomeria_japonica_-_c%C3%A8dre_du_japon.jpg',
        rating: 4.5,
        duration: '1 jour',
        bestSeason: 'Mai à Octobre',
        price: 'À partir de 75€',
        participants: '1-15 personnes',
        included: ['Guide naturaliste', 'Entrée parc', 'Déjeuner']
      },
      {
        id: 4,
        name: 'Tsingy de Bemaraha',
        difficulty: 'Difficile',
        highlight: "Forêt de pierres unique au monde, classée UNESCO",
        image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        rating: 4.8,
        duration: '2-3 jours',
        bestSeason: 'Avril à Novembre',
        price: 'À partir de 300€',
        participants: '4-6 personnes',
        included: ['Guide spécialisé', 'Équipement sécurité', 'Hébergement']
      }
    ]
  },
  {
    id: 2,
    name: 'Plongée & Snorkeling',
    icon: 'fas fa-water',
    type: 'aquatique',
    color: 'linear-gradient(135deg, #4299e1 0%, #63b3ed 100%)',
    activities: [
      {
        id: 5,
        name: 'Nosy Tanikely',
        difficulty: 'Tous niveaux',
        highlight: "Réserve marine protégée avec tortues géantes et poissons tropicaux",
        image: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/NosyTanikely.jpg',
        rating: 4.8,
        duration: '1/2 journée',
        bestSeason: 'Avril à Décembre',
        price: 'À partir de 65€',
        participants: '2-10 personnes',
        included: ['Équipement complet', 'Guide de plongée', 'Goûter']
      },
      {
        id: 6,
        name: 'Archipel des Radama',
        difficulty: 'Confirmé',
        highlight: "Coraux intacts et faune sous-marine abondante",
        image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        rating: 4.6,
        duration: 'Journée complète',
        bestSeason: 'Mai à Novembre',
        price: 'À partir de 120€',
        participants: '4-8 personnes',
        included: ['2 plongées', 'Repas à bord', 'Transport maritime']
      },
      {
        id: 7,
        name: 'Mer d\'Émeraude',
        difficulty: 'Intermédiaire',
        highlight: "Eaux cristallines et fonds marins spectaculaires",
        image: 'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        rating: 4.7,
        duration: '1 journée',
        bestSeason: 'Mars à Décembre',
        price: 'À partir de 95€',
        participants: '3-12 personnes',
        included: ['Snorkeling', 'Déjeuner barbecue', 'Photos sous-marines']
      }
    ]
  },
  {
    id: 3,
    name: 'Observation Faune',
    icon: 'fas fa-binoculars',
    type: 'wildlife',
    color: 'linear-gradient(135deg, #ed8936 0%, #fbd38d 100%)',
    activities: [
      {
        id: 8,
        name: 'Parc National de Ranomafana',
        difficulty: 'Lémuriens',
        highlight: "12 espèces de lémuriens dont le rare Hapalémur doré",
        image: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Ranomafana_-_Andriamamovoka_falls.jpg',
        rating: 4.7,
        duration: '1-2 jours',
        bestSeason: 'Septembre à Décembre',
        price: 'À partir de 85€',
        participants: '2-15 personnes',
        included: ['Guide naturaliste', 'Observation nocturne', 'Logement éco']
      },
      {
        id: 9,
        name: 'Réserve d\'Anja',
        difficulty: 'Lémuriens',
        highlight: "Rencontre avec les maki catta en liberté totale",
        image: 'https://upload.wikimedia.org/wikipedia/commons/0/06/Anja_r%C3%A9serve_%28Madagascar%29_-_03.JPG',
        rating: 4.4,
        duration: '1/2 journée',
        bestSeason: 'Toute l\'année',
        price: 'À partir de 45€',
        participants: '1-20 personnes',
        included: ['Guide local', 'Contribution communauté', 'Dégustation fruits']
      },
      {
        id: 10,
        name: 'Parc National Masoala',
        difficulty: 'Faune diversifiée',
        highlight: "Forêt primaire et lémuriens nocturnes",
        image: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Lowland_rainforest%2C_Masoala_National_Park%2C_Madagascar.jpg',
        rating: 4.8,
        duration: '3-5 jours',
        bestSeason: 'Avril à Novembre',
        price: 'À partir de 350€',
        participants: '2-6 personnes',
        included: ['Guide expert', 'Bivouac forêt', 'Observation baobabs']
      }
    ]
  },
  {
    id: 4,
    name: 'Aventure & Culture',
    icon: 'fas fa-landmark',
    type: 'culture',
    color: 'linear-gradient(135deg, #9f7aea 0%, #b794f4 100%)',
    activities: [
      {
        id: 11,
        name: 'Descente en pirogue',
        difficulty: 'Sportif',
        highlight: "Navigation traditionnelle sur les rivières malgaches",
        image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        rating: 4.6,
        duration: '1 journée',
        bestSeason: 'Mai à Octobre',
        price: 'À partir de 90€',
        participants: '2-4 personnes',
        included: ['Pirogues traditionnelles', 'Guide pêcheur', 'Déjeuner local']
      },
      {
        id: 12,
        name: 'Visite de villages',
        difficulty: 'Facile',
        highlight: "Immersion dans la vie quotidienne malgache",
        image: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Madagascar_-_Ambohimanga_Rova_02.jpg',
        rating: 4.5,
        duration: '1/2 journée',
        bestSeason: 'Toute l\'année',
        price: 'À partir de 55€',
        participants: '2-8 personnes',
        included: ['Guide communautaire', 'Atelier artisanal', 'Repas typique']
      }
    ]
  }
];

const seasonalActivities = [
  {
    id: 1,
    name: 'Observation des baleines',
    period: 'Juillet à Septembre',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Baleine_%C3%A0_bosse%2C_Sainte_Marie%2C_Madagascar_%2825979659352%29.jpg',
    description: 'Assistez au ballet des baleines à bosse dans le canal de Sainte-Marie, migration annuelle impressionnante',
    location: 'Île Sainte-Marie',
    rating: 4.9,
    type: 'spécial',
    price: 'À partir de 110€',
    duration: '1/2 journée'
  },
  {
    id: 2,
    name: 'Migration des oiseaux',
    period: 'Octobre à Décembre',
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Lake_Ravelobe%2C_Ankarafantsika_National_Park%2C_Madagascar.jpg',
    description: 'Observez des milliers d\'oiseaux migrateurs dans les zones humides uniques de Madagascar',
    location: 'Parc National d\'Ankarafantsika',
    rating: 4.6,
    type: 'ornithologie',
    price: 'À partir de 80€',
    duration: '1 journée'
  },
  {
    id: 3,
    name: 'Floraison des jacarandas',
    period: 'Octobre à Novembre',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    description: 'Admirez les rues violettes lors de la floraison spectaculaire des jacarandas',
    location: 'Antananarivo et région',
    rating: 4.7,
    type: 'botanique',
    price: 'À partir de 60€',
    duration: '1/2 journée'
  }
];

const activityTypes = [
  { id: 'all', name: 'Toutes les activités', icon: 'fas fa-globe', count: 12 },
  { id: 'nature', name: 'Nature', icon: 'fas fa-mountain', count: 4 },
  { id: 'aquatique', name: 'Aquatique', icon: 'fas fa-umbrella-beach', count: 3 },
  { id: 'wildlife', name: 'Faune', icon: 'fas fa-paw', count: 3 },
  { id: 'culture', name: 'Culture', icon: 'fas fa-landmark', count: 2 }
];

// Témoignages spécifiques aux activités
const activityTestimonials = [
  {
    id: 1,
    name: 'Marc D.',
    comment: "La randonnée dans l'Andringitra était épique ! Des paysages à couper le souffle et des guides locaux très compétents.",
    avatar: '👨',
    rating: 5,
    location: 'Lyon, France',
    activity: 'Randonnée à Andringitra',
    date: 'Août 2024'
  },
  {
    id: 2,
    name: 'Sophie L.',
    comment: "Plongée magique à Nosy Tanikely. Les tortues étaient au rendez-vous et le corail en excellente santé. À refaire !",
    avatar: '👩',
    rating: 4,
    location: 'Marseille, France',
    activity: 'Plongée à Nosy Tanikely',
    date: 'Juin 2024'
  },
  {
    id: 3,
    name: 'Élodie P.',
    comment: "Observer les baleines à Sainte-Marie était un rêve d'enfance. L'équipe a été professionnelle et respectueuse des animaux.",
    avatar: '👩',
    rating: 5,
    location: 'Paris, France',
    activity: 'Observation des baleines',
    date: 'Juillet 2024'
  },
  {
    id: 4,
    name: 'Thomas B.',
    comment: "Le trek dans les Tsingy était incroyablement bien organisé. Une aventure unique que je recommande à tous les amateurs de sensations fortes.",
    avatar: '👨',
    rating: 5,
    location: 'Toulouse, France',
    activity: 'Trek des Tsingy',
    date: 'Mai 2024'
  },
  {
    id: 5,
    name: 'Marie K.',
    comment: "Immersion culturelle exceptionnelle dans les villages. Les habitants sont accueillants et les traditions fascinantes.",
    avatar: '👩',
    rating: 4,
    location: 'Nice, France',
    activity: 'Visite de villages',
    date: 'Avril 2024'
  },
  {
    id: 6,
    name: 'Paul R.',
    comment: "Observation des lémuriens à Ranomafana : des moments magiques. Le guide était très connaisseur et passionné.",
    avatar: '👨',
    rating: 5,
    location: 'Bordeaux, France',
    activity: 'Observation faune',
    date: 'Septembre 2024'
  }
];

// Messages par défaut pour le chatbot
const defaultChatMessages = [
  {
    id: 1,
    text: "Bonjour ! Je suis votre assistant spécialisé dans les activités à Madagascar. Je peux vous aider à :",
    sender: 'bot',
    timestamp: new Date(),
    options: [
      "Trouver des randonnées adaptées",
      "Organiser des activités aquatiques",
      "Observer la faune locale",
      "Découvrir la culture malgache"
    ]
  },
  {
    id: 2,
    text: "Dites-moi quel type d'activité vous intéresse ou choisissez une option ci-dessus !",
    sender: 'bot',
    timestamp: new Date()
  }
];

const Activities = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRecommendationAI, setShowRecommendationAI] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showChatbox, setShowChatbox] = useState(false);
  const [chatMessages, setChatMessages] = useState(defaultChatMessages);
  const [chatInput, setChatInput] = useState('');
  const [isChatbotTyping, setIsChatbotTyping] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [animeTheme] = useState('default');
  const [isTestimonialsHovered, setIsTestimonialsHovered] = useState(false);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const navigate = useNavigate();
  const testimonialsRef = useRef(null);
  const chatboxRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const chatInputRef = useRef(null);
  const autoScrollRef = useRef(null);

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    // Gestion du bouton retour en haut
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Défilement automatique des témoignages
  useEffect(() => {
    const startAutoScroll = () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }

      autoScrollRef.current = setInterval(() => {
        if (!isTestimonialsHovered && testimonialsRef.current) {
          const container = testimonialsRef.current;
          const cardWidth = 320;
          const maxScroll = container.scrollWidth - container.clientWidth;

          if (container.scrollLeft >= maxScroll - 10) {
            container.scrollTo({
              left: 0,
              behavior: 'smooth'
            });
            setCurrentTestimonialIndex(0);
          } else {
            const newScrollLeft = container.scrollLeft + cardWidth;
            container.scrollTo({
              left: newScrollLeft,
              behavior: 'smooth'
            });
            setCurrentTestimonialIndex(prev =>
              (prev + 1) % Math.ceil(container.scrollWidth / cardWidth)
            );
          }
        }
      }, 3000);
    };

    startAutoScroll();

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [isTestimonialsHovered]);

  // Scroll automatique des messages du chat
  useEffect(() => {
    if (chatMessagesRef.current && chatMessages.length > 0) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACK_URL}/api/search/activities?query=${encodeURIComponent(searchQuery)}`);
      setTimeout(() => {
        setIsSearching(false);
        navigate('/search-activities', {
          state: {
            results: response.data,
            query: searchQuery
          }
        });
      }, 800);
    } catch (error) {
      console.error('Erreur de recherche:', error);
      setIsSearching(false);
      // Fallback vers recherche locale
      const allActivities = activityCategories.flatMap(cat => cat.activities);
      const results = allActivities.filter(activity =>
        activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.highlight.toLowerCase().includes(searchQuery.toLowerCase())
      );
      navigate('/search-activities', {
        state: {
          results: results,
          query: searchQuery
        }
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/');
  };

  // Défilement manuel des témoignages
  const scrollTestimonials = (direction) => {
    if (testimonialsRef.current) {
      const scrollAmount = 320;
      testimonialsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });

      if (direction === 'right') {
        setCurrentTestimonialIndex(prev =>
          (prev + 1) % Math.ceil(testimonialsRef.current.scrollWidth / scrollAmount)
        );
      } else {
        setCurrentTestimonialIndex(prev =>
          prev === 0 ? Math.ceil(testimonialsRef.current.scrollWidth / scrollAmount) - 1 : prev - 1
        );
      }
    }
  };

  // Gestion du survol des témoignages
  const handleTestimonialsMouseEnter = () => {
    setIsTestimonialsHovered(true);
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
    }
  };

  const handleTestimonialsMouseLeave = () => {
    setIsTestimonialsHovered(false);
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

  // Fonction pour ouvrir le modal IA
  const handleOpenAI = () => {
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      setShowRecommendationAI(true);
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.classList.add('modal-open');
    });
  };

  // Fonction pour fermer le modal IA
  const handleCloseAI = () => {
    setShowRecommendationAI(false);
    document.body.style.overflow = 'auto';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.classList.remove('modal-open');
  };

  // Gestion de la chatbox
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

    const userMessage = {
      id: chatMessages.length + 1,
      text: chatInput,
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatbotTyping(true);

    // Simulation de réponse du bot
    setTimeout(() => {
      const responses = [
        "Pour les randonnées, je vous recommande le Parc National d'Andringitra pour les experts, ou la Montagne d'Ambre pour les débutants. Quelle durée de randonnée envisagez-vous ?",
        "Excellent choix pour les activités aquatiques ! Nosy Tanikely est parfait pour les familles, tandis que l'Archipel des Radama conviendra aux plongeurs confirmés. Avez-vous déjà une certification de plongée ?",
        "L'observation de la faune à Madagascar est unique ! Ranomafana pour les lémuriens, Ankarafantsika pour les oiseaux. Souhaitez-vous une observation diurne ou nocturne ?",
        "Les activités culturelles permettent une immersion authentique. Je recommande les visites de villages traditionnels et les ateliers artisanaux. Quel aspect de la culture malgache vous intéresse ?",
        "Pour planifier vos activités, je vous suggère de créer un compte MadaTour. Notre assistant IA pourra alors personnaliser vos expériences selon vos préférences."
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

    setTimeout(() => {
      let response = "";
      switch (option) {
        case "Trouver des randonnées adaptées":
          response = "Je vous recommande : \n• Andringitra (difficile, 3-5 jours) \n• Isalo (moyen, 2-3 jours) \n• Montagne d'Ambre (facile, 1 jour). \nQuel niveau de difficulté recherchez-vous ?";
          break;
        case "Organiser des activités aquatiques":
          response = "Nos activités aquatiques incluent : \n• Plongée à Nosy Tanikely (tous niveaux) \n• Snorkeling en Mer d'Émeraude \n• Pirogue traditionnelle. \nÊtes-vous plutôt plongée, snorkeling ou navigation ?";
          break;
        case "Observer la faune locale":
          response = "Les meilleurs spots : \n• Ranomafana (lémuriens rares) \n• Anja (maki catta) \n• Ankarafantsika (oiseaux). \nSouhaitez-vous un guide naturaliste spécialisé ?";
          break;
        case "Découvrir la culture malgache":
          response = "Expériences culturelles authentiques : \n• Visite de villages traditionnels \n• Ateliers artisanaux \n• Dégustation de cuisine locale. \nQuel aspect culturel vous intéresse le plus ?";
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

  // Fonction pour retourner en haut de la page
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Filtrer les catégories d'activités
  const filteredCategories = activeFilter === 'all'
    ? activityCategories
    : activityCategories.filter(cat => cat.type === activeFilter);

  return (
    <div className={`${styles["activities-container"]} ${styles[animeTheme]}`}>
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
            <Link to="/regions" className={styles["nav-link"]}>
              <i className="fas fa-map-marked-alt"></i>
              Destinations
            </Link>
            <Link to="/activities" className={`${styles["nav-link"]} ${styles.active}`}>
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
            <button
              className={styles["ai-button"]}
              onClick={handleOpenAI}
              title="Assistant IA d'activités"
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

      {/* Hero Section avec animation */}
      <section className={styles["activities-hero"]}>
        <div className={styles["hero-overlay"]}></div>
        <div className={styles["hero-slides"]}>
          <div className={styles["hero-slide"]} style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1503917988258-f87a78e3c995?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`
          }}></div>
          <div className={styles["hero-slide"]} style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`
          }}></div>
          <div className={styles["hero-slide"]} style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1527631746610-bca00a040d60?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`
          }}></div>
        </div>

        <div className={styles["hero-content"]}>
          <h1 className={styles["anime-text"]}>
            <span className={styles["text-gradient"]}>
              Vivez l'<span className={styles["text-highlight"]}>aventure</span> à Madagascar
            </span>
          </h1>

          <p className={styles["hero-subtitle"]}>
            Des expériences uniques adaptées à tous les goûts et tous les niveaux
          </p>

          <form className={styles["search-form"]} onSubmit={handleSearch}>
            <div className={`${styles["search-input-container"]} ${styles["anime-border"]}`}>
              <i className={`fas fa-search ${styles["search-icon"]}`}></i>
              <input
                type="text"
                placeholder="Rechercher une activité, une région..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles["search-input"]}
              />
              <button
                type="submit"
                className={`${styles["search-button"]} ${isSearching ? styles.searching : ''}`}
                disabled={isSearching}
              >
                {isSearching ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Recherche...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Découvrir
                  </>
                )}
              </button>
            </div>
            <div className={styles["search-suggestions"]}>
              <span>Suggestions :</span>
              {['Randonnée', 'Plongée', 'Lémuriens', 'Culture'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={styles["search-tag"]}
                  onClick={() => setSearchQuery(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </form>

          <div className={styles["hero-stats"]}>
            {[
              { icon: 'fas fa-hiking', label: '15+ Randonnées', value: '15+' },
              { icon: 'fas fa-water', label: '8+ Activités aquatiques', value: '8+' },
              { icon: 'fas fa-binoculars', label: '12+ Sites faune', value: '12+' },
              { icon: 'fas fa-star', label: '4.7/5 Satisfaction', value: '4.7' }
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
      {showRecommendationAI && (
        <React.Suspense fallback={<div className={styles["loading-ai"]}>Chargement de l'assistant IA...</div>}>
          <RecommendationAI onClose={handleCloseAI} />
        </React.Suspense>
      )}

      {/* Section Filtres avec animations */}
      <section
        id="filters"
        className={`${styles["activity-filters"]} ${styles["anime-section"]}`}
        data-animate="true"
      >
        <div className={styles["section-header"]}>
          <h2>
            <span className={styles["title-anime"]}>
              Filtrer par <span className={styles["title-accent"]}>catégorie</span>
            </span>
          </h2>
          <p className={styles["subtitle-anime"]}>
            Trouvez l'activité parfaite selon vos envies
          </p>
        </div>

        <div className={styles["filter-buttons"]}>
          {activityTypes.map(type => (
            <button
              key={type.id}
              className={clsx(
                styles["filter-btn"],
                styles["anime-filter"],
                { [styles.active]: activeFilter === type.id }
              )}
              onClick={() => setActiveFilter(type.id)}
              style={{ animationDelay: `${activityTypes.indexOf(type) * 0.1}s` }}
            >
              <div className={styles["filter-icon-wrapper"]}>
                <i className={type.icon}></i>
                <div className={styles["filter-glow"]}></div>
              </div>
              <span className={styles["filter-name"]}>{type.name}</span>
              <span className={styles["filter-count"]}>{type.count}</span>
              <div className={styles["filter-wave"]}></div>
            </button>
          ))}
        </div>
      </section>

      {/* Section Activités principales avec animations */}
      <section
        id="activities"
        className={`${styles["main-activities"]} ${styles["anime-section"]}`}
        data-animate="true"
      >
        <div className={styles["section-header"]}>
          <h2>
            <span className={styles["title-anime"]}>
              Nos <span className={styles["title-accent"]}>activités</span> phares
            </span>
          </h2>
          <p className={styles["subtitle-anime"]}>
            Des expériences inoubliables à travers toute l'île
          </p>
        </div>

        <div className={styles["activities-grid"]}>
          {filteredCategories.map((category, categoryIndex) => (
            <div
              key={category.id}
              className={`${styles["activity-category"]} ${styles["anime-category"]}`}
              style={{
                animationDelay: `${categoryIndex * 0.2}s`,
                '--card-color': category.color
              }}
            >
              <div className={styles["category-header"]}>
                <div className={styles["category-icon-wrapper"]}>
                  <i className={category.icon}></i>
                  <div className={styles["icon-glow"]}></div>
                </div>
                <h3>{category.name}</h3>
                <div className={styles["category-badge"]}>
                  {category.activities.length} activités
                </div>
              </div>

              <div className={styles["activities-list"]}>
                {category.activities.map((activity, activityIndex) => (
                  <div
                    key={activity.id}
                    className={`${styles["activity-card"]} ${styles["anime-card"]}`}
                    style={{ animationDelay: `${activityIndex * 0.1}s` }}
                  >
                    <div className={styles["activity-image-container"]}>
                      <div
                        className={styles["activity-image"]}
                        style={{ backgroundImage: `url(${activity.image})` }}
                      >
                        <div className={styles["image-gradient"]}></div>
                        <div className={styles["activity-rating"]}>
                          {renderStars(activity.rating)}
                          <span className={styles["rating-number"]}>{activity.rating}</span>
                        </div>
                        <div className={styles["activity-badge"]}>
                          <i className="fas fa-clock"></i>
                          <span>{activity.duration}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles["activity-content"]}>
                      <h4>
                        <i className="fas fa-map-marker-alt"></i>
                        {activity.name}
                      </h4>

                      <div className={styles["activity-meta"]}>
                        <span className={`${styles["difficulty"]} ${styles[activity.difficulty.toLowerCase().replace(' ', '-')]}`}>
                          <i className="fas fa-chart-line"></i>
                          {activity.difficulty}
                        </span>
                        <span className={styles["price"]}>
                          <i className="fas fa-tag"></i>
                          {activity.price}
                        </span>
                      </div>

                      <p className={styles["activity-highlight"]}>{activity.highlight}</p>

                      <div className={styles["activity-details"]}>
                        <div className={styles["detail-item"]}>
                          <i className="fas fa-users"></i>
                          <span>{activity.participants}</span>
                        </div>
                        <div className={styles["detail-item"]}>
                          <i className="fas fa-calendar-alt"></i>
                          <span>{activity.bestSeason}</span>
                        </div>
                      </div>

                      <div className={styles["included-list"]}>
                        <span className={styles["included-title"]}>Inclus :</span>
                        {activity.included.slice(0, 2).map((item, idx) => (
                          <span key={idx} className={styles["included-item"]}>
                            <i className="fas fa-check"></i> {item}
                          </span>
                        ))}
                        {activity.included.length > 2 && (
                          <span className={styles["included-more"]}>
                            +{activity.included.length - 2} autres
                          </span>
                        )}
                      </div>

                      <div className={styles["activity-footer"]}>
                        <Link
                          to={`/activity/${category.id}/${activity.id}`}
                          className={styles["details-link"]}
                        >
                          <span>Voir les détails</span>
                          <i className="fas fa-arrow-right"></i>
                          <div className={styles["link-glow"]}></div>
                        </Link>
                        <button
                          className={styles["book-button"]}
                          onClick={() => navigate(`/booking/activity/${activity.id}`)}
                        >
                          <i className="fas fa-calendar-plus"></i>
                          Réserver
                        </button>
                      </div>
                    </div>

                    {/* Effets anime */}
                    <div className={styles["card-glow"]}></div>
                    <div className={styles["card-sparkles"]}></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section Activités saisonnières */}
      <section
        id="seasonal"
        className={`${styles["seasonal-activities"]} ${styles["anime-section"]}`}
        data-animate="true"
      >
        <div className={styles["section-header"]}>
          <h2>
            <span className={styles["title-anime"]}>
              Activités <span className={styles["title-accent"]}>saisonnières</span>
            </span>
          </h2>
          <p className={styles["subtitle-anime"]}>
            Profitez des moments forts de l'année à Madagascar
          </p>
        </div>

        <div className={styles["seasonal-grid"]}>
          {seasonalActivities.map((activity, index) => (
            <div
              key={activity.id}
              className={`${styles["seasonal-card"]} ${styles["anime-seasonal"]}`}
              style={{
                animationDelay: `${index * 0.2}s`,
                backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${activity.image})`
              }}
            >
              <div className={styles["seasonal-content"]}>
                <div className={styles["seasonal-badge"]}>
                  <i className="fas fa-calendar-star"></i>
                  <span>{activity.period}</span>
                  <div className={styles["badge-glow"]}></div>
                </div>

                <h3>{activity.name}</h3>

                <div className={styles["seasonal-meta"]}>
                  <span className={styles["seasonal-type"]}>
                    <i className="fas fa-tag"></i>
                    {activity.type}
                  </span>
                  <span className={styles["seasonal-location"]}>
                    <i className="fas fa-map-marker-alt"></i>
                    {activity.location}
                  </span>
                </div>

                <p className={styles["seasonal-desc"]}>{activity.description}</p>

                <div className={styles["seasonal-footer"]}>
                  <div className={styles["seasonal-info"]}>
                    <div className={styles["seasonal-rating"]}>
                      {renderStars(activity.rating)}
                      <span className={styles["rating-number"]}>{activity.rating}</span>
                    </div>
                    <div className={styles["seasonal-duration"]}>
                      <i className="fas fa-clock"></i>
                      {activity.duration}
                    </div>
                    <div className={styles["seasonal-price"]}>
                      <i className="fas fa-euro-sign"></i>
                      {activity.price}
                    </div>
                  </div>

                  <Link
                    to={`/seasonal/${activity.id}`}
                    className={styles["seasonal-link"]}
                  >
                    <span>Découvrir</span>
                    <i className="fas fa-arrow-right"></i>
                    <div className={styles["link-glow"]}></div>
                  </Link>
                </div>
              </div>

              {/* Effets anime */}
              <div className={styles["seasonal-glow"]}></div>
              <div className={styles["seasonal-sparkle"]}></div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION TÉMOIGNAGES AMÉLIORÉE avec défilement automatique */}
      <section
        id="testimonials"
        className={`${styles["activity-testimonials"]} ${styles["anime-section"]}`}
        data-animate="true"
        onMouseEnter={handleTestimonialsMouseEnter}
        onMouseLeave={handleTestimonialsMouseLeave}
      >
        <div className={styles["section-header"]}>
          <h2>
            <span className={styles["title-anime"]}>
              Ils ont vécu l'<span className={styles["title-accent"]}>aventure</span>
            </span>
          </h2>
          <p className={styles["subtitle-anime"]}>
            Ce que nos voyageurs disent de ces expériences uniques
          </p>
        </div>

        <div className={styles["testimonials-container"]}>
          <button
            className={clsx(styles["scroll-button"], styles["left"])}
            onClick={() => scrollTestimonials('left')}
            aria-label="Témoignage précédent"
          >
            <i className="fas fa-chevron-left"></i>
          </button>

          <div
            className={styles["testimonials-slider"]}
            ref={testimonialsRef}
            style={{ cursor: isTestimonialsHovered ? 'grab' : 'default' }}
          >
            {activityTestimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={styles["testimonial-card"]}
                data-index={index}
              >
                <div className={styles["testimonial-quote"]}>
                  <i className="fas fa-quote-left"></i>
                </div>

                <div className={styles["testimonial-rating"]}>
                  {renderStars(testimonial.rating)}
                  <span className={styles["rating-number"]}>{testimonial.rating}/5</span>
                </div>

                <p className={styles["testimonial-text"]}>
                  "{testimonial.comment}"
                </p>

                <div className={styles["testimonial-activity"]}>
                  <i className="fas fa-hiking"></i>
                  <span>{testimonial.activity}</span>
                </div>

                <div className={styles["testimonial-author"]}>
                  <div className={styles["author-avatar"]}>
                    <span className={styles["avatar"]}>{testimonial.avatar}</span>
                    <div className={styles["avatar-glow"]}></div>
                  </div>
                  <div className={styles["author-info"]}>
                    <h4 className={styles["author-name"]}>{testimonial.name}</h4>
                    <div className={styles["author-meta"]}>
                      <span className={styles["author-location"]}>
                        <i className="fas fa-map-marker-alt"></i>
                        {testimonial.location}
                      </span>
                      <span className={styles["author-date"]}>
                        <i className="fas fa-calendar-alt"></i>
                        {testimonial.date}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Effets anime */}
                <div className={styles["testimonial-glow"]}></div>
                <div className={styles["testimonial-sparkle"]}></div>
              </div>
            ))}
          </div>

          <button
            className={clsx(styles["scroll-button"], styles["right"])}
            onClick={() => scrollTestimonials('right')}
            aria-label="Témoignage suivant"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>

        {/* Indicateurs de pagination */}
        <div className={styles["testimonials-pagination"]}>
          {activityTestimonials.slice(0, Math.ceil(activityTestimonials.length / 3)).map((_, index) => (
            <button
              key={index}
              className={`${styles["pagination-dot"]} ${index === currentTestimonialIndex ? styles.active : ''
                }`}
              onClick={() => {
                if (testimonialsRef.current) {
                  const cardWidth = 320;
                  testimonialsRef.current.scrollTo({
                    left: index * cardWidth * 3,
                    behavior: 'smooth'
                  });
                  setCurrentTestimonialIndex(index);
                }
              }}
              aria-label={`Aller au groupe de témoignages ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* CTA Section conditionnelle */}
      {!isLoggedIn ? (
        <section className={styles["activity-cta"]}>
          <div className={styles["cta-content"]}>
            <div className={styles["cta-animation"]}>
              <div className={styles["cta-orbs"]}>
                <div className={styles["orb-1"]}></div>
                <div className={styles["orb-2"]}></div>
                <div className={styles["orb-3"]}></div>
              </div>
            </div>

            <h2>Prêt pour l'aventure malgache ?</h2>
            <p>Créez votre compte pour réserver vos activités et recevoir des recommandations personnalisées</p>

            <div className={styles["cta-buttons"]}>
              <Link to="/register" className={`${styles["cta-button"]} ${styles["primary"]}`}>
                <i className="fas fa-rocket"></i>
                <span>S'inscrire gratuitement</span>
                <div className={styles["button-particles"]}></div>
              </Link>
              <Link to="/contact" className={`${styles["cta-button"]} ${styles["secondary"]}`}>
                <i className="fas fa-envelope"></i>
                <span>Demander un devis</span>
              </Link>
              <button className={`${styles["cta-button"]} ${styles["ai-cta"]}`} onClick={handleOpenAI}>
                <i className="fas fa-robot"></i>
                <span>Assistant IA</span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className={styles["user-activity-cta"]}>
          <div className={styles["user-cta-content"]}>
            <div className={styles["user-cta-animation"]}>
              <div className={styles["user-cta-orbs"]}>
                <div className={styles["user-orb-1"]}></div>
                <div className={styles["user-orb-2"]}></div>
              </div>
            </div>

            <h2>Continuez votre exploration !</h2>
            <p>Découvrez plus d'activités, gérez vos réservations et partagez vos expériences</p>

            <div className={styles["user-cta-buttons"]}>
              <Link to="/dashboard" className={`${styles["user-cta-button"]} ${styles["primary"]}`}>
                <i className="fas fa-compass"></i>
                <span>Mes activités</span>
              </Link>
              <Link to="/itineraries" className={`${styles["user-cta-button"]} ${styles["secondary"]}`}>
                <i className="fas fa-map-marked-alt"></i>
                <span>Créer un itinéraire</span>
              </Link>
              <Link to="/community" className={`${styles["user-cta-button"]} ${styles["tertiary"]}`}>
                <i className="fas fa-users"></i>
                <span>Communauté</span>
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
                Votre guide pour des aventures authentiques à Madagascar.
                Expériences responsables et mémorables.
              </p>

              <div className={styles["social-links"]}>
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
                  <i className="fas fa-hiking"></i>
                  Activités
                </h3>
                <ul>
                  {['Randonnée', 'Plongée', 'Observation faune', 'Culture', 'Aventure'].map((item) => (
                    <li key={item}>
                      <Link to={`/activities?filter=${item.toLowerCase()}`}>
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
                  {['Conseils activités', 'Saisonnalité', 'FAQ', 'Contact', 'Blog'].map((item) => (
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
                  {['Conditions', 'Confidentialité', 'Cookies', 'Mentions légales'].map((item) => (
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
                Infos activités
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

      {/* Chatbox flottante */}
      <div className={styles["chatbox-container"]} ref={chatboxRef}>
        <button
          className={`${styles["chatbox-toggle"]} ${showChatbox ? styles.active : ''}`}
          onClick={toggleChatbox}
          aria-label={showChatbox ? "Fermer le chat" : "Ouvrir le chat"}
        >
          <i className="fas fa-comments"></i>
          {!showChatbox && <span className={styles["notification-badge"]}>1</span>}
        </button>

        {showChatbox && (
          <div className={styles["chatbox-window"]}>
            <div className={styles["chatbox-header"]}>
              <div className={styles["chatbox-header-content"]}>
                <div className={styles["chatbox-avatar"]}>
                  <i className="fas fa-hiking"></i>
                  <div className={styles["avatar-status"]}></div>
                </div>
                <div className={styles["chatbox-info"]}>
                  <h3>Assistant Activités</h3>
                  <p>En ligne • Expert Madagascar</p>
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
                  placeholder="Demandez-moi une activité..."
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

export default Activities;