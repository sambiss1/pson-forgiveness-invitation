/* Encodeur QR code minimal (mode octet, correction M, versions 1 à 15).
   Sans dépendance. Usage : QR.svg("texte", { dark:"#000", light:"#fff" }) */
(function (global) {
  "use strict";
  var ECC_PER_BLOCK = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24];
  var NUM_BLOCKS = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10];

  function rawModules(ver) {
    var r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      var n = Math.floor(ver / 7) + 2;
      r -= (25 * n - 10) * n - 55;
      if (ver >= 7) r -= 36;
    }
    return r;
  }
  function dataCodewords(ver) {
    return Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ver] * NUM_BLOCKS[ver];
  }
  function gfMul(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    return z & 0xff;
  }
  function rsDivisor(deg) {
    var res = [];
    for (var i = 0; i < deg - 1; i++) res.push(0);
    res.push(1);
    var root = 1;
    for (i = 0; i < deg; i++) {
      for (var j = 0; j < res.length; j++) {
        res[j] = gfMul(res[j], root);
        if (j + 1 < res.length) res[j] ^= res[j + 1];
      }
      root = gfMul(root, 0x02);
    }
    return res;
  }
  function rsRemainder(data, div) {
    var res = div.map(function () { return 0; });
    data.forEach(function (b) {
      var f = b ^ res.shift();
      res.push(0);
      div.forEach(function (c, i) { res[i] ^= gfMul(c, f); });
    });
    return res;
  }
  function utf8(str) {
    return Array.from(new TextEncoder().encode(str));
  }
  function alignPositions(ver) {
    if (ver === 1) return [];
    var n = Math.floor(ver / 7) + 2;
    var size = ver * 4 + 17;
    var step = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
    var res = [6];
    for (var pos = size - 7; res.length < n; pos -= step) res.splice(1, 0, pos);
    return res;
  }

  function encode(text) {
    var bytes = utf8(text);
    var ver;
    for (ver = 1; ver <= 15; ver++) {
      var ccBits = ver < 10 ? 8 : 16;
      if (4 + ccBits + bytes.length * 8 <= dataCodewords(ver) * 8) break;
    }
    if (ver > 15) throw new Error("Texte trop long pour le QR code");
    var size = ver * 4 + 17;
    var cap = dataCodewords(ver) * 8;

    // Flux de bits
    var bits = [];
    function put(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    put(0x4, 4);
    put(bytes.length, ver < 10 ? 8 : 16);
    bytes.forEach(function (b) { put(b, 8); });
    put(0, Math.min(4, cap - bits.length));
    put(0, (8 - (bits.length % 8)) % 8);
    for (var pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) put(pad, 8);
    var data = [];
    for (var i = 0; i < bits.length; i += 8) {
      var v = 0;
      for (var k = 0; k < 8; k++) v = (v << 1) | bits[i + k];
      data.push(v);
    }

    // Correction d'erreurs et entrelacement
    var nb = NUM_BLOCKS[ver], eccLen = ECC_PER_BLOCK[ver];
    var raw = Math.floor(rawModules(ver) / 8);
    var nShort = nb - (raw % nb), shortLen = Math.floor(raw / nb);
    var div = rsDivisor(eccLen), blocks = [], pos = 0;
    for (i = 0; i < nb; i++) {
      var len = shortLen - eccLen + (i < nShort ? 0 : 1);
      var dat = data.slice(pos, pos + len);
      pos += len;
      var ecc = rsRemainder(dat, div);
      if (i < nShort) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    var all = [];
    for (i = 0; i < blocks[0].length; i++) {
      for (var j = 0; j < blocks.length; j++) {
        if (i !== shortLen - eccLen || j >= nShort) all.push(blocks[j][i]);
      }
    }

    // Matrice
    var m = [], fn = [];
    for (i = 0; i < size; i++) { m.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    function setF(x, y, d) { m[y][x] = d; fn[y][x] = true; }
    for (i = 0; i < size; i++) { setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(function (c) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var x = c[0] + dx, y = c[1] + dy;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        var dist = Math.max(Math.abs(dx), Math.abs(dy));
        setF(x, y, dist !== 2 && dist !== 4);
      }
    });
    var ap = alignPositions(ver), na = ap.length;
    for (i = 0; i < na; i++) for (j = 0; j < na; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) continue;
      for (var ddy = -2; ddy <= 2; ddy++) for (var ddx = -2; ddx <= 2; ddx++)
        setF(ap[i] + ddx, ap[j] + ddy, Math.max(Math.abs(ddx), Math.abs(ddy)) !== 1);
    }
    function drawFormat(mask) {
      var d = (0 << 3) | mask, rem = d; // niveau M = 00
      for (var t = 0; t < 10; t++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var b = ((d << 10) | rem) ^ 0x5412;
      function g(n) { return ((b >>> n) & 1) !== 0; }
      for (var q = 0; q <= 5; q++) setF(8, q, g(q));
      setF(8, 7, g(6)); setF(8, 8, g(7)); setF(7, 8, g(8));
      for (q = 9; q < 15; q++) setF(14 - q, 8, g(q));
      for (q = 0; q < 8; q++) setF(size - 1 - q, 8, g(q));
      for (q = 8; q < 15; q++) setF(8, size - 15 + q, g(q));
      setF(8, size - 8, true);
    }
    drawFormat(0);
    if (ver >= 7) {
      var r = ver;
      for (i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
      var vb = (ver << 12) | r;
      for (i = 0; i < 18; i++) {
        var bit = ((vb >>> i) & 1) !== 0, a = size - 11 + (i % 3), bb = Math.floor(i / 3);
        setF(a, bb, bit); setF(bb, a, bit);
      }
    }
    // Placement des données
    var idx = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (j = 0; j < 2; j++) {
        var x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
        if (!fn[y][x] && idx < all.length * 8) {
          m[y][x] = ((all[idx >>> 3] >>> (7 - (idx & 7))) & 1) !== 0;
          idx++;
        }
      }
    }
    var masks = [
      function (x, y) { return (x + y) % 2 === 0; },
      function (x, y) { return y % 2 === 0; },
      function (x) { return x % 3 === 0; },
      function (x, y) { return (x + y) % 3 === 0; },
      function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; },
      function (x, y) { return (x * y) % 2 + (x * y) % 3 === 0; },
      function (x, y) { return ((x * y) % 2 + (x * y) % 3) % 2 === 0; },
      function (x, y) { return ((x + y) % 2 + (x * y) % 3) % 2 === 0; }
    ];
    function applyMask(n) {
      for (var y = 0; y < size; y++) for (var x = 0; x < size; x++)
        if (!fn[y][x] && masks[n](x, y)) m[y][x] = !m[y][x];
    }
    function penalty() {
      var p = 0, dark = 0, x, y, run, prev;
      for (y = 0; y < size; y++) {
        run = 0; prev = null;
        for (x = 0; x < size; x++) {
          if (m[y][x] === prev) { run++; if (run === 5) p += 3; else if (run > 5) p++; }
          else { prev = m[y][x]; run = 1; }
          if (m[y][x]) dark++;
        }
      }
      for (x = 0; x < size; x++) {
        run = 0; prev = null;
        for (y = 0; y < size; y++) {
          if (m[y][x] === prev) { run++; if (run === 5) p += 3; else if (run > 5) p++; }
          else { prev = m[y][x]; run = 1; }
        }
      }
      for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) {
        var c = m[y][x];
        if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3;
      }
      var total = size * size;
      p += Math.max(0, Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
      return p;
    }
    var best = 0, bestP = Infinity;
    for (i = 0; i < 8; i++) {
      applyMask(i); drawFormat(i);
      var pen = penalty();
      if (pen < bestP) { bestP = pen; best = i; }
      applyMask(i);
    }
    applyMask(best); drawFormat(best);
    return m;
  }

  function svg(text, opts) {
    opts = opts || {};
    var m = encode(text), n = m.length, q = opts.margin == null ? 2 : opts.margin, s = n + q * 2;
    var path = "";
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++)
      if (m[y][x]) path += "M" + (x + q) + " " + (y + q) + "h1v1h-1z";
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s + " " + s +
      '" shape-rendering="crispEdges" role="img" aria-label="QR code du ticket">' +
      '<rect width="' + s + '" height="' + s + '" fill="' + (opts.light || "#fff") + '"/>' +
      '<path d="' + path + '" fill="' + (opts.dark || "#000") + '"/></svg>';
  }

  global.QR = { encode: encode, svg: svg };
})(typeof window !== "undefined" ? window : globalThis);
