import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import clsx from 'clsx';
import styles from './css/Blog.module.css';
import logos from '../images/logo-site4.png';

// Images pour le carrousel hero
const heroImages = [
  'https://images.unsplash.com/photo-1566438480900-0609be27a4be?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1503917988258-f87a78e3c995?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1527631746610-bca00a040d60?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'
];

// Composant IA de recommandation (chargement différé pour performance)
const RecommendationAI = lazy(() => import('../components/recommendation/RecommendationAI'));

// Messages par défaut pour le chatbot
const defaultChatMessages = [
  {
    id: 1,
    text: "Bonjour ! Je suis votre assistant MadaTour pour les conseils de voyage. Je peux vous aider à :",
    sender: 'bot',
    timestamp: new Date(),
    options: [
      "Conseils pour préparer mon voyage",
      "Meilleure période pour visiter",
      "Budget recommandé",
      "Santé et sécurité"
    ]
  },
  {
    id: 2,
    text: "Posez-moi vos questions sur Madagascar ou choisissez une option ci-dessus !",
    sender: 'bot',
    timestamp: new Date()
  }
];

// Données des articles enrichies
const initialArticles = [
  {
    id: 1,
    title: 'Quand visiter Madagascar ? Le guide complet par région',
    excerpt: 'Découvrez les meilleures périodes pour visiter selon les régions et les activités que vous souhaitez faire. Notre guide mois par mois vous aidera à planifier votre voyage idéal.',
    fullContent: `
            <h2>Introduction</h2>
            <p>Madagascar, la quatrième plus grande île du monde, offre des paysages diversifiés et des climats variés selon les régions. Choisir la bonne période pour visiter est essentiel pour profiter pleinement de votre voyage.</p>
            
            <h2>Les Saisons à Madagascar</h2>
            <h3>Saison Sèche (Avril à Novembre)</h3>
            <p>La saison sèche est généralement considérée comme la meilleure période pour visiter Madagascar :</p>
            <ul>
                <li><strong>Avril-Mai</strong> : Températures agréables, végétation verte après la saison des pluies</li>
                <li><strong>Juin-Août</strong> : Temps frais, idéal pour les randonnées</li>
                <li><strong>Septembre-Novembre</strong> : Températures plus chaudes, peu de pluie</li>
            </ul>
            
            <h3>Saison des Pluies (Décembre à Mars)</h3>
            <p>La saison humide présente certains avantages malgré les pluies :</p>
            <ul>
                <li>Végétation luxuriante et paysages verdoyants</li>
                <li>Moins de touristes</li>
                <li>Prix plus attractifs</li>
                <li>Certaines régions sont difficiles d'accès</li>
            </ul>
            
            <h2>Guide Régional</h2>
            <h3>Côte Est (Nosy Be, Sainte-Marie)</h3>
            <p><strong>Meilleure période : Juin à Septembre</strong></p>
            <p>Évitez la saison des cyclones (janvier à mars). La période des baleines à bosse s'étend de juillet à septembre à Sainte-Marie.</p>
            
            <h3>Hauts Plateaux (Antananarivo)</h3>
            <p><strong>Meilleure période : Avril à Octobre</strong></p>
            <p>Temps frais et sec. Évitez décembre à février qui peut être pluvieux et frais.</p>
            
            <h3>Sud et Sud-Ouest (Tulear, Morondava)</h3>
            <p><strong>Meilleure période : Mars à Décembre</strong></p>
            <p>Climat semi-aride avec peu de pluie même pendant la saison humide.</p>
            
            <h2>Calendrier des Événements</h2>
            <ul>
                <li><strong>Janvier</strong> : Alahamady Be (Nouvel An malgache)</li>
                <li><strong>Mars</strong> : Fête de l'Indépendance (26 mars)</li>
                <li><strong>Mai</strong> : Célébration des récoltes</li>
                <li><strong>Juin-Décembre</strong> : Festival des baleines à Sainte-Marie</li>
            </ul>
            
            <h2>Conseils Pratiques</h2>
            <p><strong>Pour les photographes</strong> : Les mois de septembre et octobre offrent une lumière idéale.</p>
            <p><strong>Pour les budgets serrés</strong> : Novembre et décembre proposent souvent de bonnes offres.</p>
            <p><strong>Pour éviter la foule</strong> : Avril-mai et octobre-novembre.</p>
            
            <h2>Conclusion</h2>
            <p>Il n'y a pas de "mauvaise" période pour visiter Madagascar, seulement différentes expériences. Votre choix dépendra de vos priorités : météo, prix, événements ou activités spécifiques.</p>
            
            <div class="tip">
                <strong>💡 Conseil Expert :</strong> Pour un premier voyage, privilégiez la période de juin à septembre qui combine bonnes conditions météo et nombreuses activités possibles.
            </div>
        `,
    category: 'Conseils voyage',
    date: '15 juin 2023',
    readTime: '5 min',
    image: 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    author: 'Jean Dupont',
    authorAvatar: '👨',
    authorBio: 'Guide touristique certifié avec 15 ans d\'expérience à Madagascar',
    views: 1243,
    likes: 89,
    comments: 24,
    featured: true,
    tags: ['Saison', 'Météo', 'Guide', 'Planification']
  },
  {
    id: 2,
    title: 'Les 10 plages incontournables de Madagascar',
    excerpt: 'Notre sélection des plus belles plages de Madagascar, des eaux turquoises de Nosy Be aux plages désertes du Sud. Chaque plage est unique avec ses caractéristiques propres.',
    fullContent: `
            <h2>Introduction</h2>
            <p>Avec près de 5 000 km de côtes, Madagascar possède certaines des plus belles plages du monde. Voici notre sélection des 10 incontournables.</p>
            
            <h2>1. Nosy Iranja - "L\'île aux tortues"</h2>
            <p><strong>Localisation :</strong> Au large de Nosy Be</p>
            <p><strong>Caractéristiques :</strong> Deux îles reliées par un banc de sable à marée basse, eaux cristallines, observation des tortues marines.</p>
            <p><strong>Meilleur moment :</strong> Juin à septembre</p>
            <p><strong>Activités :</strong> Snorkeling, observation des tortues, farniente</p>
            
            <h2>2. Anakao</h2>
            <p><strong>Localisation :</strong> Côte sud-ouest, près de Tulear</p>
            <p><strong>Caractéristiques :</strong> Sable blanc, eaux turquoises, village de pêcheurs traditionnel</p>
            <p><strong>Particularité :</strong> Accès uniquement en bateau depuis Tulear</p>
            
            <h2>3. Ifaty</h2>
            <p><strong>Localisation :</strong> Côte sud-ouest</p>
            <p><strong>Caractéristiques :</strong> Plage de sable fin protégée par une barrière de corail, baobabs en bord de mer</p>
            <p><strong>Spécialité :</strong> Plongée et snorkeling exceptionnels</p>
            
            <h2>4. Île Sainte-Marie</h2>
            <p><strong>Localisation :</strong> Côte est</p>
            <p><strong>Caractéristiques :</strong> Plages de sable fin bordées de cocotiers, ambiance paisible</p>
            <p><strong>Point fort :</strong> Observation des baleines à bosse (juillet-septembre)</p>
            
            <h2>5. Ramena Beach</h2>
            <p><strong>Localisation :</strong> Près de Diego Suarez (Antsiranana)</p>
            <p><strong>Caractéristiques :</strong> Grande baie en forme de croissant, eaux calmes</p>
            <p><strong>Idéal pour :</strong> Familles avec enfants</p>
            
            <h2>6. Ambatomilo</h2>
            <p><strong>Localisation :</strong> Côte sud-ouest, région de Morombe</p>
            <p><strong>Caractéristiques :</strong> Plages désertes, sable rose par endroits</p>
            <p><strong>Atmosphère :</strong> Authentique et préservée du tourisme de masse</p>
            
            <h2>7. Tampolo</h2>
            <p><strong>Localisation :</strong> Côte est, près de Foulpointe</p>
            <p><strong>Caractéristiques :</strong> Plage bordée de filaos (pins), eaux peu profondes</p>
            <p><strong>Activités :</strong> Pêche traditionnelle, découverte de la culture Betsimisaraka</p>
            
            <h2>8. Salary Bay</h2>
            <p><strong>Localisation :</strong> Sud-ouest, entre Morombe et Tulear</p>
            <p><strong>Caractéristiques :</strong> Baie isolée accessible en 4x4, camping sauvage possible</p>
            <p><strong>Pour :</strong> Les amateurs d'aventure et de nature préservée</p>
            
            <h2>9. Nosy Sakatia</h2>
            <p><strong>Localisation :</strong> À côté de Nosy Be</p>
            <p><strong>Surnom :</strong> "L\'île aux orchidées"</p>
            <p><strong>Particularité :</strong> Plage tranquille, excellente pour le snorkeling avec les tortues</p>
            
            <h2>10. Foulpointe</h2>
            <p><strong>Localisation :</strong> Côte est, à 60km de Toamasina</p>
            <p><strong>Caractéristiques :</strong> Plage populaire auprès des Malgaches, nombreux restaurants de poissons</p>
            <p><strong>Ambiance :</strong> Vivante et authentique</p>
            
            <h2>Conseils pour Profiter des Plages Malgaches</h2>
            <ul>
                <li><strong>Protection solaire :</strong> Le soleil est intense sous les tropiques</li>
                <li><strong>Respect de l\'environnement :</strong> Ne ramassez pas de coraux ou de coquillages</li>
                <li><strong>Sécurité :</strong> Attention aux courants, notamment sur la côte est</li>
                <li><strong>Équipement :</strong> Masque et tuba recommandés pour admirer la vie marine</li>
            </ul>
            
            <h2>Conclusion</h2>
            <p>Des plages animées aux criques isolées, Madagascar offre une diversité de plages pour tous les goûts. Que vous cherchiez le farniente, l'aventure ou la découverte marine, vous trouverez votre bonheur sur les côtes malgaches.</p>
            
            <div class="tip">
                <strong>🏖️ Conseil Local :</strong> Pour une expérience authentique, visitez les plages le week-end et partagez un repas de poisson grillé avec les habitants locaux.
            </div>
        `,
    category: 'Destinations',
    date: '2 juin 2023',
    readTime: '7 min',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    author: 'Marie Lambert',
    authorAvatar: '👩',
    authorBio: 'Photographe de voyage spécialiste de Madagascar depuis 10 ans',
    views: 987,
    likes: 145,
    comments: 32,
    featured: true,
    tags: ['Plages', 'Nosy Be', 'Sainte-Marie', 'Bord de mer']
  },
  {
    id: 3,
    title: 'Comprendre la culture malgache : traditions et coutumes',
    excerpt: 'Plongez au cœur des traditions malgaches. Cet article vous explique les coutumes locales, les fady (tabous) à respecter et comment interagir avec la population pour un voyage respectueux.',
    fullContent: `
            <h2>Introduction à la Culture Malgache</h2>
            <p>La culture malgache est un mélange unique d'influences africaines, asiatiques et arabes. Comprendre les traditions et coutumes est essentiel pour un voyage respectueux et enrichissant.</p>
            
            <h2>Les Fondements de la Société Malgache</h2>
            <h3>Le Fihavanana</h3>
            <p>Concept central signifiant "parenté, amitié, solidarité". C'est le lien qui unit les Malgaches entre eux et avec leurs ancêtres.</p>
            
            <h3>Le Respect des Anciens</h3>
            <p>Les personnes âgées sont traitées avec un grand respect. Il est important de les saluer en premier.</p>
            
            <h2>Les Fady (Tabous)</h2>
            <p>Les fady sont des interdits qui varient selon les régions et les clans. En voici quelques-uns courants :</p>
            
            <h3>Fady Généraux</h3>
            <ul>
                <li><strong>Pointer du doigt :</strong> Évitez de pointer les tombeaux, les personnes âgées ou les zébus</li>
                <li><strong>Siffler la nuit :</strong> Considéré comme appelant les mauvais esprits</li>
                <li><strong>Manger du porc à certaines périodes :</strong> Dans certaines régions</li>
            </ul>
            
            <h3>Fady dans les Cimetières</h3>
            <ul>
                <li>Ne pas porter de vêtements rouges</li>
                <li>Ne pas photographier sans permission</li>
                <li>Respecter une distance avec les tombeaux</li>
            </ul>
            
            <h2>La Famille et la Communauté</h2>
            <h3>Structure Familiale</h3>
            <p>Les familles sont généralement nombreuses et étendues. Les décisions importantes sont souvent prises collectivement.</p>
            
            <h3>Rôles Traditionnels</h3>
            <p>Bien que les rôles évoluent, on observe encore souvent :</p>
            <ul>
                <li>Hommes : Travaux agricoles, construction</li>
                <li>Femmes : S'occupent du foyer, du marché, des enfants</li>
            </ul>
            
            <h2>Cérémonies et Rituels</h2>
            <h3>Le Famadihana (Retournement des Morts)</h3>
            <p>Cérémonie traditionnelle où les dépouilles des ancêtres sont exhumées, enveloppées dans de nouveaux linceuls et portées en procession.</p>
            
            <h3>Le Tromba (Possession Spirituelle)</h3>
            <p>Cérémonie de possession où les esprits des ancêtres "prennent" temporairement possession d'une personne.</p>
            
            <h2>Arts et Artisanat</h2>
            <h3>Musique et Danse</h3>
            <ul>
                <li><strong>Hiragasy :</strong> Spectacle traditionnel mêlant musique, danse et théâtre</li>
                <li><strong>Salegy :</strong> Musique populaire moderne</li>
                <li><strong>Valiha :</strong> Instrument traditionnel à cordes</li>
            </ul>
            
            <h3>Artisanat</h3>
            <ul>
                <li><strong>Lamba :</strong> Étoffe traditionnelle</li>
                <li><strong>Sculpture sur bois :</strong> Notamment les statues d'ancêtres</li>
                <li><strong>Vannerie :</strong> Paniers et chapeaux</li>
            </ul>
            
            <h2>Conseils pour les Voyageurs</h2>
            <h3>Comportement à Adopter</h3>
            <ul>
                <li><strong>Salutations :</strong> Prenez le temps de saluer avant toute conversation</li>
                <li><strong>Demander la permission :</strong> Pour photographier les personnes</li>
                <li><strong>Respecter le silence :</strong> Dans les lieux sacrés</li>
            </ul>
            
            <h3>Gestes à Éviter</h3>
            <ul>
                <li>Critiquer ouvertement</li>
                <li>Manquer de respect aux anciens</li>
                <li>Refuser une invitation poliment faite</li>
            </ul>
            
            <h3>Quelques Phrases Utiles</h3>
            <ul>
                <li><strong>Manao ahoana :</strong> Bonjour, comment allez-vous ?</li>
                <li><strong>Misaotra :</strong> Merci</li>
                <li><strong>Azafady :</strong> S'il vous plaît / Excusez-moi</li>
                <li><strong>Veloma :</strong> Au revoir</li>
            </ul>
            
            <h2>Conclusion</h2>
            <p>La culture malgache est riche et complexe. En montrant du respect pour les traditions locales, vous ouvrirez les portes d'une expérience authentique et mémorable. Les Malgaches sont généralement très accueillants envers les visiteurs respectueux de leur culture.</p>
            
            <div class="tip">
                <strong>🤝 Conseil de Respect :</strong> Quand vous visitez un village, présentez-vous d'abord au chef de village (le "mpanjaka") et demandez la permission avant de prendre des photos.
            </div>
        `,
    category: 'Culture',
    date: '20 mai 2023',
    readTime: '8 min',
    image: 'https://images.unsplash.com/photo-1503917988258-f87a78e3c995?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    author: 'Thomas Rakoto',
    authorAvatar: '👨',
    authorBio: 'Anthropologue spécialiste des cultures malgaches',
    views: 756,
    likes: 67,
    comments: 18,
    tags: ['Culture', 'Traditions', 'Fady', 'Respect']
  },
  {
    id: 4,
    title: 'Itinéraire 2 semaines : la route des Tsingy',
    excerpt: 'Découvrez notre itinéraire détaillé pour explorer les Tsingy de Bemaraha et les merveilles du centre-ouest de Madagascar en deux semaines. Hébergements, transports et activités inclus.',
    fullContent: `
            <h2>Introduction</h2>
            <p>Cet itinéraire de 14 jours vous emmène à la découverte des paysages spectaculaires du centre-ouest de Madagascar, avec comme point d'orgue les fameux Tsingy de Bemaraha, classés au patrimoine mondial de l'UNESCO.</p>
            
            <h2>Préparation du Voyage</h2>
            <h3>Meilleure Période</h3>
            <p><strong>Avril à Novembre</strong> - La route vers les Tsingy n'est accessible qu'en saison sèche.</p>
            
            <h3>Budget Moyen</h3>
            <ul>
                <li><strong>Économique :</strong> 800-1000€ par personne</li>
                <li><strong>Confort :</strong> 1200-1500€ par personne</li>
                <li><strong>Luxe :</strong> 2000€+ par personne</li>
            </ul>
            
            <h2>Itinéraire Détailé Jour par Jour</h2>
            
            <h3>Jour 1-2 : Antananarivo</h3>
            <p><strong>Activités :</strong></p>
            <ul>
                <li>Visite du Palais de la Reine (Rova)</li>
                <li>Marché artisanal d'Andravoahangy</li>
                <li>Découverte du Lac Anosy</li>
            </ul>
            <p><strong>Hébergement recommandé :</strong> Hotel Sakamanga ou similar</p>
            
            <h3>Jour 3 : Route vers Antsirabe</h3>
            <p><strong>Distance :</strong> 170km (3-4 heures)</p>
            <p><strong>Arrêts :</strong></p>
            <ul>
                <li>Ambatomanga (village traditionnel)</li>
                <li>Atelier de confection de lamba à Ambatolampy</li>
            </ul>
            
            <h3>Jour 4 : Antsirabe</h3>
            <p><strong>Surnom :</strong> La ville d'eau</p>
            <p><strong>Activités :</strong></p>
            <ul>
                <li>Tour en pousse-pousse</li>
                <li>Visite des ateliers de broderie et de pierres semi-précieuses</li>
                <li>Sources thermales</li>
            </ul>
            
            <h3>Jour 5 : Antsirabe à Miandrivazo</h3>
            <p><strong>Distance :</strong> 230km (5-6 heures)</p>
            <p><strong>Paysages :</strong> Collines et rizières</p>
            
            <h3>Jour 6 : Miandrivazo à Bekopaka</h3>
            <p><strong>Distance :</strong> 200km (8-10 heures)</p>
            <p><strong>Particularité :</strong> Route difficile mais spectaculaire</p>
            <p><strong>Traversée :</strong> Bac sur la rivière Manambolo</p>
            
            <h3>Jour 7-8 : Tsingy de Bemaraha</h3>
            <p><strong>Activités :</strong></p>
            <ul>
                <li><strong>Petits Tsingy :</strong> Randonnée de 2-3 heures</li>
                <li><strong>Grands Tsingy :</strong> Randonnée de 4-5 heures (via ferrata incluse)</li>
                <li><strong>Grotte d'Andriamamol :</strong> Visite de 1 heure</li>
                <li><strong>Canyon de la Manambolo :</strong> Excursion en pirogue</li>
            </ul>
            <p><strong>Conseil :</strong> Engagez un guide local obligatoire</p>
            
            <h3>Jour 9 : Retour à Belo-sur-Tsiribihina</h3>
            <p><strong>Distance :</strong> 150km (5-6 heures)</p>
            <p><strong>Arrêt :</strong> Village de pêcheurs sur la rivière Tsiribihina</p>
            
            <h3>Jour 10 : Belo à Morondava</h3>
            <p><strong>Distance :</strong> 100km (2-3 heures)</p>
            <p><strong>À ne pas manquer :</strong> Coucher de soleil sur l'Allée des Baobabs</p>
            
            <h3>Jour 11 : Morondava et Allée des Baobabs</h3>
            <p><strong>Activités :</strong></p>
            <ul>
                <li>Allée des Baobabs au lever et coucher du soleil</li>
                <li>Baobab Amoureux</li>
                <li>Baobab Sacré</li>
                <li>Plage de Morondava</li>
            </ul>
            
            <h3>Jour 12 : Réserve de Kirindy</h3>
            <p><strong>Distance :</strong> 60km (1h30)</p>
            <p><strong>Faune observable :</strong></p>
            <ul>
                <li>Fossa (prédateur endémique)</li>
                <li>Lémuriens (dont le microcèbe)</li>
                <li>Oiseaux endémiques</li>
            </ul>
            
            <h3>Jour 13 : Retour à Antananarivo (vol)</h3>
            <p><strong>Vol :</strong> Morondava - Antananarivo (1h15)</p>
            <p><strong>Soirée libre :</strong> Dîner d'adieu</p>
            
            <h3>Jour 14 : Départ</h3>
            <p>Transfert à l'aéroport selon l'horaire de vol</p>
            
            <h2>Conseils Pratiques</h2>
            <h3>Transport</h3>
            <ul>
                <li>4x4 obligatoire pour les Tsingy</li>
                <li>Chauffeur-guide recommandé</li>
                <li>Vol intérieur Morondava-Tana recommandé</li>
            </ul>
            
            <h3>Hébergement</h3>
            <ul>
                <li><strong>Bekopaka :</strong> Options limitées, réserver à l'avance</li>
                <li><strong>Morondava :</strong> Large choix selon le budget</li>
            </ul>
            
            <h3>Équipement</h3>
            <ul>
                <li>Chaussures de randonnée fermées</li>
                <li>Gants fins pour les via ferrata</li>
                <li>Lampe frontale</li>
                <li>Anti-moustiques</li>
            </ul>
            
            <h2>Alternatives et Extensions</h2>
            <h3>Itinéraire Court (10 jours)</h3>
            <p>Vol direct Antananarivo-Morondava, focus sur Baobabs et Kirindy</p>
            
            <h3>Extension Baie de Baly</h3>
            <p>+3 jours pour voir la tortue radiée</p>
            
            <h2>Conclusion</h2>
            <p>Cet itinéraire combine paysages spectaculaires, rencontres authentiques et aventure. Les Tsingy de Bemaraha resteront un souvenir inoubliable de votre voyage à Madagascar.</p>
            
            <div class="tip">
                <strong>🗺️ Conseil d'Expert :</strong> Pour les Tsingy, arrivez tôt le matin pour éviter la foule et profiter des meilleures conditions de lumière pour la photographie.
            </div>
        `,
    category: 'Itinéraires',
    date: '12 mai 2023',
    readTime: '10 min',
    image: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    author: 'Sophie Martin',
    authorAvatar: '👩',
    authorBio: 'Guide de randonnée et organisatrice de voyages à Madagascar',
    views: 654,
    likes: 92,
    comments: 21,
    tags: ['Itinéraire', 'Tsingy', 'Randonnée', 'Aventure']
  },
  {
    id: 5,
    title: 'La faune unique de Madagascar : où observer les lémuriens',
    excerpt: 'Guide complet des meilleurs parcs et réserves pour observer les lémuriens dans leur habitat naturel. Inclut des conseils pour les photographes animaliers.',
    fullContent: `
            <h2>Introduction</h2>
            <p>Madagascar, souvent appelée le "huitième continent", abrite une faune unique avec un taux d'endémisme exceptionnel. Les lémuriens, emblèmes de l\'île, sont les stars incontestées.</p>
            
            <h2>Les Lémuriens de Madagascar</h2>
            <h3>Présentation Générale</h3>
            <p>Il existe plus de 100 espèces de lémuriens à Madagascar, toutes endémiques. Voici les plus emblématiques :</p>
            
            <h3>Espèces Principales</h3>
            <ul>
                <li><strong>Indri indri :</strong> Le plus grand lémurien, connu pour son chant matinal</li>
                <li><strong>Maki catta :</strong> Reconnaissable à sa queue annelée</li>
                <li><strong>Sifaka :</strong> Surnommé "le danseur" pour sa façon unique de se déplacer au sol</li>
                <li><strong>Aye-aye :</strong> Nocturne, avec un majeur particulièrement long</li>
                <li><strong>Microcèbe :</strong> Le plus petit primate du monde</li>
            </ul>
            
            <h2>Meilleurs Parcs pour l'Observation</h2>
            
            <h3>1. Parc National d'Andasibe-Mantadia</h3>
            <p><strong>Distance d'Antananarivo :</strong> 140km (3 heures)</p>
            <p><strong>Espèces visibles :</strong></p>
            <ul>
                <li>Indri indri (le plus accessible)</li>
                <li>Lémurien à bambou</li>
                <li>Lémurien lanose</li>
            </ul>
            <p><strong>Meilleur moment :</strong> Tôt le matin pour entendre le chant des indris</p>
            <p><strong>Conseil photo :</strong> Prévoir un téléobjecteur 200-400mm</p>
            
            <h3>2. Réserve d'Anja</h3>
            <p><strong>Localisation :</strong> Près d'Ambalavao sur la Route Nationale 7</p>
            <p><strong>Particularité :</strong> Petite réserve communautaire</p>
            <p><strong>Espèce star :</strong> Maki catta (très habitués aux visiteurs)</p>
            <p><strong>Avantage :</strong> Accès facile, observation garantie</p>
            
            <h3>3. Parc National de Ranomafana</h3>
            <p><strong>Localisation :</strong> Région de Fianarantsoa</p>
            <p><strong>Écosystème :</strong> Forêt tropicale humide</p>
            <p><strong>Espèces visibles :</strong></p>
            <ul>
                <li>Lémurien à ventre roux</li>
                <li>Lémurien bambou doré</li>
                <li>Lémurien de Milne-Edwards</li>
            </ul>
            <p><strong>Conseil :</strong> Randonnée nocturne possible</p>
            
            <h3>4. Parc National de l'Isalo</h3>
            <p><strong>Paysage :</strong> Canyon et piscines naturelles</p>
            <p><strong>Espèces visibles :</strong></p>
            <ul>
                <li>Lémurien catta</li>
                <li>Lémurien sifaka</li>
                <li>Lémurien à front roux</li>
            </ul>
            <p><strong>Combinaison :</strong> Observation + baignade dans les oasis</p>
            
            <h3>5. Parc National de Masoala</h3>
            <p><strong>Localisation :</strong> Nord-est, presqu'île de Masoala</p>
            <p><strong>Particularité :</strong> Forêt primaire accessible uniquement en bateau</p>
            <p><strong>Espèce rare :</strong> Lémurien vari roux</p>
            <p><strong>Pour :</strong> Les aventuriers et amateurs d'écotourisme</p>
            
            <h3>6. Parc National de Kirindy Mitea</h3>
            <p><strong>Localisation :</strong> Côte ouest près de Morondava</p>
            <p><strong>Spécialité :</strong> Observation nocturne</p>
            <p><strong>Espèces visibles :</strong></p>
            <ul>
                <li>Microcèbe (le plus petit primate)</li>
                <li>Lémurien souris</li>
                <li>Aye-aye (très rare)</li>
            </ul>
            
            <h2>Conseils pour l'Observation</h2>
            <h3>Quand Observer ?</h3>
            <ul>
                <li><strong>Matin :</strong> Meilleur moment (activité alimentaire)</li>
                <li><strong>Saison sèche :</strong> Avril-octobre (les animaux sont plus visibles)</li>
                <li><strong>Éviter :</strong> Pendant les fortes chaleurs (les lémuriens se reposent)</li>
            </ul>
            
            <h3>Comportement à Adopter</h3>
            <ul>
                <li><strong>Silence :</strong> Parlez à voix basse</li>
                <li><strong>Distance :</strong> Respectez une distance d'au moins 2-3 mètres</li>
                <li><strong>Nourriture :</strong> Ne nourrissez jamais les animaux</li>
                <li><strong>Flash :</strong> Évitez le flash photographique</li>
            </ul>
            
            <h3>Équipement Recommandé</h3>
            <ul>
                <li><strong>Vêtements :</strong> Couleurs neutres, pantalons longs</li>
                <li><strong>Chaussures :</strong> De randonnée fermées</li>
                <li><strong>Photographie :</strong> Téléobjecteur, trépied léger</li>
                <li><strong>Jumelles :</strong> Essentielles pour l'observation</li>
            </ul>
            
            <h2>Photographier les Lémuriens</h2>
            <h3>Paramètres Photo</h3>
            <ul>
                <li><strong>Vitesse :</strong> Minimum 1/250s pour figer le mouvement</li>
                <li><strong>ISO :</strong> Élevé en forêt (800-1600)</li>
                <li><strong>Ouverture :</strong> Grande (f/2.8-f/4) pour isoler le sujet</li>
            </ul>
            
            <h3>Conseils de Composition</h3>
            <ul>
                <li>Inclure l'habitat dans le cadre</li>
                <li>Capturer les interactions sociales</li>
                <li>Privilégier le regard des animaux</li>
            </ul>
            
            <h2>Conservation et Tourisme Responsable</h2>
            <h3>Choisir des Guides Locaux</h3>
            <p>Privilégiez les guides formés par les parcs nationaux. Leurs connaissances sont précieuses et votre argent soutient la conservation.</p>
            
            <h3>Respect des Règles</h3>
            <ul>
                <li>Rester sur les sentiers balisés</li>
                <li>Ne pas cueillir de plantes</li>
                <li>Emporter tous ses déchets</li>
            </ul>
            
            <h3>Soutenir la Conservation</h3>
            <p>Une partie du prix d'entrée des parcs finance la protection des habitats. Certaines réserves communautaires reversent les bénéfices aux villages locaux.</p>
            
            <h2>Autres Espèces à Observer</h2>
            <h3>Faune Endémique</h3>
            <ul>
                <li><strong>Caméléons :</strong> 2/3 des espèces mondiales</li>
                <li><strong>Grenouilles :</strong> 99% d'endémisme</li>
                <li><strong>Oiseaux :</strong> 50% d'espèces endémiques</li>
                <li><strong>Tenrecs :</strong> Mammifères insectivores uniques</li>
            </ul>
            
            <h2>Conclusion</h2>
            <p>Observer les lémuriens dans leur habitat naturel est une expérience magique et unique. En visitant les parcs nationaux de manière responsable, vous contribuez à la préservation de ces espèces extraordinaires pour les générations futures.</p>
            
            <div class="tip">
                <strong>📸 Conseil Photographique :</strong> Pour les photos d'indris, arrivez au parc d'Andasibe avant 7h30. Le chant matinal des indris est un moment spectaculaire à capturer, tant en photo qu'en vidéo.
            </div>
        `,
    category: 'Nature',
    date: '5 mai 2023',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    author: 'Paul Randria',
    authorAvatar: '👨',
    authorBio: 'Primatologue et photographe naturaliste',
    views: 892,
    likes: 156,
    comments: 28,
    tags: ['Lémuriens', 'Faune', 'Observation', 'Parcs nationaux']
  },
  {
    id: 6,
    title: 'Gastronomie malgache : les plats à ne pas manquer',
    excerpt: 'Découvrez les saveurs uniques de la cuisine malgache. Nous vous présentons les plats traditionnels, les meilleurs endroits pour les déguster et les spécialités régionales.',
    fullContent: `
            <h2>Introduction à la Cuisine Malgache</h2>
            <p>La cuisine malgache est un délicieux mélange d'influences africaines, asiatiques, arabes et européennes. Basée sur le riz, elle offre une variété de saveurs uniques à découvrir.</p>
            
            <h2>Les Incontournables</h2>
            
            <h3>1. Le Romazava</h3>
            <p><strong>Description :</strong> Le plat national, un ragoût de viande (généralement zébu) avec des brèdes (feuilles de légumes locaux).</p>
            <p><strong>Goût :</strong> Léger, parfumé, légèrement amer</p>
            <p><strong>Où le déguster :</strong> Dans les restaurants traditionnels "hotely"</p>
            
            <h3>2. Le Ravitoto</h3>
            <p><strong>Description :</strong> Feuilles de manioc pilées cuites avec de la viande de porc et du lait de coco.</p>
            <p><strong>Particularité :</strong> Texture crémeuse, goût unique</p>
            <p><strong>Conseil :</strong> À essayer avec du riz blanc</p>
            
            <h3>3. Le Mofo Gasy</h3>
            <p><strong>Description :</strong> Beignets traditionnels vendus le matin dans la rue.</p>
            <p><strong>Variétés :</strong></p>
            <ul>
                <li><strong>Mofo baolina :</strong> Beignets sucrés</li>
                <li><strong>Mofo sakay :</strong> Beignets épicés</li>
                <li><strong>Mofo menakely :</strong> Petits beignets à l'huile</li>
            </ul>
            
            <h3>4. Le Koba</h3>
            <p><strong>Description :</strong> Dessert traditionnel à base de cacahuètes, banane et farine de riz enveloppé dans une feuille de bananier.</p>
            <p><strong>Texture :</strong> Dense et moelleuse</p>
            <p><strong>Idéal pour :</strong> Le goûter ou un en-cas</p>
            
            <h2>Spécialités Régionales</h2>
            
            <h3>Côte Est</h3>
            <ul>
                <li><strong>Les brochettes de fruits de mer :</strong> À Toamasina et Mahajanga</li>
                <li><strong>Le soupe de crabe :</strong> Spécialité de Foulpointe</li>
                <li><strong>Le riz coco :</strong> Cuit au lait de coco</li>
            </ul>
            
            <h3>Hauts Plateaux</h3>
            <ul>
                <li><strong>Le varanga :</strong> Friture de porc croustillant</li>
                <li><strong>Le saosisy :</strong> Saucisse de porc épicée</li>
                <li><strong>Les achards :</strong> Légumes marinés</li>
            </ul>
            
            <h3>Côte Sud-Ouest</h3>
            <ul>
                <li><strong>Le zébu au coco :</strong> Viande mijotée longuement</li>
                <li><strong>Les oursins :</strong> Fraîchement pêchés</li>
                <li><strong>Le poisson grillé :</strong> Sur les plages</li>
            </ul>
            
            <h2>Riz et Accompaniments</h2>
            <h3>Le Riz (Vary)</h3>
            <p>À Madagascar, on ne dit pas "manger" mais "manger du riz" (mihinam-bary). Il est présent à tous les repas.</p>
            
            <h3>Les Lasary (Sauces et Condiments)</h3>
            <ul>
                <li><strong>Lasary voatabia :</strong> Salade de tomates à l'huile</li>
                <li><strong>Lasary anana :</strong> Légumes verts cuits</li>
                <li><strong>Sakay :</strong> Piment très fort (à doser avec précaution)</li>
            </ul>
            
            <h2>Boissons</h2>
            
            <h3>Boissons Non Alcoolsées</h3>
            <ul>
                <li><strong>Ranom-pangady :</strong> Eau de riz légèrement fermentée</li>
                <li><strong>Jus de canne à sucre :</strong> Fraîchement pressé</li>
                <li><strong>Jus de corossol :</strong> Fruit tropical</li>
                <li><strong>Eau de coco :</strong> Rafraîchissante</li>
            </ul>
            
            <h3>Boissons Alcoolsées</h3>
            <ul>
                <li><strong>Betsabetsa :</strong> Bière de canne à sucre traditionnelle</li>
                <li><strong>Litchel :</strong> Apéritif à base de litchi</li>
                <li><strong>Rhum arrangé :</strong> Avec fruits locaux (vanille, litchi, corossol)</li>
                <li><strong>THB :</strong> Bière locale (Three Horses Beer)</li>
            </ul>
            
            <h2>Où Manger ?</h2>
            
            <h3>Restaurants Traditionnels (Hotely)</h3>
            <p>Généralement économiques, ils servent des plats du jour. On choisit parmi plusieurs options présentées.</p>
            
            <h3>Marchés (Tsena)</h3>
            <p>Pour une expérience authentique :</p>
            <ul>
                <li><strong>Analakely :</strong> Marché couvert d'Antananarivo</li>
                <li><strong>Marché de la Digue :</strong> À Toamasina</li>
                <li><strong>Marché de Mahabo :</strong> À Morondava</li>
            </ul>
            
            <h3>Restaurants Touristiques</h3>
            <p>Plus chers mais souvent plus adaptés aux palais étrangers. Bonne hygiène généralement.</p>
            
            <h2>Conseils Pratiques</h2>
            
            <h3>Hygiène Alimentaire</h3>
            <ul>
                <li>Privilégiez les aliments cuits</li>
                <li>Évitez les glaçons en dehors des établissements touristiques</li>
                <li>Lavez les fruits que vous pelez vous-même</li>
            </ul>
            
            <h3>Étiquette à Table</h3>
            <ul>
                <li>On mange généralement avec les doigts (main droite uniquement)</li>
                <li>Dans les restaurants, couverts sont fournis</li>
                <li>Il est poli de goûter à tout ce qui est offert</li>
            </ul>
            
            <h2>Cours de Cuisine</h2>
            <p>Pour les passionnés, plusieurs options :</p>
            <ul>
                <li><strong>Antananarivo :</strong> Cooking classes avec des chefs locaux</li>
                <li><strong>Nosy Be :</strong> Cours de cuisine des produits de la mer</li>
                <li><strong>Chez l'habitant :</strong> La meilleure façon d'apprendre</li>
            </ul>
            
            <h2>Produits à Rapporter</h2>
            <ul>
                <li><strong>Vanille :</strong> La meilleure du monde</li>
                <li><strong>Poivre :</strong> Noir, blanc, vert et rouge</li>
                <li><strong>Épices :</strong> Cannelle, girofle, curcuma</li>
                <li><strong>Fruits séchés :</strong> Litchi, mangue, ananas</li>
                <li><strong>Miel :</strong> De différentes fleurs endémiques</li>
            </ul>
            
            <h2>Conclusion</h2>
            <p>La cuisine malgache est une découverte sensorielle à part entière. N'hésitez pas à sortir des sentiers battus et à accepter les invitations à manger chez l'habitant - ce sont souvent les meilleurs souvenirs culinaires !</p>
            
            <div class="tip">
                <strong>🍴 Conseil Gourmet :</strong> Quand vous commandez dans un "hotely", demandez "menu du jour" (souvent meilleur marché) ou regardez ce que les clients locaux mangent - c'est généralement le plat le plus frais et le plus typique.
            </div>
        `,
    category: 'Culture',
    date: '28 avril 2023',
    readTime: '5 min',
    image: 'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    author: 'Emma Ranaivo',
    authorAvatar: '👩',
    authorBio: 'Chef cuisinière et experte en gastronomie malgache',
    views: 723,
    likes: 98,
    comments: 19,
    tags: ['Cuisine', 'Gastronomie', 'Plats typiques', 'Saveurs']
  }
];

const categories = [
  { name: 'Tous', count: initialArticles.length },
  { name: 'Conseils voyage', count: initialArticles.filter(a => a.category === 'Conseils voyage').length },
  { name: 'Destinations', count: initialArticles.filter(a => a.category === 'Destinations').length },
  { name: 'Culture', count: initialArticles.filter(a => a.category === 'Culture').length },
  { name: 'Itinéraires', count: initialArticles.filter(a => a.category === 'Itinéraires').length },
  { name: 'Nature', count: initialArticles.filter(a => a.category === 'Nature').length }
];

const Blog = () => {
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRecommendationAI, setShowRecommendationAI] = useState(false);
  const [showChatbox, setShowChatbox] = useState(false);
  const [chatMessages, setChatMessages] = useState(defaultChatMessages);
  const [chatInput, setChatInput] = useState('');
  const [isChatbotTyping, setIsChatbotTyping] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const navigate = useNavigate();
  const chatboxRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const chatInputRef = useRef(null);
  const articleModalRef = useRef(null);

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

  // Scroll automatique des messages du chat
  useEffect(() => {
    if (chatMessagesRef.current && chatMessages.length > 0) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Fermer le modal article en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (articleModalRef.current && !articleModalRef.current.contains(event.target)) {
        handleCloseArticle();
      }
    };

    if (isArticleModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isArticleModalOpen]);

  // Carrousel automatique des images hero
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 5000); // Change d'image toutes les 5 secondes

    return () => clearInterval(interval);
  }, []);

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

    // Réponses spécifiques pour le blog
    setTimeout(() => {
      let response = "";
      const responses = [
        "Je comprends votre question sur Madagascar. Pour des conseils spécifiques, je vous recommande de consulter nos articles détaillés dans la catégorie 'Conseils voyage'.",
        "Excellent sujet ! Nous avons justement un article complet sur cette question. Regardez dans notre blog, vous trouverez toutes les informations nécessaires.",
        "Pour des conseils personnalisés sur votre voyage à Madagascar, je vous suggère d'utiliser notre assistant IA avancé. Il pourra créer un itinéraire sur mesure selon vos préférences.",
        "Madagascar offre de nombreuses options selon vos intérêts. Avez-vous une région spécifique en tête ? Nous avons des articles détaillés sur chaque région.",
        "Pour des questions de santé et sécurité, consultez notre article 'Conseils santé pour Madagascar' dans la catégorie Conseils voyage."
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
        case "Conseils pour préparer mon voyage":
          response = "Pour préparer votre voyage à Madagascar, pensez à : visa, vaccins, assurance voyage, saison idéale (avril-novembre), et prévoir des espèces. Consultez notre article 'Quand visiter Madagascar ?' pour plus de détails.";
          break;
        case "Meilleure période pour visiter":
          response = "La meilleure période générale est d'avril à novembre. Cependant, cela dépend des régions : côte est (juin-septembre), hauts plateaux (avril-octobre), sud (mars-décembre). Notre article détaillé vous guidera.";
          break;
        case "Budget recommandé":
          response = "Budget moyen pour 2 semaines : économique 800-1000€, confort 1200-1500€, luxe 2000€+. Cela inclut hébergement, repas, transports locaux et activités. Des articles spécifiques donnent des budgets détaillés par type de voyage.";
          break;
        case "Santé et sécurité":
          response = "Vaccins recommandés : fièvre jaune, hépatites A/B, typhoïde, rage. Prévoir antipaludéens. Sécurité : éviter de montrer ses valeurs, préférer les taxis officiels, ne pas circuler la nuit hors des villes. Plus de détails dans nos articles.";
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

  // Gestion des articles
  const popularArticles = [...initialArticles]
    .sort((a, b) => b.views - a.views)
    .slice(0, 3);

  const featuredArticle = initialArticles.find(article => article.featured);

  const filteredArticles = initialArticles.filter(article => {
    const matchesCategory = activeCategory === 'Tous' || article.category === activeCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Ouvrir un article dans un modal
  const handleOpenArticle = (article) => {
    setSelectedArticle(article);
    setIsArticleModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  // Fermer le modal article
  const handleCloseArticle = () => {
    setSelectedArticle(null);
    setIsArticleModalOpen(false);
    document.body.style.overflow = 'auto';
  };

  // Fonction pour retourner en haut de la page
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Générer les étoiles de notation (pour les commentaires)
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
    <div className={styles["blog-page"]}>
      {/* Header amélioré inspiré de Home.jsx */}
      <header className={`${styles["header"]} ${styles.animatedHeader}`}>
        <div className={styles["header-content"]}>
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
              <Link to="/activities" className={styles["nav-link"]}>
                <i className="fas fa-hiking"></i>
                Activités
              </Link>
              <Link to="/blog" className={`${styles["nav-link"]} ${styles.active}`}>
                <i className="fas fa-book-open"></i>
                Conseils
              </Link>
              <Link to="/about" className={styles["nav-link"]}>
                <i className="fas fa-info-circle"></i>
                À propos
              </Link>
            </div>

            <div className={styles["header-actions"]}>
              <button
                className={styles["ai-button"]}
                onClick={handleOpenAI}
                title="Assistant IA de voyage"
              >
                <i className="fas fa-robot"></i>
                <span className={styles["ai-tooltip"]}>Assistant IA</span>
              </button>

              <div className={styles["auth-section"]}>
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
                    <Link to="/login" className={clsx(styles["auth-button"], styles["secondary"])}>
                      <i className="fas fa-sign-in-alt"></i>
                      <span>Connexion</span>
                    </Link>
                    <Link to="/register" className={clsx(styles["auth-button"], styles["primary"])}>
                      <i className="fas fa-user-plus"></i>
                      <span>Inscription</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section avec carrousel comme Activities.jsx */}
      <section className={styles["blog-hero"]}>
        <div className={styles["hero-slides"]}>
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`${styles["hero-slide"]} ${index === currentHeroImage ? styles.active : ''}`}
              style={{
                backgroundImage: `url(${image})`
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
              Conseils & <span className={styles["text-highlight"]}>Inspirations</span>
            </span>
          </h1>

          <p className={styles["hero-subtitle"]}>
            Découvrez tous nos articles, guides et conseils pour préparer votre voyage à Madagascar
          </p>

          <div className={styles["hero-search-container"]}>
            <div className={`${styles["search-input-container"]} ${styles["anime-border"]}`}>
              <i className={`fas fa-search ${styles["search-icon"]}`}></i>
              <input
                type="text"
                placeholder="Rechercher un article, un conseil, une destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles["search-input"]}
              />
              <button className={styles["search-button"]}>
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
            <div className={styles["search-suggestions"]}>
              <span>Suggestions :</span>
              {['Lémuriens', 'Plages', 'Itinéraire', 'Budget'].map((tag) => (
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
          </div>

          {/* Indicateurs de pagination pour le carrousel */}
          <div className={styles["hero-pagination"]}>
            {heroImages.map((_, index) => (
              <button
                key={index}
                className={`${styles["pagination-dot"]} ${index === currentHeroImage ? styles.active : ''}`}
                onClick={() => setCurrentHeroImage(index)}
                aria-label={`Aller à l'image ${index + 1}`}
              />
            ))}
          </div>

          <div className={styles["hero-stats"]}>
            <div className={styles["stat-item"]}>
              <div className={styles["stat-icon"]}>
                <i className="fas fa-newspaper"></i>
              </div>
              <div className={styles["stat-content"]}>
                <span className={styles["stat-value"]}>{initialArticles.length}+</span>
                <span className={styles["stat-label"]}>Articles</span>
              </div>
            </div>
            <div className={styles["stat-item"]}>
              <div className={styles["stat-icon"]}>
                <i className="fas fa-eye"></i>
              </div>
              <div className={styles["stat-content"]}>
                <span className={styles["stat-value"]}>50k+</span>
                <span className={styles["stat-label"]}>Lectures</span>
              </div>
            </div>
            <div className={styles["stat-item"]}>
              <div className={styles["stat-icon"]}>
                <i className="fas fa-pen-fancy"></i>
              </div>
              <div className={styles["stat-content"]}>
                <span className={styles["stat-value"]}>12</span>
                <span className={styles["stat-label"]}>Experts</span>
              </div>
            </div>
            <div className={styles["stat-item"]}>
              <div className={styles["stat-icon"]}>
                <i className="fas fa-star"></i>
              </div>
              <div className={styles["stat-content"]}>
                <span className={styles["stat-value"]}>4.9/5</span>
                <span className={styles["stat-label"]}>Satisfaction</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating elements comme dans Activities */}
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

      {/* Main Content */}
      <div className={styles["blog-container"]}>
        <div className={styles["blog-content"]}>
          {/* Sidebar améliorée */}
          <aside className={styles["blog-sidebar"]}>
            <div className={styles["sidebar-section"]}>
              <h3>
                <i className="fas fa-filter"></i>
                <span>Catégories</span>
                <span className={styles["section-badge"]}>{filteredArticles.length}</span>
              </h3>
              <ul className={styles["categories-list"]}>
                {categories.map((category, index) => (
                  <li
                    key={index}
                    className={activeCategory === category.name ? styles.active : ''}
                    onClick={() => setActiveCategory(category.name)}
                  >
                    <span className={styles["category-name"]}>
                      <i className={`fas fa-${category.name === 'Tous' ? 'globe' :
                        category.name === 'Conseils voyage' ? 'suitcase' :
                          category.name === 'Destinations' ? 'map-marker-alt' :
                            category.name === 'Culture' ? 'theater-masks' :
                              category.name === 'Itinéraires' ? 'route' :
                                'leaf'}`}></i>
                      {category.name}
                    </span>
                    <span className={styles["category-count"]}>{category.count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles["sidebar-section"]}>
              <h3>
                <i className="fas fa-fire"></i>
                <span>Articles populaires</span>
              </h3>
              <div className={styles["popular-articles"]}>
                {popularArticles.map(article => (
                  <div
                    key={article.id}
                    className={styles["popular-article"]}
                    onClick={() => handleOpenArticle(article)}
                  >
                    <div
                      className={styles["popular-image"]}
                      style={{ backgroundImage: `url(${article.image})` }}
                    >
                      <div className={styles["image-overlay"]}></div>
                      <span className={styles["popular-badge"]}>
                        <i className="fas fa-chart-line"></i> {article.views}
                      </span>
                    </div>
                    <div className={styles["popular-content"]}>
                      <h4>{article.title}</h4>
                      <div className={styles["popular-meta"]}>
                        <span><i className="fas fa-clock"></i> {article.readTime}</span>
                        <span><i className="fas fa-heart"></i> {article.likes}</span>
                      </div>
                      <div className={styles["read-more-small"]}>
                        Lire <i className="fas fa-chevron-right"></i>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={clsx(styles["sidebar-section"], styles["tags-section"])}>
              <h3>
                <i className="fas fa-tags"></i>
                <span>Tags populaires</span>
              </h3>
              <div className={styles["tags-container"]}>
                {['Madagascar', 'Voyage', 'Aventure', 'Nature', 'Culture', 'Plage', 'Randonnée', 'Gastronomie', 'Budget', 'Saison'].map(tag => (
                  <span
                    key={tag}
                    className={styles["tag"]}
                    onClick={() => setSearchQuery(tag)}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className={clsx(styles["sidebar-section"], styles["newsletter-section"])}>
              <div className={styles["newsletter-icon"]}>
                <i className="fas fa-envelope-open-text"></i>
              </div>
              <h3>Newsletter MadaTour</h3>
              <p>Recevez nos meilleurs conseils et offres exclusives</p>
              <form className={styles["newsletter-form"]}>
                <input
                  type="email"
                  placeholder="Votre email"
                  className={styles["newsletter-input"]}
                  required
                />
                <button type="submit" className={styles["newsletter-button"]}>
                  <i className="fas fa-paper-plane"></i>
                  <span>S'abonner</span>
                </button>
              </form>
              <p className={styles["privacy-text"]}>
                <i className="fas fa-lock"></i>
                Nous respectons votre vie privée. Désabonnez-vous à tout moment.
              </p>
            </div>

            <div className={clsx(styles["sidebar-section"], styles["social-section"])}>
              <h3>
                <i className="fas fa-share-alt"></i>
                <span>Suivez-nous</span>
              </h3>
              <div className={styles["social-links"]}>
                {['facebook-f', 'instagram', 'twitter', 'youtube', 'pinterest'].map((platform) => (
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
          </aside>

          {/* Main Articles amélioré */}
          <main className={styles["articles-main"]}>
            {/* Featured Article */}
            {featuredArticle && activeCategory === 'Tous' && !searchQuery && (
              <div
                className={styles["featured-article"]}
                onClick={() => handleOpenArticle(featuredArticle)}
              >
                <div
                  className={styles["featured-image"]}
                  style={{ backgroundImage: `url(${featuredArticle.image})` }}
                >
                  <div className={styles["image-gradient"]}></div>
                  <span className={styles["featured-badge"]}>
                    <i className="fas fa-star"></i> À la une
                  </span>
                  <div className={styles["article-tags"]}>
                    {featuredArticle.tags?.slice(0, 2).map((tag, i) => (
                      <span key={i} className={styles["article-tag"]}>{tag}</span>
                    ))}
                  </div>
                </div>
                <div className={styles["featured-content"]}>
                  <div className={styles["article-meta"]}>
                    <span className={styles["category"]}>
                      <i className="fas fa-folder"></i>
                      {featuredArticle.category}
                    </span>
                    <span className={styles["date"]}>
                      <i className="fas fa-calendar"></i>
                      {featuredArticle.date}
                    </span>
                    <span className={styles["read-time"]}>
                      <i className="fas fa-clock"></i>
                      {featuredArticle.readTime}
                    </span>
                  </div>
                  <h2>{featuredArticle.title}</h2>
                  <p className={styles["excerpt"]}>{featuredArticle.excerpt}</p>
                  <div className={styles["article-footer"]}>
                    <div className={styles["author-info"]}>
                      <div className={styles["author-avatar"]}>
                        {featuredArticle.authorAvatar}
                      </div>
                      <div className={styles["author-details"]}>
                        <span className={styles["author-name"]}>{featuredArticle.author}</span>
                        <span className={styles["author-bio"]}>{featuredArticle.authorBio}</span>
                      </div>
                    </div>
                    <div className={styles["article-stats"]}>
                      <span className={styles["stat"]}>
                        <i className="fas fa-eye"></i> {featuredArticle.views}
                      </span>
                      <span className={styles["stat"]}>
                        <i className="fas fa-heart"></i> {featuredArticle.likes}
                      </span>
                      <span className={styles["stat"]}>
                        <i className="fas fa-comment"></i> {featuredArticle.comments}
                      </span>
                    </div>
                  </div>
                  <div className={styles["read-more-featured"]}>
                    <span>Lire l'article complet</span>
                    <i className="fas fa-arrow-right"></i>
                    <div className={styles["link-glow"]}></div>
                  </div>
                </div>
                <div className={styles["card-glow"]}></div>
              </div>
            )}

            {/* Articles Grid */}
            <div className={styles["articles-header"]}>
              <h3>
                {searchQuery ? (
                  <>Résultats pour "{searchQuery}"</>
                ) : activeCategory === 'Tous' ? (
                  <>Tous les articles</>
                ) : (
                  <>Articles : {activeCategory}</>
                )}
                <span className={styles["articles-count"]}>{filteredArticles.length} articles</span>
              </h3>
              <div className={styles["sort-options"]}>
                <select className={styles["sort-select"]}>
                  <option value="newest">Plus récents</option>
                  <option value="popular">Plus populaires</option>
                  <option value="views">Plus vus</option>
                </select>
              </div>
            </div>

            {filteredArticles.length > 0 ? (
              <div className={styles["articles-grid"]}>
                {filteredArticles
                  .filter(article => !article.featured || activeCategory !== 'Tous' || searchQuery)
                  .map(article => (
                    <article
                      key={article.id}
                      className={styles["article-card"]}
                      onClick={() => handleOpenArticle(article)}
                    >
                      <div
                        className={styles["article-image"]}
                        style={{ backgroundImage: `url(${article.image})` }}
                      >
                        <span className={styles["category-badge"]}>
                          <i className={`fas fa-${article.category === 'Conseils voyage' ? 'suitcase' :
                            article.category === 'Destinations' ? 'map-marker-alt' :
                              article.category === 'Culture' ? 'theater-masks' :
                                article.category === 'Itinéraires' ? 'route' :
                                  'leaf'}`}></i>
                          {article.category}
                        </span>
                        <div className={styles["image-overlay"]}></div>
                        <div className={styles["article-tags"]}>
                          {article.tags?.slice(0, 3).map((tag, i) => (
                            <span key={i} className={styles["article-tag-small"]}>{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className={styles["article-content"]}>
                        <div className={styles["article-meta"]}>
                          <span className={styles["date"]}>
                            <i className="fas fa-calendar-alt"></i>
                            {article.date}
                          </span>
                          <span>•</span>
                          <span className={styles["read-time"]}>
                            <i className="fas fa-clock"></i>
                            {article.readTime}
                          </span>
                        </div>
                        <h3>{article.title}</h3>
                        <p className={styles["excerpt"]}>{article.excerpt}</p>
                        <div className={styles["article-footer"]}>
                          <div className={styles["author-info"]}>
                            <div className={styles["author-avatar-small"]}>
                              {article.authorAvatar}
                            </div>
                            <span className={styles["author-name"]}>{article.author}</span>
                          </div>
                          <div className={styles["article-stats"]}>
                            <span className={styles["stat-small"]}>
                              <i className="fas fa-eye"></i> {article.views}
                            </span>
                            <span className={styles["stat-small"]}>
                              <i className="fas fa-heart"></i> {article.likes}
                            </span>
                          </div>
                        </div>
                        <div className={styles["read-more"]}>
                          <span>Lire la suite</span>
                          <i className="fas fa-chevron-right"></i>
                        </div>
                      </div>
                      <div className={styles["card-glow"]}></div>
                    </article>
                  ))}
              </div>
            ) : (
              <div className={styles["no-results"]}>
                <div className={styles["no-results-icon"]}>
                  <i className="fas fa-search"></i>
                </div>
                <h3>Aucun article trouvé</h3>
                <p>Essayez avec d'autres mots-clés ou explorez nos catégories</p>
                <button
                  className={styles["reset-button"]}
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('Tous');
                  }}
                >
                  <i className="fas fa-redo"></i>
                  Réinitialiser la recherche
                </button>
              </div>
            )}

            {/* Pagination améliorée */}
            {filteredArticles.length > 0 && (
              <div className={styles["pagination"]}>
                <button className={clsx(styles["pagination-btn"], styles["prev"])}>
                  <i className="fas fa-chevron-left"></i>
                  <span>Précédent</span>
                </button>
                <div className={styles["page-numbers"]}>
                  <span className={styles["active"]}>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span className={styles["dots"]}>...</span>
                  <span>8</span>
                </div>
                <button className={clsx(styles["pagination-btn"], styles["next"])}>
                  <span>Suivant</span>
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* CTA Section améliorée */}
      <section className={styles["blog-cta"]}>
        <div className={styles["cta-container"]}>
          <div className={styles["cta-content"]}>
            <div className={styles["cta-animation"]}>
              <div className={styles["cta-orbs"]}>
                <div className={styles["orb-1"]}></div>
                <div className={styles["orb-2"]}></div>
                <div className={styles["orb-3"]}></div>
              </div>
            </div>

            <h2>Besoin de conseils personnalisés ?</h2>
            <p>Notre équipe d'experts Madagascar est à votre disposition pour répondre à toutes vos questions</p>

            <div className={styles["cta-buttons"]}>
              <button
                className={clsx(styles["cta-btn"], styles["ai-btn"])}
                onClick={handleOpenAI}
              >
                <i className="fas fa-robot"></i>
                <span>Assistant IA</span>
                <div className={styles["button-particles"]}></div>
              </button>
              <Link to="/contact" className={clsx(styles["cta-btn"], styles["primary"])}>
                <i className="fas fa-envelope"></i>
                <span>Contact expert</span>
              </Link>
              <Link to="/itineraries" className={clsx(styles["cta-btn"], styles["secondary"])}>
                <i className="fas fa-map-marked-alt"></i>
                <span>Itinéraires clés en main</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

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
                Votre guide expert pour explorer Madagascar. Conseils, itinéraires et accompagnement personnalisé.
              </p>

              <div className={styles["social-links-home"]}>
                {['facebook-f', 'instagram', 'twitter', 'youtube', 'linkedin'].map((platform) => (
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
                  <i className="fas fa-book-open"></i>
                  Blog & Conseils
                </h3>
                <ul>
                  {['Conseils voyage', 'Destinations', 'Culture', 'Itinéraires', 'Nature', 'Gastronomie'].map((item) => (
                    <li key={item}>
                      <Link to={`/blog?category=${item.toLowerCase().replace(' ', '-')}`}>
                        <i className="fas fa-chevron-right"></i>
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles["links-column"]}>
                <h3>
                  <i className="fas fa-compass"></i>
                  Navigation
                </h3>
                <ul>
                  {['Destinations', 'Activités', 'Blog', 'À propos', 'Contact', 'FAQ'].map((item) => (
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
                  <i className="fas fa-headset"></i>
                  Support
                </h3>
                <ul>
                  {['Contactez-nous', 'Centre d\'aide', 'Conditions d\'utilisation', 'Politique de confidentialité', 'Mentions légales'].map((item) => (
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
                <i className="fas fa-newspaper"></i>
                Restez informé
              </h4>
              <form className={styles["newsletter-form"]}>
                <input
                  type="email"
                  placeholder="Votre email pour nos conseils"
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
                Écrit avec <i className="fas fa-heart"></i> pour Madagascar
              </span>
            </p>

            <div className={styles["footer-apps"]}>
              <span>Notre application :</span>
              <div className={styles["app-buttons"]}>
                <a href="/" className={styles["app-button"]}>
                  <i className="fab fa-apple"></i>
                  <div>
                    <span>Disponible sur</span>
                    <strong>App Store</strong>
                  </div>
                </a>
                <a href="/" className={styles["app-button"]}>
                  <i className="fab fa-google-play"></i>
                  <div>
                    <span>Télécharger sur</span>
                    <strong>Google Play</strong>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className={styles["footer-wave"]}></div>
        <div className={styles["footer-stars"]}>
          {[...Array(15)].map((_, i) => (
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

      {/* Modal pour afficher l'article complet */}
      {isArticleModalOpen && selectedArticle && (
        <div className={styles["article-modal-overlay"]}>
          <div className={styles["article-modal"]} ref={articleModalRef}>
            <div className={styles["modal-header"]}>
              <button
                className={styles["close-modal"]}
                onClick={handleCloseArticle}
                aria-label="Fermer l'article"
              >
                <i className="fas fa-times"></i>
              </button>
              <div className={styles["modal-category"]}>
                <i className={`fas fa-${selectedArticle.category === 'Conseils voyage' ? 'suitcase' :
                  selectedArticle.category === 'Destinations' ? 'map-marker-alt' :
                    selectedArticle.category === 'Culture' ? 'theater-masks' :
                      selectedArticle.category === 'Itinéraires' ? 'route' :
                        'leaf'}`}></i>
                {selectedArticle.category}
              </div>
              <div className={styles["modal-share"]}>
                <button className={styles["share-btn"]}>
                  <i className="fas fa-share-alt"></i>
                  Partager
                </button>
                <button className={styles["save-btn"]}>
                  <i className="fas fa-bookmark"></i>
                  Sauvegarder
                </button>
              </div>
            </div>

            <div className={styles["modal-hero"]}>
              <div
                className={styles["modal-hero-image"]}
                style={{ backgroundImage: `url(${selectedArticle.image})` }}
              ></div>
              <div className={styles["hero-overlay-modal"]}></div>
              <div className={styles["modal-hero-content"]}>
                <h1>{selectedArticle.title}</h1>
                <div className={styles["modal-meta"]}>
                  <div className={styles["author-info-modal"]}>
                    <div className={styles["author-avatar-modal"]}>
                      {selectedArticle.authorAvatar}
                    </div>
                    <div>
                      <div className={styles["author-name-modal"]}>{selectedArticle.author}</div>
                      <div className={styles["author-bio-modal"]}>{selectedArticle.authorBio}</div>
                    </div>
                  </div>
                  <div className={styles["article-stats-modal"]}>
                    <span><i className="fas fa-calendar"></i> {selectedArticle.date}</span>
                    <span><i className="fas fa-clock"></i> {selectedArticle.readTime}</span>
                    <span><i className="fas fa-eye"></i> {selectedArticle.views}</span>
                    <span><i className="fas fa-heart"></i> {selectedArticle.likes}</span>
                    <span><i className="fas fa-comment"></i> {selectedArticle.comments}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles["modal-content"]}>
              <div
                className={styles["article-full-content"]}
                dangerouslySetInnerHTML={{ __html: selectedArticle.fullContent }}
              ></div>

              <div className={styles["article-tags-modal"]}>
                {selectedArticle.tags?.map((tag, index) => (
                  <span key={index} className={styles["tag-modal"]}>#{tag}</span>
                ))}
              </div>

              <div className={styles["article-actions"]}>
                <div className={styles["like-section"]}>
                  <button className={styles["like-btn"]}>
                    <i className="fas fa-heart"></i>
                    J'aime ({selectedArticle.likes})
                  </button>
                  <button className={styles["comment-btn"]}>
                    <i className="fas fa-comment"></i>
                    Commenter
                  </button>
                </div>
                <div className={styles["share-section"]}>
                  <span>Partager :</span>
                  <div className={styles["share-buttons"]}>
                    <button className={styles["share-facebook"]}>
                      <i className="fab fa-facebook-f"></i>
                    </button>
                    <button className={styles["share-twitter"]}>
                      <i className="fab fa-twitter"></i>
                    </button>
                    <button className={styles["share-linkedin"]}>
                      <i className="fab fa-linkedin-in"></i>
                    </button>
                    <button className={styles["share-whatsapp"]}>
                      <i className="fab fa-whatsapp"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles["author-card"]}>
                <div className={styles["author-avatar-large"]}>
                  {selectedArticle.authorAvatar}
                </div>
                <div className={styles["author-info-large"]}>
                  <h4>{selectedArticle.author}</h4>
                  <p className={styles["author-bio-large"]}>{selectedArticle.authorBio}</p>
                  <div className={styles["author-stats"]}>
                    <span><i className="fas fa-newspaper"></i> 24 articles</span>
                    <span><i className="fas fa-eye"></i> 45k lectures</span>
                    <span><i className="fas fa-star"></i> Expert vérifié</span>
                  </div>
                </div>
              </div>

              <div className={styles["related-articles"]}>
                <h3>
                  <i className="fas fa-layer-group"></i>
                  Articles similaires
                </h3>
                <div className={styles["related-grid"]}>
                  {initialArticles
                    .filter(a => a.id !== selectedArticle.id && a.category === selectedArticle.category)
                    .slice(0, 3)
                    .map(article => (
                      <div
                        key={article.id}
                        className={styles["related-article"]}
                        onClick={() => {
                          setSelectedArticle(article);
                          window.scrollTo(0, 0);
                        }}
                      >
                        <div
                          className={styles["related-image"]}
                          style={{ backgroundImage: `url(${article.image})` }}
                        ></div>
                        <div className={styles["related-content"]}>
                          <h4>{article.title}</h4>
                          <div className={styles["related-meta"]}>
                            <span>{article.readTime}</span>
                            <span>•</span>
                            <span>{article.views} vues</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <i className="fas fa-robot"></i>
                  <div className={styles["avatar-status"]}></div>
                </div>
                <div className={styles["chatbox-info"]}>
                  <h3>Assistant Conseils MadaTour</h3>
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
                  placeholder="Posez votre question sur Madagascar..."
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

export default Blog;