/* Encodage / décodage des liens d'invitation personnalisés.
   Un lien ressemble à : https://site/?i=eyJuIjoiUGF1bCBLYWJpbGEiLC... */
(function (global) {
  "use strict";
  function toB64Url(str) {
    var bytes = new TextEncoder().encode(str), bin = "";
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function fromB64Url(s) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    var bin = atob(s), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  // invite = { nom, places, categorie, numero }
  function encoder(invite) {
    var o = { n: invite.nom, p: invite.places, c: invite.categorie, no: invite.numero };
    return toB64Url(JSON.stringify(o));
  }
  function decoder(token) {
    try {
      var o = JSON.parse(fromB64Url(token));
      return { nom: o.n || "", places: +o.p || 0, categorie: o.c || "", numero: +o.no || 0 };
    } catch (e) { return null; }
  }
  function lire(search) {
    var p = new URLSearchParams(search || location.search);
    if (p.get("i")) return decoder(p.get("i"));
    if (p.get("n")) return { nom: p.get("n"), places: +p.get("p") || 0, categorie: p.get("c") || "", numero: +p.get("no") || 0 };
    return null;
  }
  // Nom court pour l'écran de la borne et le message : "MC Donel Prince de la Ville" → "MC Donel"
  function court(nom) {
    nom = (nom || "").trim();
    if (nom.length <= 14) return nom;
    var m = nom.split(/\s+/), deux = m.slice(0, 2).join(" ");
    return deux.length <= 14 ? deux : m[0];
  }
  global.Lien = { encoder: encoder, decoder: decoder, lire: lire, court: court };
})(window);
