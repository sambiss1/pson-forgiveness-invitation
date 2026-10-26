# Invitation digitale — PSON · FORGIVENESS

Site statique (HTML/CSS/JS, aucune dépendance à installer) pour la release party du 12.12.26.

- `index.html` : l'invitation que reçoit chaque invité
- `generer.html` : le générateur de liens pour l'organisateur (ne pas partager ce lien)
- `controle/` : la page de contrôle pour les agents à l'entrée
- `config.js` : **tout le contenu se modifie ici** (date, lieu, programme, dress code, photos, options)

## Comment ça marche

1. L'organisateur ouvre `generer.html`, colle sa liste (un invité par ligne : `Nom ; places ; catégorie ; téléphone`), puis clique sur **Générer les invitations**.
2. Chaque invité a un lien unique (`/?i=…`) qui contient son nom, son nombre de places, sa catégorie et son numéro de ticket. Le bouton **WhatsApp** ouvre un message déjà rédigé, adressé au bon numéro quand on l'a renseigné.
3. L'invité ouvre son lien et voit la borne du parking (« Bienvenue Christelle »). Il prend son ticket, découvre l'invitation et réserve (nombre de personnes, petit mot pour PSON). Il obtient alors un ticket **VALIDÉ** avec un QR code, qu'il peut enregistrer en image.
4. À l'entrée, l'agent scanne le QR code avec l'**appareil photo normal** de son téléphone, ce qui ouvre la page `/controle/`. Elle affiche en grand **VALIDE** (vert, avec le bouton « Valider l'entrée »), **DÉJÀ ENTRÉ** (orange, avec l'heure du premier passage) ou **NON VALIDE** (rouge).

## Sécurité des tickets : le code de contrôle

- Dans le générateur, l'organisateur choisit un **code de contrôle** (un mot ou une phrase secrète). Chaque lien est signé avec ce code (HMAC-SHA256). Sans le code, impossible de fabriquer un ticket valide, ni de changer le nom ou le nombre de places d'un ticket existant.
- Le code n'est **jamais** écrit dans le site ni sur GitHub. Il reste dans le navigateur de l'organisateur.
- Chaque agent ouvre `https://le-site/controle/` une fois, entre le code, et son téléphone est activé.
- **Changer le code invalide tous les liens déjà envoyés.** Il faut alors régénérer et renvoyer les invitations.
- Le « déjà entré » est mémorisé **sur le téléphone de l'agent**. Avec plusieurs agents, le mieux est qu'un même agent garde une même file. Avec le Google Sheet branché (voir plus bas), chaque entrée y est aussi enregistrée.
- La page de contrôle doit être ouverte en **https**, ce qui est le cas sur Vercel ou Netlify.

Un lien sans paramètre (`https://site/`) fonctionne aussi : l'invité écrit lui-même son nom.

## Lancer en local

Le site ne demande ni `npm install` ni build. Il faut seulement un petit serveur, car les liens `?i=…` ne marchent pas en ouvrant le fichier par double-clic.

```bash
cd pson-invitation
npx serve .            # ou : python3 -m http.server 8000
```

Ensuite, ouvrir `http://localhost:3000/generer.html` (ou `:8000` avec Python) et cliquer sur **Aperçu** à côté d'un invité.

## Mise en ligne (gratuit)

- **Vercel** : `npx vercel` dans le dossier, ou glisser le dossier sur vercel.com/new
- **Netlify** : glisser le dossier sur app.netlify.com/drop
- Ou n'importe quel hébergement de fichiers statiques

Une fois en ligne, vérifier dans `generer.html` que le champ « Adresse du site d'invitation » pointe bien vers l'URL finale (il se remplit tout seul).

## Aperçu WhatsApp

Quand on partage un lien, WhatsApp affiche `assets/partage.jpg` (1200×630). WhatsApp n'accepte que les adresses complètes : après la mise en ligne, remplacer dans `index.html` la ligne

```html
<meta property="og:image" content="assets/partage.jpg">
```

par l'adresse complète, par exemple `https://pson-forgiveness.vercel.app/assets/partage.jpg`.

## Ajouter les photos

Mettre les fichiers dans `assets/photos/`, puis dans `config.js` :

```js
photoHero: "assets/photos/hero.webp",                       // remplace le décor parking dessiné
plancheContact: ["assets/photos/pson-01.webp", "assets/photos/pson-02.webp"],  // affiche la planche contact
dressCode: { looks: [{ titre: "Look 1", detail: "Culotte + flip flop", photo: "assets/photos/look-1.jpg" }, ...] }
```

Compresser les images avant de les ajouter, en WebP qualité ~70 : 900 px de large pour la photo d'ouverture, 480 px pour la planche contact. Les invités ouvrent le lien en 4G, et les photos actuelles font 311 Ko au total.

## Options

**Prévenir l'organisateur sur WhatsApp** : remplir `whatsappOrganisateur: "243XXXXXXXXX"`. Après sa réservation, l'invité voit alors un bouton qui envoie la confirmation à ce numéro.

**Recevoir les réponses dans un Google Sheet** :
1. Créer un Google Sheet, puis aller dans Extensions > Apps Script et coller :
   ```js
   function doPost(e) {
     var d = JSON.parse(e.postData.contents);
     SpreadsheetApp.getActiveSheet().appendRow([new Date(), d.numero, d.nom, d.reponse, d.personnes, d.categorie, d.mot]);
     return ContentService.createTextOutput("ok");
   }
   ```
2. Cliquer sur Déployer > Nouveau déploiement > Application Web, avec « Exécuter en tant que : moi » et « Accès : tout le monde ».
3. Coller l'URL obtenue dans `rsvpWebhook` de `config.js`.

## Limites à connaître

- Les réponses sont gardées sur le téléphone de l'invité. Sans le Google Sheet, l'organisateur ne voit pas qui a confirmé.
- Les liens ne sont pas signés : quelqu'un de technique pourrait fabriquer un faux lien. Le contrôle à l'entrée se fait donc avec la liste CSV de l'organisateur, qui fait foi.
- Pour aller plus loin (scan qui marque l'entrée, anti double entrée, tableau des réponses en temps réel), il faut un petit backend.
