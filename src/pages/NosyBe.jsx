import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import styles from './cssR/NosyBe.module.css';
import logos from '../images/logo-site4.png';

// Composant IA de recommandation
const RecommendationAI = React.lazy(() => import('../components/recommendation/RecommendationAI'));

const NosyBe = () => {
    const [activeTab, setActiveTab] = useState('sites');
    const [sortOrder, setSortOrder] = useState('asc');
    const [showRecommendationAI, setShowRecommendationAI] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showChatbox, setShowChatbox] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatbotTyping, setIsChatbotTyping] = useState(false);
    const [animeTheme] = useState('default');
    const [activeFilter, setActiveFilter] = useState('all');
    const [favorites, setFavorites] = useState([]);

    const { id } = useParams();
    const navigate = useNavigate();
    const chatboxRef = useRef(null);
    const chatMessagesRef = useRef(null);
    const chatInputRef = useRef(null);
    const mainRef = useRef(null);

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        setIsLoggedIn(!!token);
        if (userId) {
            fetchFavorites();
        }

        // Gestion du bouton retour en haut
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 300);
            setIsScrolled(window.scrollY > 100);
        };

        window.addEventListener('scroll', handleScroll);

        // Messages initiaux du chatbot
        setChatMessages([
            {
                id: 1,
                text: "Bonjour ! Je suis votre assistant pour Nosy Be. Je peux vous aider à :",
                sender: 'bot',
                timestamp: new Date(),
                options: [
                    "Trouver les meilleures plages",
                    "Réserver un hébergement",
                    "Organiser une excursion",
                    "Découvrir la culture locale"
                ]
            },
            {
                id: 2,
                text: "Dites-moi ce qui vous intéresse ou choisissez une option ci-dessus !",
                sender: 'bot',
                timestamp: new Date()
            }
        ]);

        return () => window.removeEventListener('scroll', handleScroll);
    }, [token, userId]);

    const fetchFavorites = async () => {
        try {
            // Simuler la récupération des favoris
            const mockFavorites = [1, 3, 7]; // IDs des sites favoris
            setFavorites(mockFavorites);
        } catch (error) {
            console.error('Erreur lors de la récupération des favoris :', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        navigate('/');
    };

    // Fonction pour ouvrir le modal IA
    const handleOpenAI = () => {
        window.scrollTo(0, 0);
        requestAnimationFrame(() => {
            setShowRecommendationAI(true);
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');
        });
    };

    // Fonction pour fermer le modal IA
    const handleCloseAI = () => {
        setShowRecommendationAI(false);
        document.body.style.overflow = 'auto';
        document.body.classList.remove('modal-open');
    };

    // Fonction pour retourner en haut de la page
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
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
                "Pour les plages à Nosy Be, je vous recommande Andilana pour sa longueur, Madirokely pour l'animation, et Nosy Iranja pour son banc de sable unique !",
                "Pour l'hébergement, tout dépend de votre budget : Ravintsara pour le luxe, Les Bungalows d'Ambola pour l'authenticité, ou Sakatia Lodge pour l'écologie.",
                "Les meilleures excursions : journée à Nosy Tanikely pour le snorkeling, Lokobe pour les lémuriens, et mont Passot pour le coucher de soleil.",
                "Pour la culture : visitez les plantations d'Ylang-Ylang, découvrez la distillation traditionnelle, et goûtez aux spécialités locales comme le romazava."
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
                case "Trouver les meilleures plages":
                    response = "Les 3 meilleures plages :\n1. Andilana (la plus longue)\n2. Nosy Iranja (banc de sable)\n3. Madirokely (animée)\nQuel type d'ambiance recherchez-vous ?";
                    break;
                case "Réserver un hébergement":
                    response = "Types d'hébergement disponibles :\n• Hôtels 4* (Ravintsara, Nosy Be Hôtel)\n• Éco-lodges (Sakatia Lodge)\n• Bungalows (Ambola)\n• Maisons d'hôtes (L'Heure Bleue)\nQuel est votre budget ?";
                    break;
                case "Organiser une excursion":
                    response = "Excursions populaires :\n• Lokobe (lémuriens)\n• Nosy Tanikely (snorkeling)\n• Nosy Iranja (tortues)\n• Mont Passot (vue panoramique)\nQuelle durée préférez-vous ?";
                    break;
                case "Découvrir la culture locale":
                    response = "Expériences culturelles :\n• Plantations d'Ylang-Ylang\n• Distilleries traditionnelles\n• Marché d'Hell-Ville\n• Cuisine malgache authentique\nQuel aspect vous intéresse ?";
                    break;
                default:
                    response = "Je peux vous aider avec cela. Pourriez-vous me donner plus de détails sur ce que vous cherchez à Nosy Be ?";
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

    // Fonction de recherche
    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        // Filtrer selon le terme de recherche
        console.log('Recherche pour:', searchQuery);
        // Implémenter la logique de recherche ici
    };

    // Fonction pour gérer les likes
    const handleToggleFavorite = (itemId) => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        const wasFavorite = favorites.includes(itemId);
        if (wasFavorite) {
            setFavorites(favorites.filter(id => id !== itemId));
        } else {
            setFavorites([...favorites, itemId]);
        }
    };

    // Scroll automatique des messages du chat
    useEffect(() => {
        if (chatMessagesRef.current && chatMessages.length > 0) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [chatMessages]);

    // Données pour Nosy Be - Sites Touristiques (10 entrées)
    const sitesData = [
        {
            id: 1,
            nom: "Réserve Naturelle Intégrale de Lokobe",
            type: "Réserve naturelle",
            description: "Dernière forêt primaire de Nosy Be abritant des lémuriens nocturnes, caméléons panthères et une biodiversité exceptionnelle. Visite guidée obligatoire.",
            latitude: -13.4025,
            longitude: 48.3150,
            prixMoyen: 25000,
            contact: "+261 34 12 345 67",
            meilleurePeriode: "Avril à Novembre",
            dureeVisite: "2-3 heures",
            note: 4.8,
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Indri_indri_edit.jpg/800px-Indri_indri_edit.jpg",
            highlights: ["Lémuriens nocturnes", "Forêt primaire", "Biodiversité unique"]
        },
        {
            id: 2,
            nom: "Plage d'Andilana",
            type: "Plage",
            description: "La plus longue plage de Nosy Be avec son sable blanc et ses eaux turquoise, idéale pour le farniente. Nombreux restaurants et bars le long de la plage.",
            latitude: -13.2789,
            longitude: 48.2205,
            prixMoyen: 0,
            contact: "Office Régional du Tourisme: +261 20 86 920 12",
            meilleurePeriode: "Toute l'année",
            dureeVisite: "2-6 heures",
            note: 4.5,
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Nosy_Be_Island_when_arriving_from_the_sea_%2812%29.jpg/800px-Nosy_Be_Island_when_arriving_from_the_sea_%2812%29.jpg",
            highlights: ["Sable blanc", "Eaux turquoise", "Restaurants"]
        },
        {
            id: 3,
            nom: "Mont Passot",
            type: "Point de vue",
            description: "Point culminant de Nosy Be (329m) offrant un panorama à 360° sur l'île et les îlots alentours, particulièrement magnifique au coucher du soleil.",
            latitude: -13.3667,
            longitude: 48.2333,
            prixMoyen: 10000,
            contact: "Guide local: +261 32 45 678 90",
            meilleurePeriode: "Mai à Octobre",
            dureeVisite: "1-2 heures",
            note: 4.7,
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Madagascar_-_Ambohimanga_Rova_07.jpg/800px-Madagascar_-_Ambohimanga_Rova_07.jpg",
            highlights: ["Panorama 360°", "Coucher de soleil", "Lacs sacrés"]
        },
        {
            id: 4,
            nom: "Cascade de Sakalava",
            type: "Cascade",
            description: "Belle cascade entourée de végétation tropicale. Possibilité de baignade dans le bassin naturel. Accès par une courte randonnée.",
            latitude: -13.3456,
            longitude: 48.2458,
            prixMoyen: 5000,
            contact: "Association locale: +261 33 12 345 67",
            meilleurePeriode: "Novembre à Avril",
            dureeVisite: "1-2 heures",
            note: 4.2,
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Madagascar_-_Ranomafana_National_Park_02.jpg/800px-Madagascar_-_Ranomafana_National_Park_02.jpg",
            highlights: ["Baignade naturelle", "Végétation tropicale", "Randonnée facile"]
        },
        {
            id: 5,
            nom: "Plantations d'Ylang-Ylang",
            type: "Visite culturelle",
            description: "Découverte des plantations de la fameuse fleur d'Ylang-Ylang qui a valu à Nosy Be son surnom d'île aux parfums. Visite de distilleries traditionnelles.",
            latitude: -13.3812,
            longitude: 48.2583,
            prixMoyen: 15000,
            contact: "Coopérative des Planteurs: +261 34 87 654 32",
            meilleurePeriode: "Juillet à Décembre",
            dureeVisite: "2 heures",
            note: 4.3,
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Ylang-ylang_%28Cananga_odorata%29_flowers.JPG/800px-Ylang-ylang_%28Cananga_odorata%29_flowers.JPG",
            highlights: ["Fleur d'Ylang-Ylang", "Distillerie", "Parfums naturels"]
        },
        {
            id: 6,
            nom: "Îlot aux Tortues",
            type: "Réserve animalière",
            description: "Petit îlot abritant un centre de conservation des tortues terrestres et marines. Possibilité de nager avec les tortues dans leur habitat naturel.",
            latitude: -13.3928,
            longitude: 48.1950,
            prixMoyen: 20000,
            contact: "Centre de Conservation: +261 32 11 223 34",
            meilleurePeriode: "Avril à Novembre",
            dureeVisite: "3-4 heures",
            note: 4.6,
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Tortues_molles.JPG/800px-Tortues_molles.JPG",
            highlights: ["Tortues marines", "Snorkeling", "Conservation"]
        },
        {
            id: 7,
            nom: "Plage de Madirokely",
            type: "Plage",
            description: "Plage animée avec de nombreux restaurants, bars et possibilités d'activités nautiques. Vie nocturne animée.",
            latitude: -13.3889,
            longitude: 48.2708,
            prixMoyen: 0,
            contact: "Office du Tourisme Local: +261 20 86 920 13",
            meilleurePeriode: "Toute l'année",
            dureeVisite: "2-6 heures",
            note: 4.4,
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Beach_at_Nosy_Be.jpg/800px-Beach_at_Nosy_Be.jpg",
            highlights: ["Animée", "Sports nautiques", "Vie nocturne"]
        },
        {
            id: 8,
            nom: "Lac sacré d'Antsaniti",
            type: "Site sacré",
            description: "Lac cratère considéré comme sacré par la population locale. Selon la légende, il abriterait des crocodiles sacrés.",
            latitude: -13.3583,
            longitude: 48.2250,
            prixMoyen: 5000,
            contact: "Guide local: +261 33 55 667 78",
            meilleurePeriode: "Mai à Octobre",
            dureeVisite: "1 heure",
            note: 4.1,
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Lake_Ravelobe%2C_Ankarafantsika_National_Park%2C_Madagascar.jpg/800px-Lake_Ravelobe%2C_Ankarafantsika_National_Park%2C_Madagascar.jpg",
            highlights: ["Site sacré", "Légendes", "Paysage unique"]
        },
        {
            id: 9,
            nom: "Jardin botanique de la Petite Île",
            type: "Jardin botanique",
            description: "Jardin présentant la flore endémique de Madagascar avec une collection impressionnante d'orchidées et de plantes médicinales.",
            latitude: -13.3750,
            longitude: 48.2650,
            prixMoyen: 10000,
            contact: "+261 34 99 888 77",
            meilleurePeriode: "Octobre à Avril",
            dureeVisite: "1-2 heures",
            note: 4.4,
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Royal_Botanic_Garden_Edinburgh_2007_21.JPG/800px-Royal_Botanic_Garden_Edinburgh_2007_21.JPG",
            highlights: ["Orchidées", "Plantes médicinales", "Flore endémique"]
        },
        {
            id: 10,
            nom: "Plage de Nosy Iranja",
            type: "Plage",
            description: "Magnifique banc de sable blanc reliant deux îles à marée basse. Site de ponte des tortues marines. Excursion d'une journée au départ de Nosy Be.",
            latitude: -13.5333,
            longitude: 48.0167,
            prixMoyen: 120000,
            contact: "Agences de voyage à Hell-Ville",
            meilleurePeriode: "Avril à Novembre",
            dureeVisite: "Journée complète",
            note: 4.9,
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/NosyTanikely.jpg/800px-NosyTanikely.jpg",
            highlights: ["Banc de sable", "Tortues marines", "Excursion journée"]
        }
    ];

    // Données pour Nosy Be - Hébergements (10 entrées)
    const hebergementsData = [
        {
            id: 11,
            nom: "Ravintsara Wellness Hotel",
            type: "Hôtel 4 étoiles",
            description: "Éco-lodge de luxe au cœur d'un jardin tropical, avec spa et piscine naturelle. Chambres spacieuses avec terrasse privée.",
            latitude: -13.3778,
            longitude: 48.2689,
            prixMoyen: 180000,
            contact: "+261 20 86 911 11 / ravintsara@moov.mg",
            services: "Piscine, Spa, Restaurant, WiFi",
            note: 4.7,
            emplacement: "Proche plage de Madirokely",
            image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 12,
            nom: "Les Bungalows d'Ambola",
            type: "Bungalow",
            description: "Bungalows pieds dans l'eau sur la plage d'Ambola, ambiance authentique et détendue. Cadre idyllique pour se déconnecter.",
            latitude: -13.3986,
            longitude: 48.2850,
            prixMoyen: 80000,
            contact: "+261 34 05 123 45 / ambola@gmail.com",
            services: "Plage privée, Restaurant, Activités nautiques",
            note: 4.5,
            emplacement: "Plage d'Ambola",
            image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 13,
            nom: "Vanila Hotel",
            type: "Hôtel 3 étoiles",
            description: "Hôtel familial avec piscine, situé à proximité de la plage de Madirokely. Service attentionné et cuisine locale excellente.",
            latitude: -13.3900,
            longitude: 48.2708,
            prixMoyen: 120000,
            contact: "+261 20 86 912 34 / reservation@vanilahotel.com",
            services: "Piscine, Restaurant, Bar, Navette plage",
            note: 4.3,
            emplacement: "Madirokely",
            image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 14,
            nom: "Nosy Be Hôtel",
            type: "Hôtel 4 étoiles",
            description: "Complexe hôtelier avec piscine à débordement face à la mer. Chambres modernes avec vue imprenable sur l'océan.",
            latitude: -13.3850,
            longitude: 48.2750,
            prixMoyen: 220000,
            contact: "+261 20 86 915 55 / reservation@nosybehotel.com",
            services: "Piscine, Spa, 2 Restaurants, Club enfants",
            note: 4.6,
            emplacement: "Plage de Madirokely",
            image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 15,
            nom: "Sakatia Lodge",
            type: "Eco-Lodge",
            description: "Eco-lodge situé sur l'île de Sakatia. Bungalows écologiques avec vue sur le récif corallien. Paradis pour snorkeling.",
            latitude: -13.4333,
            longitude: 48.1500,
            prixMoyen: 150000,
            contact: "+261 32 87 654 32 / sakatia.lodge@moov.mg",
            services: "Plage privée, Restaurant, Snorkeling, Plongée",
            note: 4.8,
            emplacement: "Île de Sakatia",
            image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 16,
            nom: "Hôtel Le Grand Bleu",
            type: "Hôtel 3 étoiles",
            description: "Hôtel convivial au bord de la plage de Madirokely. Personnel accueillant et cuisine excellente. Excellent rapport qualité-prix.",
            latitude: -13.3878,
            longitude: 48.2711,
            prixMoyen: 90000,
            contact: "+261 34 11 223 34 / grandbleu@moov.mg",
            services: "Restaurant, Bar, Plage, WiFi",
            note: 4.2,
            emplacement: "Plage de Madirokely",
            image: "https://images.unsplash.com/photo-1564501049418-3c27787d01e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 17,
            nom: "L'Heure Bleue",
            type: "Maison d'hôtes",
            description: "Maison d'hôtes de charme avec seulement 6 chambres. Jardin tropical luxuriant et piscine. Ambiance intimiste et romantique.",
            latitude: -13.3800,
            longitude: 48.2650,
            prixMoyen: 110000,
            contact: "+261 33 12 345 67 / heure.bleue@gmail.com",
            services: "Piscine, Petit-déjeuner, Jardin, Service personnalisé",
            note: 4.7,
            emplacement: "Proche Hell-Ville",
            image: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 18,
            nom: "Bungalows de la Baie d'Andilana",
            type: "Bungalow",
            description: "Bungalows économiques situés à proximité de la magnifique plage d'Andilana. Parfait pour les voyageurs à petit budget.",
            latitude: -13.2800,
            longitude: 48.2210,
            prixMoyen: 45000,
            contact: "+261 32 44 556 67 / bungalows.andilana@mail.com",
            services: "Restaurant, Accès plage, Location vélos",
            note: 3.9,
            emplacement: "Plage d'Andilana",
            image: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 19,
            nom: "Iharana Bush Camp",
            type: "Camp de luxe",
            description: "Camp de tentes de luxe en pleine nature. Expérience d'immersion totale dans la forêt tropicale avec tout le confort moderne.",
            latitude: -13.4100,
            longitude: 48.2900,
            prixMoyen: 165000,
            contact: "+261 34 88 999 00 / iharana@bushcamp.mg",
            services: "Tentes luxueuses, Restaurant, Randonnées, Observation faune",
            note: 4.6,
            emplacement: "Forêt de Lokobe",
            image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 20,
            nom: "Villa Marie Lodge",
            type: "Villa",
            description: "Villas privatives avec piscine individuelle. Service de chef à domicile disponible. Idéal pour familles ou groupes.",
            latitude: -13.3950,
            longitude: 48.2800,
            prixMoyen: 350000,
            contact: "+261 20 86 919 19 / villa.marie@lodges.com",
            services: "Piscine privée, Service de chef, Jardin, Conciergerie",
            note: 4.9,
            emplacement: "Collines de Nosy Be",
            image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        }
    ];

    // Données pour Nosy Be - Restaurants (10 entrées)
    const restaurantsData = [
        {
            id: 21,
            nom: "Le Grand Bleu",
            specialite: "Fruits de mer",
            description: "Restaurant les pieds dans le sable proposant des plats frais à base de poissons et crustacés locaux. Spécialité: homard grillé.",
            latitude: -13.3878,
            longitude: 48.2711,
            prixMoyen: 35000,
            horaire: "11h-15h / 18h-22h",
            note: 4.5,
            ambiance: "Décontractée, pieds dans l'eau",
            image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 22,
            nom: "La Table d'Alexandre",
            specialite: "Cuisine fusion",
            description: "Cuisine créative mêlant saveurs malgaches et techniques françaises, dans un cadre élégant. Carte des vins sélectionnée.",
            latitude: -13.3789,
            longitude: 48.2694,
            prixMoyen: 45000,
            horaire: "19h-22h30 (fermé le mardi)",
            note: 4.8,
            ambiance: "Raffinée, romantique",
            image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 23,
            nom: "Chez Lalah",
            specialite: "Cuisine malgache",
            description: "Petit restaurant typique proposant des plats traditionnels authentiques à prix abordables. Spécialité: romazava et ravitoto.",
            latitude: -13.4017,
            longitude: 48.2622,
            prixMoyen: 15000,
            horaire: "10h-21h",
            note: 4.4,
            ambiance: "Traditionnelle, familiale",
            image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 24,
            nom: "Le Papillon Bleu",
            specialite: "Cuisine internationale",
            description: "Restaurant avec terrasse panoramique offrant une vue magnifique sur l'océan. Large choix de plats internationaux et locaux.",
            latitude: -13.3833,
            longitude: 48.2733,
            prixMoyen: 30000,
            horaire: "11h-23h",
            note: 4.3,
            ambiance: "Détendue, vue mer",
            image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 25,
            nom: "La Boussole",
            specialite: "Poissons grillés",
            description: "Petit restaurant de plage réputé pour ses poissons grillés au feu de bois et ses fruits de mer frais. Cadre simple et authentique.",
            latitude: -13.3900,
            longitude: 48.2720,
            prixMoyen: 25000,
            horaire: "11h30-15h / 18h30-22h",
            note: 4.6,
            ambiance: "Plage, décontractée",
            image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 26,
            nom: "Le Maki Céleste",
            specialite: "Cuisine gastronomique",
            description: "Restaurant gastronomique proposant une expérience culinaire unique fusionnant saveurs malgaches et techniques modernes.",
            latitude: -13.3790,
            longitude: 48.2680,
            prixMoyen: 55000,
            horaire: "19h-22h (sur réservation)",
            note: 4.9,
            ambiance: "Haut de gamme, intimiste",
            image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 27,
            nom: "Chez Nono",
            specialite: "Pizzas et pâtes",
            description: "Pizzeria tenue par un couple italo-malgache. Pizzas au feu de bois et pâtes fraîches. Cadre convivial et familial.",
            latitude: -13.3920,
            longitude: 48.2650,
            prixMoyen: 20000,
            horaire: "11h-14h30 / 18h-22h30",
            note: 4.2,
            ambiance: "Convivial, familial",
            image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 28,
            nom: "Le Jardin d'Eden",
            specialite: "Cuisine végétarienne",
            description: "Restaurant bio et végétarien utilisant des produits locaux issus de leur propre jardin. Smoothies et jus frais exceptionnels.",
            latitude: -13.3750,
            longitude: 48.2670,
            prixMoyen: 22000,
            horaire: "10h-20h",
            note: 4.5,
            ambiance: "Nature, détendu",
            image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 29,
            nom: "La Rhumerie",
            specialite: "Cuisine créole",
            description: "Restaurant et distillerie de rhum artisanal. Dégustation de rhums aromatisés et plats créoles épicés. Ambiance festive.",
            latitude: -13.3850,
            longitude: 48.2660,
            prixMoyen: 28000,
            horaire: "12h-23h",
            note: 4.4,
            ambiance: "Festive, animée",
            image: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 30,
            nom: "Le Marché aux Poissons",
            specialite: "Fruits de mer grillés",
            description: "Expérience authentique au marché aux poissons. Choix du poisson frais directement grillé sur place. Prix au poids.",
            latitude: -13.4000,
            longitude: 48.2750,
            prixMoyen: 18000,
            horaire: "17h-21h",
            note: 4.1,
            ambiance: "Marché, authentique",
            image: "https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        }
    ];

    // Données pour Nosy Be - Guides (10 entrées)
    const guidesData = [
        {
            id: 31,
            nom: "Jean-Claude Rakoto",
            specialite: "Randonnée naturaliste",
            langues: "Français, Anglais, Malagasy",
            experience: "8 ans",
            contact: "+261 34 12 345 67",
            disponibilite: "Tous les jours sur réservation",
            note: 4.8,
            prestations: "Randonnée Lokobe, Observation lémuriens, Flore endémique",
            image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 32,
            nom: "Sofia Andriamanana",
            specialite: "Plongée sous-marine",
            langues: "Français, Anglais, Italien",
            experience: "5 ans",
            contact: "+261 32 98 765 43 / sofia.dive@gmail.com",
            disponibilite: "Lundi au samedi",
            note: 4.7,
            prestations: "Plongée bouteille, Snorkeling, Observation tortues",
            image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 33,
            nom: "Tiana Ratsimba",
            specialite: "Culture et patrimoine",
            langues: "Français, Malagasy",
            experience: "12 ans",
            contact: "+261 33 45 678 90",
            disponibilite: "Sur rendez-vous",
            note: 4.9,
            prestations: "Visites culturelles, Histoire locale, Traditions malgaches",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 34,
            nom: "Paul Randrianarisoa",
            specialite: "Observation des baleines",
            langues: "Français, Anglais, Malagasy",
            experience: "6 ans",
            contact: "+261 34 56 789 01 / paul.baleines@mail.com",
            disponibilite: "Juillet à Septembre",
            note: 4.6,
            prestations: "Excursions baleines, Protection marine, Photographie",
            image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 35,
            nom: "Léa Ravelojaona",
            specialite: "Ornithologie",
            langues: "Français, Anglais, Allemand",
            experience: "4 ans",
            contact: "+261 33 78 901 23 / lea.birds@gmail.com",
            disponibilite: "Tous les jours",
            note: 4.5,
            prestations: "Observation oiseaux, Photographie animalière, Randonnée",
            image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 36,
            nom: "Marc Ravalison",
            specialite: "Pêche sportive",
            langues: "Français, Anglais",
            experience: "10 ans",
            contact: "+261 32 34 567 89 / marc.fishing@moov.mg",
            disponibilite: "Sur réservation",
            note: 4.7,
            prestations: "Pêche au gros, Location matériel, Techniques locales",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 37,
            nom: "Nirina Razafindrabe",
            specialite: "Randonnée VTT",
            langues: "Français, Malagasy",
            experience: "3 ans",
            contact: "+261 34 67 890 12",
            disponibilite: "Lundi à vendredi",
            note: 4.3,
            prestations: "Circuits VTT, Parcours adaptés, Découverte villages",
            image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 38,
            nom: "Hery Rajaonarivelo",
            specialite: "Photographie",
            langues: "Français, Anglais, Malagasy",
            experience: "7 ans",
            contact: "+261 33 90 123 45 / hery.photo@gmail.com",
            disponibilite: "Tous les jours",
            note: 4.8,
            prestations: "Tour photo, Cours photographie, Sites insolites",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 39,
            nom: "Zoé Andrianarisoa",
            specialite: "Yoga et méditation",
            langues: "Français, Anglais",
            experience: "5 ans",
            contact: "+261 32 45 678 90 / zoe.yoga@mail.com",
            disponibilite: "Matinées et soirées",
            note: 4.6,
            prestations: "Séances yoga, Méditation plage, Bien-être",
            image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 40,
            nom: "Tolotra Randriamanampy",
            specialite: "Tourisme communautaire",
            langues: "Français, Malagasy",
            experience: "9 ans",
            contact: "+261 34 01 234 56 / tolotra.community@moov.mg",
            disponibilite: "Sur réservation",
            note: 4.7,
            prestations: "Visites villages, Rencontres locales, Artisanat",
            image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        }
    ];

    // Données pour Nosy Be - Transports (10 entrées)
    const transportsData = [
        {
            id: 41,
            type: "Taxi-brousse",
            frequence: "Toutes les 30 minutes",
            duree: "Variable selon destination",
            tarif: "À partir de 1000 Ar",
            contact: "Station centrale: +261 20 86 920 15",
            note: 3.8,
            avantages: "Économique, Authentique",
            image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 42,
            type: "Bateau taxi",
            frequence: "Sur demande",
            duree: "15-45 min selon destination",
            tarif: "À partir de 20000 Ar",
            contact: "Embarcadère principal: +261 34 07 891 01",
            note: 4.2,
            avantages: "Dépaysant, Accès îlots",
            image: "https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 43,
            type: "Location de quad",
            frequence: "Sur réservation",
            duree: "À la journée ou demi-journée",
            tarif: "À partir de 80000 Ar/half-day",
            contact: "Nosy Be Quad: +261 32 11 223 34",
            note: 4.5,
            avantages: "Liberté, Accès sites reculés",
            image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 44,
            type: "Location de voiture",
            frequence: "Sur réservation",
            duree: "À la journée",
            tarif: "À partir de 120000 Ar/jour",
            contact: "Europcar Nosy Be: +261 20 86 921 00",
            note: 4.3,
            avantages: "Confort, Autonomie",
            image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 45,
            type: "Location de scooter",
            frequence: "Sur réservation",
            duree: "À la journée",
            tarif: "À partir de 40000 Ar/jour",
            contact: "Mada Scooters: +261 34 22 334 45",
            note: 4.1,
            avantages: "Pratique, Économique",
            image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 46,
            type: "Tuk-tuk",
            frequence: "Disponible partout",
            duree: "Variable",
            tarif: "5000-15000 Ar selon distance",
            contact: "Disponible dans toutes les rues",
            note: 4.0,
            avantages: "Pratique en ville, Négociable",
            image: "https://images.unsplash.com/photo-1565100484344-2f6c36c2b8c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 47,
            type: "Transfert privé",
            frequence: "Sur réservation",
            duree: "Variable",
            tarif: "À partir de 50000 Ar",
            contact: "Nosy Be Transfers: +261 33 11 222 33",
            note: 4.6,
            avantages: "Confort, Direct",
            image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 48,
            type: "Bateau excursion",
            frequence: "Quotidien (9h)",
            duree: "Journée complète",
            tarif: "À partir de 120000 Ar/personne",
            contact: "Agences locales",
            note: 4.4,
            avantages: "Découverte îlots, Repas inclus",
            image: "https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 49,
            type: "Vélo",
            frequence: "Sur réservation",
            duree: "À la journée",
            tarif: "À partir de 15000 Ar/jour",
            contact: "Hôtels et locations",
            note: 3.9,
            avantages: "Écologique, Bonne santé",
            image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 50,
            type: "Avion taxi",
            frequence: "Sur réservation",
            duree: "Variable",
            tarif: "À partir de 500000 Ar",
            contact: "Air Madagascar: +261 20 22 222 22",
            note: 4.7,
            avantages: "Rapide, Vue exceptionnelle",
            image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        }
    ];

    // Fonction de tri pour les hébergements par prix
    const sortByPrice = (data) => {
        return [...data].sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.prixMoyen - b.prixMoyen;
            } else {
                return b.prixMoyen - a.prixMoyen;
            }
        });
    };

    // Fonction pour obtenir les données triées selon l'onglet actif
    const getSortedData = () => {
        switch (activeTab) {
            case 'hebergements':
                return sortByPrice(hebergementsData);
            case 'sites':
                return sitesData;
            case 'restaurants':
                return restaurantsData;
            case 'guides':
                return guidesData;
            case 'transports':
                return transportsData;
            default:
                return [];
        }
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

    // Fonction pour formater les prix
    const formatPrice = (price) => {
        return price === 0 ? 'Gratuit' : `${price.toLocaleString()} Ar`;
    };

    return (
        <div className={`${styles["nosybe-container"]} ${styles[animeTheme]}`} ref={mainRef}>
            {/* Header amélioré avec animation */}
            <header className={`${styles["header"]} ${isScrolled ? styles.scrolled : ''} ${styles.animatedHeader}`}>
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
                        <Link to="/regions" className={styles["nav-link"]}>
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
                        <button
                            className={styles["ai-button"]}
                            onClick={handleOpenAI}
                            title="Assistant IA"
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
                                    <Link to="/profile" className={styles["dropdown-item"]}>
                                        <i className="fas fa-user-edit"></i> Profil
                                    </Link>
                                    <Link to="/bookings" className={styles["dropdown-item"]}>
                                        <i className="fas fa-calendar-check"></i> Mes réservations
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

            {/* Assistant IA de recommandation */}
            {showRecommendationAI && (
                <React.Suspense fallback={<div className={styles["loading-ai"]}>Chargement de l'assistant IA...</div>}>
                    <RecommendationAI onClose={handleCloseAI} />
                </React.Suspense>
            )}

            {/* Hero Section améliorée */}
            <section className={styles["region-hero"]}>
                <div className={styles["hero-overlay"]}></div>
                <div className={styles["hero-slides"]}>
                    <div className={styles["hero-slide"]} style={{
                        backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/f/f7/Nosy_Be_Island_when_arriving_from_the_sea_%2812%29.jpg')`
                    }}></div>
                    <div className={styles["hero-slide"]} style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1558981806-ec527fa84c39?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`
                    }}></div>
                    <div className={styles["hero-slide"]} style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1565100484344-2f6c36c2b8c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`
                    }}></div>
                </div>

                <div className={styles["hero-content"]}>
                    <h1 className={styles["anime-text"]}>
                        <span className={styles["text-gradient"]}>
                            Nosy <span className={styles["text-highlight"]}>Be</span> & Archipel
                        </span>
                    </h1>
                    <p className={styles["hero-subtitle"]}>
                        L'île aux parfums et ses merveilleux îlots paradisiaques
                    </p>

                    <form className={styles["search-form"]} onSubmit={handleSearch}>
                        <div className={`${styles["search-input-container"]} ${styles["anime-border"]}`}>
                            <i className={`fas fa-search ${styles["search-icon"]}`}></i>
                            <input
                                type="text"
                                placeholder="Rechercher un site, un hôtel, un restaurant..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles["search-input"]}
                            />
                            <button
                                type="submit"
                                className={`${styles["search-button"]}`}
                            >
                                <i className="fas fa-paper-plane"></i>
                                Rechercher
                            </button>
                        </div>
                    </form>

                    <div className={styles["hero-stats"]}>
                        {[
                            { icon: 'fas fa-map-marker-alt', label: '10+ Sites', value: '10+' },
                            { icon: 'fas fa-hotel', label: '10+ Hébergements', value: '10+' },
                            { icon: 'fas fa-utensils', label: '10+ Restaurants', value: '10+' },
                            { icon: 'fas fa-star', label: '4.5/5 Satisfaction', value: '4.5' }
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
                    <div className={styles["floating-palm"]}></div>
                    <div className={styles["floating-shell"]}></div>
                    <div className={styles["floating-wave"]}></div>
                </div>
            </section>

            {/* Tabs Navigation améliorée */}
            <div className={`${styles["tabs-container"]} ${isScrolled ? styles.scrolled : ''}`}>
                <div className={styles["tabs"]}>
                    <button
                        className={`${styles["tab"]} ${activeTab === 'sites' ? styles.active : ''} ${styles["anime-tab"]}`}
                        onClick={() => setActiveTab('sites')}
                        style={{ animationDelay: '0s' }}
                    >
                        <div className={styles["tab-icon-wrapper"]}>
                            <i className="fas fa-map-marker-alt"></i>
                            <div className={styles["tab-glow"]}></div>
                        </div>
                        <span className={styles["tab-text"]}>Sites Touristiques</span>
                        <div className={styles["tab-indicator"]}></div>
                    </button>
                    <button
                        className={`${styles["tab"]} ${activeTab === 'hebergements' ? styles.active : ''} ${styles["anime-tab"]}`}
                        onClick={() => setActiveTab('hebergements')}
                        style={{ animationDelay: '0.1s' }}
                    >
                        <div className={styles["tab-icon-wrapper"]}>
                            <i className="fas fa-hotel"></i>
                            <div className={styles["tab-glow"]}></div>
                        </div>
                        <span className={styles["tab-text"]}>Hébergements</span>
                        <div className={styles["tab-indicator"]}></div>
                    </button>
                    <button
                        className={`${styles["tab"]} ${activeTab === 'restaurants' ? styles.active : ''} ${styles["anime-tab"]}`}
                        onClick={() => setActiveTab('restaurants')}
                        style={{ animationDelay: '0.2s' }}
                    >
                        <div className={styles["tab-icon-wrapper"]}>
                            <i className="fas fa-utensils"></i>
                            <div className={styles["tab-glow"]}></div>
                        </div>
                        <span className={styles["tab-text"]}>Restaurants</span>
                        <div className={styles["tab-indicator"]}></div>
                    </button>
                    <button
                        className={`${styles["tab"]} ${activeTab === 'guides' ? styles.active : ''} ${styles["anime-tab"]}`}
                        onClick={() => setActiveTab('guides')}
                        style={{ animationDelay: '0.3s' }}
                    >
                        <div className={styles["tab-icon-wrapper"]}>
                            <i className="fas fa-user"></i>
                            <div className={styles["tab-glow"]}></div>
                        </div>
                        <span className={styles["tab-text"]}>Guides</span>
                        <div className={styles["tab-indicator"]}></div>
                    </button>
                    <button
                        className={`${styles["tab"]} ${activeTab === 'transports' ? styles.active : ''} ${styles["anime-tab"]}`}
                        onClick={() => setActiveTab('transports')}
                        style={{ animationDelay: '0.4s' }}
                    >
                        <div className={styles["tab-icon-wrapper"]}>
                            <i className="fas fa-bus"></i>
                            <div className={styles["tab-glow"]}></div>
                        </div>
                        <span className={styles["tab-text"]}>Transports</span>
                        <div className={styles["tab-indicator"]}></div>
                    </button>
                </div>
            </div>

            {/* Contrôles de tri (uniquement pour hébergements) */}
            {activeTab === 'hebergements' && (
                <div className={styles["sort-controls"]}>
                    <div className={styles["sort-controls-content"]}>
                        <label>
                            <i className="fas fa-sort-amount-down"></i>
                            Trier par prix:
                        </label>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className={styles["sort-select"]}
                        >
                            <option value="asc">Croissant</option>
                            <option value="desc">Décroissant</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Content Sections améliorées */}
            <div className={styles["content-container"]}>
                {/* Sites Touristiques */}
                {activeTab === 'sites' && (
                    <div className={`${styles["tab-content"]} ${styles["anime-section"]}`}>
                        <div className={styles["section-header"]}>
                            <h2>
                                <span className={styles["title-anime"]}>
                                    Sites <span className={styles["title-accent"]}>Touristiques</span>
                                </span>
                            </h2>
                            <p className={styles["subtitle-anime"]}>
                                Découvrez les trésors naturels et culturels de Nosy Be
                            </p>
                        </div>

                        <div className={styles["cards-grid"]}>
                            {getSortedData().map((site, index) => (
                                <div
                                    key={site.id}
                                    className={`${styles["card"]} ${styles["anime-card"]}`}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className={styles["card-image-container"]}>
                                        <div
                                            className={styles["card-image"]}
                                            style={{ backgroundImage: `url(${site.image})` }}
                                        >
                                            <div className={styles["image-gradient"]}></div>
                                            <div className={styles["card-rating"]}>
                                                {renderStars(site.note)}
                                                <span className={styles["rating-number"]}>{site.note}</span>
                                            </div>
                                            {/* <button
                                                className={`${styles["favorite-button"]} ${favorites.includes(site.id) ? styles.active : ''}`}
                                                onClick={() => handleToggleFavorite(site.id)}
                                                title={favorites.includes(site.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                                            >
                                                <i className={favorites.includes(site.id) ? 'fas fa-heart' : 'far fa-heart'}></i>
                                            </button> */}
                                            <div className={styles["card-badge"]}>
                                                <i className="fas fa-map-marker-alt"></i>
                                                <span>{site.type}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles["card-content"]}>
                                        <div className={styles["card-header"]}>
                                            <h3>
                                                <i className="fas fa-landmark"></i>
                                                {site.nom}
                                            </h3>
                                        </div>

                                        <p className={styles["card-description"]}>{site.description}</p>

                                        {site.highlights && (
                                            <div className={styles["card-highlights"]}>
                                                <span className={styles["highlights-title"]}>Points forts :</span>
                                                <div className={styles["highlights-list"]}>
                                                    {site.highlights.map((highlight, i) => (
                                                        <span key={i} className={styles["highlight-item"]}>
                                                            <i className="fas fa-check-circle"></i> {highlight}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className={styles["card-details"]}>
                                            <div className={styles["detail-item"]}>
                                                <i className="fas fa-tag"></i>
                                                <span className={styles["detail-label"]}>Prix:</span>
                                                <span className={styles["detail-value"]}>{formatPrice(site.prixMoyen)}</span>
                                            </div>
                                            <div className={styles["detail-item"]}>
                                                <i className="fas fa-clock"></i>
                                                <span className={styles["detail-label"]}>Durée:</span>
                                                <span className={styles["detail-value"]}>{site.dureeVisite}</span>
                                            </div>
                                            <div className={styles["detail-item"]}>
                                                <i className="fas fa-calendar"></i>
                                                <span className={styles["detail-label"]}>Saison:</span>
                                                <span className={styles["detail-value"]}>{site.meilleurePeriode}</span>
                                            </div>
                                            <div className={styles["detail-item"]}>
                                                <i className="fas fa-phone"></i>
                                                <span className={styles["detail-label"]}>Contact:</span>
                                                <span className={styles["detail-value"]}>{site.contact}</span>
                                            </div>
                                        </div>

                                        {/* <div className={styles["card-footer"]}>
                                            <button
                                                className={styles["card-button"]}
                                                onClick={() => navigate(`/site/${site.id}`)}
                                            >
                                                <i className="fas fa-info-circle"></i>
                                                <span>Détails</span>
                                            </button>
                                            <button
                                                className={`${styles["card-button"]} ${styles["primary"]}`}
                                                onClick={() => navigate('/contact')}
                                            >
                                                <i className="fas fa-calendar-plus"></i>
                                                <span>Réserver</span>
                                            </button>
                                        </div> */}
                                    </div>

                                    {/* Effets anime */}
                                    <div className={styles["card-glow"]}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Hébergements */}
                {activeTab === 'hebergements' && (
                    <div className={`${styles["tab-content"]} ${styles["anime-section"]}`}>
                        <div className={styles["section-header"]}>
                            <h2>
                                <span className={styles["title-anime"]}>
                                    Hébergements à <span className={styles["title-accent"]}>Nosy Be</span>
                                </span>
                            </h2>
                            <p className={styles["subtitle-anime"]}>
                                Trouvez le logement parfait pour votre séjour paradisiaque
                            </p>
                        </div>

                        <div className={styles["cards-grid"]}>
                            {getSortedData().map((hebergement, index) => (
                                <div
                                    key={hebergement.id}
                                    className={`${styles["card"]} ${styles["anime-card"]}`}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className={styles["card-image-container"]}>
                                        <div
                                            className={styles["card-image"]}
                                            style={{ backgroundImage: `url(${hebergement.image})` }}
                                        >
                                            <div className={styles["image-gradient"]}></div>
                                            <div className={styles["card-rating"]}>
                                                {renderStars(hebergement.note)}
                                                <span className={styles["rating-number"]}>{hebergement.note}</span>
                                            </div>
                                            {/* <button
                                                className={`${styles["favorite-button"]} ${favorites.includes(hebergement.id) ? styles.active : ''}`}
                                                onClick={() => handleToggleFavorite(hebergement.id)}
                                                title={favorites.includes(hebergement.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                                            >
                                                <i className={favorites.includes(hebergement.id) ? 'fas fa-heart' : 'far fa-heart'}></i>
                                            </button> */}
                                            <div className={styles["card-badge"]}>
                                                <i className="fas fa-hotel"></i>
                                                <span>{hebergement.type}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles["card-content"]}>
                                        <div className={styles["card-header"]}>
                                            <h3>
                                                <i className="fas fa-building"></i>
                                                {hebergement.nom}
                                            </h3>
                                            <div className={styles["card-price"]}>
                                                <i className="fas fa-tag"></i>
                                                <span>{hebergement.prixMoyen.toLocaleString()} Ar/nuit</span>
                                            </div>
                                        </div>

                                        <p className={styles["card-description"]}>{hebergement.description}</p>

                                        <div className={styles["card-details"]}>
                                            <div className={styles["detail-item"]}>
                                                <i className="fas fa-map-pin"></i>
                                                <span className={styles["detail-label"]}>Emplacement:</span>
                                                <span className={styles["detail-value"]}>{hebergement.emplacement}</span>
                                            </div>
                                            <div className={styles["detail-item"]}>
                                                <i className="fas fa-concierge-bell"></i>
                                                <span className={styles["detail-label"]}>Services:</span>
                                                <span className={styles["detail-value"]}>{hebergement.services}</span>
                                            </div>
                                            <div className={styles["detail-item"]}>
                                                <i className="fas fa-phone"></i>
                                                <span className={styles["detail-label"]}>Contact:</span>
                                                <span className={styles["detail-value"]}>{hebergement.contact}</span>
                                            </div>
                                        </div>

                                        {/* <div className={styles["card-footer"]}>
                                            <button
                                                className={styles["card-button"]}
                                                onClick={() => navigate(`/hebergement/${hebergement.id}`)}
                                            >
                                                <i className="fas fa-info-circle"></i>
                                                <span>Détails</span>
                                            </button>
                                            <button
                                                className={`${styles["card-button"]} ${styles["primary"]}`}
                                                onClick={() => navigate('/booking')}
                                            >
                                                <i className="fas fa-calendar-check"></i>
                                                <span>Réserver</span>
                                            </button>
                                        </div> */}
                                    </div>

                                    {/* Effets anime */}
                                    <div className={styles["card-glow"]}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Restaurants */}
                {activeTab === 'restaurants' && (
                    <div className={`${styles["tab-content"]} ${styles["anime-section"]}`}>
                        <div className={styles["section-header"]}>
                            <h2>
                                <span className={styles["title-anime"]}>
                                    Restaurants & <span className={styles["title-accent"]}>Cuisine</span>
                                </span>
                            </h2>
                            <p className={styles["subtitle-anime"]}>
                                Dégustez les saveurs locales dans les meilleurs établissements
                            </p>
                        </div>

                        <div className={styles["cards-grid"]}>
                            {getSortedData().map((restaurant, index) => (
                                <div
                                    key={restaurant.id}
                                    className={`${styles["card"]} ${styles["anime-card"]}`}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className={styles["card-image-container"]}>
                                        <div
                                            className={styles["card-image"]}
                                            style={{ backgroundImage: `url(${restaurant.image})` }}
                                        >
                                            <div className={styles["image-gradient"]}></div>
                                            <div className={styles["card-rating"]}>
                                                {renderStars(restaurant.note)}
                                                <span className={styles["rating-number"]}>{restaurant.note}</span>
                                            </div>
                                            {/* <button
                                                className={`${styles["favorite-button"]} ${favorites.includes(restaurant.id) ? styles.active : ''}`}
                                                onClick={() => handleToggleFavorite(restaurant.id)}
                                                title={favorites.includes(restaurant.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                                            >
                                                <i className={favorites.includes(restaurant.id) ? 'fas fa-heart' : 'far fa-heart'}></i>
                                            </button> */}
                                            <div className={styles["card-badge"]}>
                                                <i className="fas fa-utensils"></i>
                                                <span>{restaurant.specialite}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles["card-content"]}>
                                        <div className={styles["card-header"]}>
                                            <h3>
                                                <i className="fas fa-restaurant"></i>
                                                {restaurant.nom}
                                            </h3>
                                            <div className={styles["card-price"]}>
                                                <i className="fas fa-tag"></i>
                                                <span>{restaurant.prixMoyen.toLocaleString()} Ar/repas</span>
                                            </div>
                                        </div>

                                        <p className={styles["card-description"]}>{restaurant.description}</p>

                                        <div className={styles["card-details"]}>
                                            <div className={styles["detail-item"]}>
                                                <i className="fas fa-clock"></i>
                                                <span className={styles["detail-label"]}>Horaires:</span>
                                                <span className={styles["detail-value"]}>{restaurant.horaire}</span>
                                            </div>
                                            <div className={styles["detail-item"]}>
                                                <i className="fas fa-music"></i>
                                                <span className={styles["detail-label"]}>Ambiance:</span>
                                                <span className={styles["detail-value"]}>{restaurant.ambiance}</span>
                                            </div>
                                        </div>

                                        {/* <div className={styles["card-footer"]}>
                                            <button
                                                className={styles["card-button"]}
                                                onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                                            >
                                                <i className="fas fa-info-circle"></i>
                                                <span>Menu</span>
                                            </button>
                                            <button
                                                className={`${styles["card-button"]} ${styles["primary"]}`}
                                                onClick={() => navigate('/reservation')}
                                            >
                                                <i className="fas fa-phone-alt"></i>
                                                <span>Réserver</span>
                                            </button>
                                        </div> */}
                                    </div>

                                    {/* Effets anime */}
                                    <div className={styles["card-glow"]}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Guides */}
                {activeTab === 'guides' && (
                    <div className={`${styles["tab-content"]} ${styles["anime-section"]}`}>
                        <div className={styles["section-header"]}>
                            <h2>
                                <span className={styles["title-anime"]}>
                                    Guides <span className={styles["title-accent"]}>Touristiques</span>
                                </span>
                            </h2>
                            <p className={styles["subtitle-anime"]}>
                                Des experts locaux pour une expérience authentique et enrichissante
                            </p>
                        </div>

                        <div className={styles["cards-grid"]}>
                            {getSortedData().map((guide, index) => (
                                <div
                                    key={guide.id}
                                    className={`${styles["card"]} ${styles["anime-card"]}`}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className={styles["card-image-container"]}>
                                        <div
                                            className={styles["card-image"]}
                                            style={{ backgroundImage: `url(${guide.image})` }}
                                        >
                                            <div className={styles["image-gradient"]}></div>
                                            <div className={styles["card-rating"]}>
                                                {renderStars(guide.note)}
                                                <span className={styles["rating-number"]}>{guide.note}</span>
                                            </div>
                                            <div className={styles["card-badge"]}>
                                                <i className="fas fa-user"></i>
                                                <span>{guide.specialite}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles["card-content"]}>
                                        <div className={styles["card-header"]}>
                                            <h3>
                                                <i className="fas fa-user-tie"></i>
                                                {guide.nom}
                                            </h3>
                                            <div className={styles["card-experience"]}>
                                                <i className="fas fa-star"></i>
                                                <span>{guide.experience} d'expérience</span>
                                            </div>
                                        </div>

                                        <div className={styles["card-details"]}>
                                            <div className={styles["detail-item"]}>
                                                <i className="fas fa-language"></i>
                                                <span className={styles["detail-label"]}>Langues:</span>
                                                <span className={styles["detail-value"]}>{guide.langues}</span>
                                            </div>
                                            <div className={styles["detail-item"]}>
                                                <i className="fas fa-calendar-alt"></i>
                                                <span className={styles["detail-label"]}>Disponibilité:</span>
                                                <span className={styles["detail-value"]}>{guide.disponibilite}</span>
                                            </div>
                                            <div className={styles["detail-item"]}>
                                                <i className="fas fa-list-check"></i>
                                                <span className={styles["detail-label"]}>Prestations:</span>
                                                <span className={styles["detail-value"]}>{guide.prestations}</span>
                                            </div>
                                            <div className={styles["detail-item"]}>
                                                <i className="fas fa-phone"></i>
                                                <span className={styles["detail-label"]}>Contact:</span>
                                                <span className={styles["detail-value"]}>{guide.contact}</span>
                                            </div>
                                        </div>

                                        {/* <div className={styles["card-footer"]}>
                                            <button
                                                className={styles["card-button"]}
                                                onClick={() => navigate(`/guide/${guide.id}`)}
                                            >
                                                <i className="fas fa-info-circle"></i>
                                                <span>Profil</span>
                                            </button>
                                            <button
                                                className={`${styles["card-button"]} ${styles["primary"]}`}
                                                onClick={() => navigate('/contact')}
                                            >
                                                <i className="fas fa-comments"></i>
                                                <span>Contacter</span>
                                            </button>
                                        </div> */}
                                    </div>

                                    {/* Effets anime */}
                                    <div className={styles["card-glow"]}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Transports */}
                {activeTab === 'transports' && (
                    <div className={`${styles["tab-content"]} ${styles["anime-section"]}`}>
                        <div className={styles["section-header"]}>
                            <h2>
                                <span className={styles["title-anime"]}>
                                    Options de <span className={styles["title-accent"]}>Transport</span>
                                </span>
                            </h2>
                            <p className={styles["subtitle-anime"]}>
                                Déplacez-vous facilement sur l'île et découvrez les îlots alentours
                            </p>
                        </div>

                        <div className={styles["cards-grid"]}>
                            {getSortedData().map((transport, index) => (
                                <div
                                    key={transport.id}
                                    className={`${styles["card"]} ${styles["anime-card"]}`}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className={styles["card-image-container"]}>
                                        <div
                                            className={styles["card-image"]}
                                            style={{ backgroundImage: `url(${transport.image})` }}
                                        >
                                            <div className={styles["image-gradient"]}></div>
                                            <div className={styles["card-rating"]}>
                                                {renderStars(transport.note)}
                                                <span className={styles["rating-number"]}>{transport.note}</span>
                                            </div>
                                            <div className={styles["card-badge"]}>
                                                <i className="fas fa-bus"></i>
                                                <span>{transport.type}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles["card-content"]}>
                                        <div className={styles["card-header"]}>
                                            <h3>
                                                <i className="fas fa-route"></i>
                                                {transport.type}
                                            </h3>
                                        </div>

                                        <div className={styles["card-details"]}>
                                            <div className={styles["detail-item"]}>
                                                <i className="fas fa-clock"></i>
                                                <span className={styles["detail-label"]}>Fréquence:</span>
                                                <span className={styles["detail-value"]}>{transport.frequence}</span>
                                            </div>
                                            <div className={styles["detail-item"]}>
                                                <i className="fas fa-hourglass-half"></i>
                                                <span className={styles["detail-label"]}>Durée:</span>
                                                <span className={styles["detail-value"]}>{transport.duree}</span>
                                            </div>
                                            <div className={styles["detail-item"]}>
                                                <i className="fas fa-tag"></i>
                                                <span className={styles["detail-label"]}>Tarif:</span>
                                                <span className={styles["detail-value"]}>{transport.tarif}</span>
                                            </div>
                                            <div className={styles["detail-item"]}>
                                                <i className="fas fa-plus"></i>
                                                <span className={styles["detail-label"]}>Avantages:</span>
                                                <span className={styles["detail-value"]}>{transport.avantages}</span>
                                            </div>
                                            <div className={styles["detail-item"]}>
                                                <i className="fas fa-phone"></i>
                                                <span className={styles["detail-label"]}>Contact:</span>
                                                <span className={styles["detail-value"]}>{transport.contact}</span>
                                            </div>
                                        </div>

                                        {/* <div className={styles["card-footer"]}>
                                            <button
                                                className={styles["card-button"]}
                                                onClick={() => navigate('/transport-info')}
                                            >
                                                <i className="fas fa-info-circle"></i>
                                                <span>Infos</span>
                                            </button>
                                            <button
                                                className={`${styles["card-button"]} ${styles["primary"]}`}
                                                onClick={() => navigate('/booking-transport')}
                                            >
                                                <i className="fas fa-calendar-alt"></i>
                                                <span>Réserver</span>
                                            </button>
                                        </div> */}
                                    </div>

                                    {/* Effets anime */}
                                    <div className={styles["card-glow"]}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* CTA Section conditionnelle */}
            {!isLoggedIn ? (
                <section className={styles["nosybe-cta"]}>
                    <div className={styles["cta-content"]}>
                        <div className={styles["cta-animation"]}>
                            <div className={styles["cta-orbs"]}>
                                <div className={styles["orb-1"]}></div>
                                <div className={styles["orb-2"]}></div>
                                <div className={styles["orb-3"]}></div>
                            </div>
                        </div>

                        <h2>Prêt pour l'aventure à Nosy Be ?</h2>
                        <p>Créez votre compte pour réserver vos activités, hébergements et recevoir des recommandations personnalisées</p>

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
                <section className={styles["user-nosybe-cta"]}>
                    <div className={styles["user-cta-content"]}>
                        <div className={styles["user-cta-animation"]}>
                            <div className={styles["user-cta-orbs"]}>
                                <div className={styles["user-orb-1"]}></div>
                                <div className={styles["user-orb-2"]}></div>
                            </div>
                        </div>

                        <h2>Continuez votre découverte de Nosy Be !</h2>
                        <p>Planifiez votre voyage, réservez vos activités et partagez vos expériences</p>

                        <div className={styles["user-cta-buttons"]}>
                            <Link to="/dashboard" className={`${styles["user-cta-button"]} ${styles["primary"]}`}>
                                <i className="fas fa-compass"></i>
                                <span>Mon voyage</span>
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
                                Votre guide pour découvrir les trésors de Nosy Be.
                                Expériences authentiques et mémorables.
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
                                    Explorez Nosy Be
                                </h3>
                                <ul>
                                    {['Sites touristiques', 'Plages', 'Hébergements', 'Restaurants', 'Activités'].map((item) => (
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
                                    {['Conseils voyage', 'Météo', 'FAQ', 'Contact', 'Blog'].map((item) => (
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
                                Infos Nosy Be
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
                                    <i className="fas fa-umbrella-beach"></i>
                                    <div className={styles["avatar-status"]}></div>
                                </div>
                                <div className={styles["chatbox-info"]}>
                                    <h3>Assistant Nosy Be</h3>
                                    <p>En ligne • Expert île aux parfums</p>
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
                                    placeholder="Posez-moi une question sur Nosy Be..."
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

export default NosyBe;