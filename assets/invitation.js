(function () {
  "use strict";
  var C = window.INVITATION;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var TZ = "Africa/Kinshasa";

  /* ---------- Invité ---------- */
  var lu = window.Lien.lire() || window.INVITE_DEMO || null;
  var invite = {
    nom: lu && lu.nom ? lu.nom.trim() : "",
    places: (lu && lu.places) || C.placesParDefaut || 2,
    categorie: (lu && lu.categorie) || C.categorieParDefaut || "Invité",
    numero: (lu && lu.numero) || 0
  };
  var CLE = "pson-rsvp-" + (invite.numero || "x") + "-" + invite.nom.toLowerCase();

  function lireStock(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function ecrireStock(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  // Lien générique sans nom : numéro tiré une fois et gardé sur ce téléphone
  if (!invite.numero) {
    var n = lireStock("pson-numero");
    if (!n) { n = 90000 + Math.floor(Math.random() * 9999); ecrireStock("pson-numero", n); }
    invite.numero = n;
  }

  /* ---------- Dates ---------- */
  var debut = new Date(C.dateDebut);
  var limite = new Date(C.reponseAvant);
  function fmt(d, o) { return d.toLocaleString("fr-FR", Object.assign({ timeZone: TZ }, o)); }
  var jourNom = fmt(debut, { weekday: "long" });
  var jj = fmt(debut, { day: "2-digit" }), mm = fmt(debut, { month: "2-digit" }), aaaa = fmt(debut, { year: "numeric" });
  var heure = fmt(debut, { hour: "2-digit", minute: "2-digit" });
  var dateCourte = jj + "." + mm + "." + aaaa.slice(2);
  var limiteTxt = fmt(limite, { day: "numeric", month: "long" });
  function pad(n, l) { n = String(n); while (n.length < l) n = "0" + n; return n; }
  function prenom(nom) { return window.Lien.court(nom); }

  /* ---------- Contenu ---------- */
  $$("[data-artiste]").forEach(function (e) { e.textContent = C.artiste; });
  $$("[data-album]").forEach(function (e) { e.textContent = C.album; });
  $$("[data-type]").forEach(function (e) { e.textContent = C.typeEvenement; });
  $$("[data-lieu-nom]").forEach(function (e) { e.textContent = C.lieu.nom; });
  $$("[data-lieu-niveau]").forEach(function (e) { e.textContent = C.lieu.niveau; });
  $$("[data-repere]").forEach(function (e) { e.textContent = C.lieu.repere; });
  $("#meta-date").textContent = jourNom.slice(0, 3) + " " + dateCourte;
  $("#meta-heure").textContent = heure.replace(":", "h").replace(/h00$/, "h");
  $("#accroche").textContent = C.accroche;
  $("#texte").textContent = C.texte;
  $("#lieu-adresse").textContent = C.lieu.adresse + " · " + C.lieu.niveau;
  $("#itineraire").href = C.lieu.itineraire;
  $("#dress-texte").textContent = C.dressCode.texte;
  $("#titre-dress").innerHTML = C.dressCode.titre.split(/\s+/).map(esc).join("<br>");
  $("#fin-ligne").textContent = [C.typeEvenement, dateCourte, heure.replace(":00", "H"), C.lieu.nom, "Kinshasa"].join(" · ");
  $("#signature").textContent = C.signature || "";
  $("#d-jour").textContent = jourNom;
  $("#d-num").textContent = String(+jj);

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  $("#programme").innerHTML = C.programme.map(function (p, i) {
    return '<li><span class="n">' + pad(i + 1, 2) + '</span><span class="t">' + esc(p.titre) + '</span><span class="h">' + esc(p.heure) + "</span></li>";
  }).join("");

  var tong = '<svg viewBox="0 0 80 150" aria-hidden="true"><path d="M40 8C60 8 66 32 64 58c-2 26 4 52-4 72-6 16-34 16-40 0-8-20-2-46-4-72C14 32 20 8 40 8Z" fill="#f4c21f"/><path d="M40 34 20 74M40 34l20 40" stroke="#12110f" stroke-width="7" stroke-linecap="round" fill="none"/></svg>';
  $("#looks").innerHTML = C.dressCode.looks.map(function (l) {
    var visuel = l.photo
      ? '<img src="' + esc(l.photo) + '" alt="' + esc(l.titre + " : " + l.detail) + '" loading="lazy">'
      : '<div class="look-vide">' + tong + "<b>" + esc(l.titre) + "</b></div>";
    return '<figure class="look">' + visuel + "<figcaption>" + esc(l.titre + " · " + l.detail) + "</figcaption></figure>";
  }).join("");

  if (C.photoHero) {
    var sc = $("#scene-hero");
    sc.classList.add("avec-photo");
    sc.style.backgroundImage = "url('" + C.photoHero + "')";
  }
  if (C.lieu.photo) {
    var sl = $("#scene-lieu");
    sl.classList.add("avec-photo");
    sl.style.backgroundImage = "url('" + C.lieu.photo + "')";
  }
  if (C.plancheContact && C.plancheContact.length) {
    $("#bloc-planche").hidden = false;
    $("#planche").innerHTML = C.plancheContact.map(function (src, i) {
      return '<figure><img src="' + esc(src) + '" alt="Photo de ' + esc(C.artiste) + " " + (i + 1) + '" loading="lazy"><figcaption><span>PSN_' + pad(i + 1, 3) + "</span><span>" + pad(i + 4, 2) + "A</span></figcaption></figure>";
    }).join("");
  }

  /* ---------- Intro ---------- */
  $("#ecran").textContent = invite.nom ? "Bienvenue " + invite.nom : "Bienvenue";
  $("#sortie-nom").textContent = invite.nom || "Sur invitation";

  // Écran de la borne : si le nom ne tient pas, il défile (ou passe à la ligne si les animations sont réduites)
  function ajusterEcran() {
    var ecran = $(".ecran"), span = $("#ecran");
    ecran.classList.remove("defile", "replie");
    var dispo = ecran.clientWidth - 24, besoin = span.scrollWidth;
    if (besoin <= dispo) return;
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) { ecran.classList.add("replie"); return; }
    var w = ecran.clientWidth;
    ecran.style.setProperty("--depart", w + "px");
    ecran.style.setProperty("--fin", -besoin + "px");
    ecran.style.setProperty("--duree", ((w + besoin) / 55).toFixed(1) + "s");
    ecran.classList.add("defile");
  }
  ajusterEcran();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajusterEcran);
  window.addEventListener("resize", ajusterEcran);
  $("#prendre").addEventListener("click", function () {
    var intro = $("#intro");
    intro.classList.add("parti");
    document.body.classList.remove("verrou");
    setTimeout(function () { intro.hidden = true; }, 1000);
    window.scrollTo(0, 0);
  });

  /* ---------- Ticket ---------- */
  $("#t-no").textContent = pad(invite.numero, 5);
  $("#t-date").textContent = jj + "." + mm + "." + aaaa;
  $("#t-heure").textContent = heure;
  $("#note-delai").textContent = "Réponds avant le " + limiteTxt + ". Places limitées, entrée sur présentation du QR code.";

  // Code-barres décoratif, stable pour un même numéro
  (function () {
    var seed = invite.numero * 9301 + 49297, html = "";
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var i = 0; i < 58; i++) {
      var w = 1 + Math.floor(rnd() * 3.2), gap = 1 + Math.floor(rnd() * 2.5);
      html += '<i style="width:' + w + "px;margin-right:" + gap + 'px"></i>';
    }
    $("#barres").innerHTML = html;
  })();

  var nb = $("#nb");
  for (var i = 1; i <= invite.places; i++) {
    var o = document.createElement("option");
    o.value = i; o.textContent = i + (i > 1 ? " personnes" : " personne");
    nb.appendChild(o);
  }
  nb.value = String(invite.places);
  if (invite.places <= 1) nb.closest("div").hidden = true;

  var nomLibre = $("#nom-libre");
  if (!invite.nom) {
    $("#champ-nom").hidden = false;
    $("#t-nom").hidden = true;
    var deja = lireStock("pson-nom-libre");
    if (deja) nomLibre.value = deja;
  } else {
    $("#t-nom").textContent = invite.nom;
  }

  function nomFinal() { return invite.nom || nomLibre.value.trim(); }
  function place() { return (invite.categorie || "Invité").toUpperCase() + " " + pad(invite.numero, 2); }

  function afficher(rep, anime) {
    var clos = Date.now() > limite.getTime();
    $("#rsvp").hidden = true; $("#etat-oui").hidden = true; $("#etat-non").hidden = true; $("#etat-clos").hidden = true;
    var tampon = $("#tampon");
    tampon.hidden = true; tampon.classList.remove("frappe", "absent");
    $("#qr").hidden = true; $("#barres").hidden = false;
    $("#t-place").textContent = "—"; $("#t-pers").textContent = "";

    if (!invite.nom) {
      var nm = (rep && rep.nom) || "";
      $("#t-nom").textContent = nm; $("#t-nom").hidden = !rep; $("#champ-nom").hidden = !!rep;
    }

    if (rep && rep.etat === "oui") {
      var n = rep.nb;
      $("#t-place").textContent = place();
      $("#t-pers").textContent = n + (n > 1 ? " personnes" : " personne");
      var contenu = [C.artiste + "-" + C.album, "N°" + pad(invite.numero, 5), rep.nom, n + " pers.", place()].join(" | ");
      try { $("#qr").innerHTML = window.QR.svg(contenu, { dark: "#1b1914", light: "#ffffff", margin: 1 }); $("#qr").hidden = false; $("#barres").hidden = true; } catch (e) {}
      $("#msg-oui").innerHTML = "C'est validé pour <b>" + n + (n > 1 ? " personnes" : " personne") + "</b>. Présente ce QR code à l'entrée du parking.";
      tampon.textContent = "Validé"; tampon.hidden = false;
      if (anime) { void tampon.offsetWidth; tampon.classList.add("frappe"); }
      $("#etat-oui").hidden = false;
      var tel = (C.whatsappOrganisateur || "").replace(/\D/g, "");
      if (tel) {
        var txt = "Bonjour, je confirme ma présence à la " + C.typeEvenement.toLowerCase() + " " + C.album + " : " + rep.nom + ", " + n + (n > 1 ? " personnes" : " personne") + " (ticket N°" + pad(invite.numero, 5) + ").";
        $("#prevenir").href = "https://wa.me/" + tel + "?text=" + encodeURIComponent(txt);
        $("#prevenir").hidden = false;
      }
    } else if (rep && rep.etat === "non") {
      tampon.textContent = "Absent"; tampon.classList.add("absent"); tampon.hidden = false;
      if (anime) { void tampon.offsetWidth; tampon.classList.add("frappe"); }
      $("#msg-non").textContent = clos
        ? "Dommage, on t'aurait bien vu au parking."
        : "Dommage. Si tes plans changent avant le " + limiteTxt + ", reviens sur ce lien pour réserver.";
      $("#etat-non").hidden = false;
    } else if (clos) {
      $("#etat-clos").hidden = false;
    } else {
      $("#rsvp").hidden = false;
    }
    $$("[data-modifier]").forEach(function (b) { b.hidden = clos; });
  }

  function envoyer(rep) {
    if (!C.rsvpWebhook) return;
    try {
      fetch(C.rsvpWebhook, {
        method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ numero: pad(invite.numero, 5), nom: rep.nom, reponse: rep.etat, personnes: rep.nb || 0, categorie: invite.categorie, mot: rep.mot || "", date: new Date().toISOString() })
      }).catch(function () {});
    } catch (e) {}
  }

  function repondre(etat) {
    var nom = nomFinal(), err = $("#erreur");
    if (!nom) { err.textContent = "Écris ton nom pour que ton ticket soit à ton nom."; err.hidden = false; nomLibre.focus(); return; }
    err.hidden = true;
    if (!invite.nom) ecrireStock("pson-nom-libre", nom);
    var rep = { etat: etat, nom: nom, nb: etat === "oui" ? +nb.value : 0, mot: $("#mot").value.trim(), ts: Date.now() };
    ecrireStock(CLE, rep);
    envoyer(rep);
    afficher(rep, true);
    $("#ticket").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  $("#rsvp").addEventListener("submit", function (e) { e.preventDefault(); repondre("oui"); });
  $("#decliner").addEventListener("click", function () { repondre("non"); });
  $$("[data-modifier]").forEach(function (b) {
    b.addEventListener("click", function () {
      var ancien = lireStock(CLE);
      if (ancien && ancien.nb) nb.value = String(ancien.nb);
      if (ancien && ancien.mot) $("#mot").value = ancien.mot;
      ecrireStock(CLE, null);
      afficher(null, false);
    });
  });

  // Enregistrer le ticket en image
  $("#enregistrer").addEventListener("click", function () {
    var msg = $("#msg-enreg"), btn = this;
    function echec() { msg.textContent = "Fais une capture d'écran de ton ticket : elle marche aussi bien à l'entrée."; msg.hidden = false; btn.disabled = false; }
    if (!window.htmlToImage) return echec();
    btn.disabled = true; msg.hidden = true;
    window.htmlToImage.toPng($("#ticket"), {
      pixelRatio: 3, backgroundColor: "#12110f", skipFonts: false,
      filter: function (n) { return !(n.classList && n.classList.contains("no-export")); }
    }).then(function (url) {
      var a = document.createElement("a");
      a.href = url; a.download = "ticket-" + C.album.toLowerCase() + "-" + pad(invite.numero, 5) + ".png";
      document.body.appendChild(a); a.click(); a.remove();
      msg.textContent = "Ticket enregistré dans tes téléchargements."; msg.hidden = false; btn.disabled = false;
    }).catch(echec);
  });

  afficher(lireStock(CLE), false);

  /* ---------- Titres ajustés à la largeur ---------- */
  function ajuster() {
    $$(".album, .dress h2").forEach(function (el) {
      el.style.fontSize = "";
      var taille = parseFloat(getComputedStyle(el).fontSize), essais = 0;
      while (el.scrollWidth > el.clientWidth + 1 && taille > 18 && essais++ < 60) {
        taille -= 2; el.style.fontSize = taille + "px";
      }
    });
  }
  ajuster();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajuster);
  window.addEventListener("resize", ajuster);

  /* ---------- Compte à rebours ---------- */
  function tic() {
    var ms = debut.getTime() - Date.now(), lab = $("#d-label"), val = $("#d-valeur");
    if (ms > 0) {
      var m = Math.floor(ms / 60000), j = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mn = m % 60;
      lab.textContent = "Ouverture des portes dans";
      val.innerHTML = (j ? j + "<em>j</em>" : "") + pad(h, 2) + "<em>h</em>" + pad(mn, 2) + "<em>min</em>";
    } else if (ms > -8 * 3600000) {
      lab.textContent = C.lieu.nom; val.textContent = "Les portes sont ouvertes";
    } else {
      lab.textContent = C.album; val.textContent = "Merci d'être venu";
    }
  }
  tic(); setInterval(tic, 20000);
})();
