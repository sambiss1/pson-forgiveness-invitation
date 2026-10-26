/* Encodage, décodage et signature des liens d'invitation.
   Un lien ressemble à : https://site/?i=eyJuIjoi...&s=Xk3...
   - i : les infos de l'invité (nom, places, catégorie, numéro)
   - s : la signature, calculée avec le code secret de l'organisateur.
     Sans ce code, impossible de fabriquer un ticket valide. */
(function (global) {
  "use strict";
  function bytesToB64Url(bytes) {
    var bin = "";
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function toB64Url(str) { return bytesToB64Url(new TextEncoder().encode(str)); }
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
    var p = new URLSearchParams(search || location.search), r = null;
    if (p.get("i")) r = decoder(p.get("i"));
    else if (p.get("n")) r = { nom: p.get("n"), places: +p.get("p") || 0, categorie: p.get("c") || "", numero: +p.get("no") || 0 };
    if (r) { r.token = p.get("i") || ""; r.sig = p.get("s") || ""; }
    return r;
  }
  // Signature HMAC-SHA256 tronquée (16 caractères). Nécessite https ou localhost.
  function signer(secret, token) {
    if (!secret || !global.crypto || !crypto.subtle) return Promise.resolve("");
    var enc = new TextEncoder();
    return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
      .then(function (k) { return crypto.subtle.sign("HMAC", k, enc.encode(token)); })
      .then(function (buf) { return bytesToB64Url(new Uint8Array(buf)).slice(0, 16); });
  }
  function verifier(secret, token, sig) {
    if (!sig) return Promise.resolve(false);
    return signer(secret, token).then(function (attendu) { return attendu !== "" && attendu === sig; });
  }
  // Nom court pour l'écran de la borne et le message : "MC Donel Prince de la Ville" → "MC Donel"
  function court(nom) {
    nom = (nom || "").trim();
    if (nom.length <= 14) return nom;
    var m = nom.split(/\s+/), deux = m.slice(0, 2).join(" ");
    return deux.length <= 14 ? deux : m[0];
  }
  global.Lien = { encoder: encoder, decoder: decoder, lire: lire, court: court, signer: signer, verifier: verifier };
})(window);
