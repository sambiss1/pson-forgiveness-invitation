/* =========================================================
   CONFIGURATION DE L'ÉVÉNEMENT
   Tout le contenu de l'invitation se modifie ici.
   ========================================================= */
window.INVITATION = {
  artiste: "PSON",
  album: "FORGIVENESS",
  typeEvenement: "Release party",

  // Date et heure de début (heure de Kinshasa = +01:00)
  dateDebut: "2026-12-12T20:00:00+01:00",
  // Date limite pour répondre
  reponseAvant: "2026-12-05T23:59:59+01:00",

  accroche: "PSON vous invite à la release party de son album FORGIVENESS.",
  texte: "Une nuit au parking de City Market : l'album en écoute en avant-première, le showcase en live, et tout le monde en flip-flop.",

  lieu: {
    nom: "Parking City Market",
    niveau: "Niveau -1",
    repere: "P-1",
    adresse: "City Market, Gombe, Kinshasa",
    itineraire: "https://www.google.com/maps/search/?api=1&query=City+Market+Gombe+Kinshasa",
    photo: "assets/photos/parking-p1.webp"   // vide = décor parking dessiné
  },

  programme: [
    { heure: "20:00", titre: "Ouverture des portes" },
    { heure: "21:00", titre: "Écoute de l'album FORGIVENESS" },
    { heure: "22:00", titre: "Showcase PSON" },
    { heure: "23:30", titre: "After & DJ set" }
  ],

  dressCode: {
    titre: "Flip Flop",
    sousTitre: "Culotte ou jogging, babouches aux pieds",
    texte: "Le dress code est simple : babouches aux pieds. Le reste, c'est ton style.",
    looks: [
      { titre: "Look 1", detail: "Culotte + flip flop", photo: "assets/photos/look-1.webp" },
      { titre: "Look 2", detail: "Jogging + flip flop", photo: "assets/photos/look-2.webp" }
    ]
  },

  // Photos (mettre les fichiers dans assets/photos/)
  photoHero: "assets/photos/hero.webp",   // vide = décor parking dessiné en CSS
  plancheContact: [                      // vide = section masquée
    "assets/photos/pson-01.webp", "assets/photos/pson-02.webp", "assets/photos/pson-03.webp",
    "assets/photos/pson-04.webp", "assets/photos/pson-05.webp", "assets/photos/pson-06.webp",
    "assets/photos/pson-07.webp", "assets/photos/pson-08.webp", "assets/photos/pson-09.webp",
    "assets/photos/pson-10.webp"
  ],

  // Valeurs par défaut quand le lien ne les précise pas
  placesParDefaut: 2,
  categorieParDefaut: "VIP",

  // Catégories proposées dans le générateur (affichées sur le ticket : « VIP 07 », « PRESSE 12 »…)
  categories: ["VIP", "Artiste", "Influenceur", "Presse", "Partenaire", "Sponsor", "Invité", "Famille", "Staff"],

  // Liste chargée par défaut dans le générateur (Nom ; places ; catégorie ; téléphone)
  listeInvites: [
    "C2B", "Bogo The Goat", "Ekwa Phone+", "Melissa", "Bantou B", "Yuma Dash", "Zozo Yuma",
    "Zakalaha", "Gaz Mawete", "Gally", "DJ Wendy", "Ninikah", "Mani Loko",
    "MC Donel Prince de la Ville", "NST El Diablo", "Isabelle", "Miss Malaïka", "The King Mandy",
    "Noely Be", "Sista Becky", "Jean Michel K", "Okito", "Slow Kamunga", "People.cd243",
    "Strong2Kinmoov", "Eden Mbenga", "Lëatïtia Kandolo", "Moko Buzz", "Balabala 243",
    "Mwana Congo243", "Kitoko RDC", "Panthère Noir", "Parlons Plus"
  ],

  // Optionnel : numéro WhatsApp de l'organisateur (format international sans +, ex. "243810000000")
  // Si rempli, l'invité peut prévenir l'organisateur après avoir réservé.
  whatsappOrganisateur: "",

  // Optionnel : URL d'un Google Apps Script pour recevoir les réponses dans un Google Sheet (voir README)
  rsvpWebhook: "",

  signature: "Invitation digitale · Konsep"
};
