/* Procedural SVG art for lots, houses and neighbourhood buildings. Every drawing uses a 160x120 viewBox. */
(function (root) {
  const W = 160;
  const GROUND = 104; // y of the front edge of the house footprint


  const r = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
  const poly = (pts, fill, extra = '') => `<polygon points="${pts}" fill="${fill}" ${extra}/>`;

  function windowAt(x, y, w, h, trim, shutters) {
    let s = r(x - 1.5, y - 1.5, w + 3, h + 3, trim) + r(x, y, w, h, '#7fa4bf') + r(x, y, w, h / 2.4, '#a9c6da');
    s += `<line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="${trim}" stroke-width="1"/>`;
    if (shutters) s += r(x - 5, y - 1, 3, h + 2, shutters) + r(x + w + 2, y - 1, 3, h + 2, shutters);
    return s;
  }

  function door(x, y, h, trim, color = '#7a3b2e') {
    return r(x - 1.5, y - 1.5, 12, h + 1.5, trim) + r(x, y, 9, h, color) + `<circle cx="${x + 7}" cy="${y + h / 2}" r="0.9" fill="#e8c35a"/>`;
  }

  function gable(x, y, w, rise, fill, over = 5) {
    return poly(`${x - over},${y} ${x + w / 2},${y - rise} ${x + w + over},${y}`, fill);
  }

  function chimney(x, y, h, fill = '#8c4a3a') {
    return r(x, y - h, 7, h, fill) + r(x - 1, y - h - 2, 9, 3, '#6d3a2e');
  }

  // ---- 1930s English houses ----

  const P = {
    tile: '#9b4631', tileDark: '#74301f', brick: '#a4553c', mortar: '#c3806a', timber: '#33261e',
    frame: '#f6f2e8', glass: '#86a9bd', glassHi: '#b7cfdb', door: '#2f5d46', sun: '#ecbf4c', sunRay: '#c9652f',
    stone: '#d9cfb8', green: '#4a7a58', stack: '#8d4330', pot: '#b45a3c', hedge: '#355f2e', hedgeHi: '#4b7a3e',
  };

  // Render colour, and the pastel it takes after the "Fresh paint" upgrade.
  const STYLE = {
    rambler:   { w: 100, wall: '#eadfc4', paint: '#d6e6d2' },
    cottage:   { w: 120, wall: '#e4d8bd', paint: '#f1d6c9' },
    colonial:  { w: 98,  wall: '#f1eadb', paint: '#f4e5b5' },
    victorian: { w: 104, wall: '#f4f1e8', paint: '#dcece6' },
    craftsman: { w: 110, wall: '#e8dcc3', paint: '#e4e6cc' },
    mansion:   { w: 136, wall: '#f2ecdd', paint: '#f6e6c6' },
  };

  function hipRoof(x, y, w, rise, inset, over, fill = P.tile) {
    return poly(`${x - over},${y} ${x + inset},${y - rise} ${x + w - inset},${y - rise} ${x + w + over},${y}`, fill) +
      `<line x1="${x - over}" y1="${y}" x2="${x + w + over}" y2="${y}" stroke="${P.tileDark}" stroke-width="1.5"/>`;
  }

  // Chimney stack with two pots; y is where it meets the roof.
  function stack(x, y, h, w = 8) {
    return r(x, y - h, w, h + 6, P.stack) + r(x - 1, y - h, w + 2, 2.5, P.tileDark) +
      r(x + 1, y - h - 4, 2.5, 4, P.pot) + r(x + w - 3.5, y - h - 4, 2.5, 4, P.pot);
  }

  function brickWall(x, y, w, h) {
    let s = r(x, y, w, h, P.brick) + `<g stroke="${P.mortar}" stroke-width=".5" opacity=".55">`;
    for (let yy = y + 3.5; yy < y + h - 0.5; yy += 3.5) s += `<line x1="${x}" y1="${yy}" x2="${x + w}" y2="${yy}"/>`;
    return s + '</g>';
  }

  // Metal-framed window with small top lights, as fitted to most houses of the decade.
  function crittall(x, y, w, h, cols = 2, frame = P.frame) {
    const t = y + h * 0.32;
    let s = r(x - 1.2, y - 1.2, w + 2.4, h + 2.4, frame) + r(x, y, w, h, P.glass) + r(x, y, w, h * 0.32, P.glassHi);
    s += `<g stroke="${frame}" stroke-width=".9"><line x1="${x}" y1="${t}" x2="${x + w}" y2="${t}"/>`;
    for (let i = 1; i < cols; i++) s += `<line x1="${x + (w * i) / cols}" y1="${y}" x2="${x + (w * i) / cols}" y2="${y + h}"/>`;
    for (let i = 0; i < cols; i++) s += `<line x1="${x + (w * (i + 0.5)) / cols}" y1="${y}" x2="${x + (w * (i + 0.5)) / cols}" y2="${t}" stroke-width=".5"/>`;
    return s + '</g>';
  }

  // Window with horizontal glazing bars, for Art Deco houses.
  function ribbon(x, y, w, h, bars, rx = 0) {
    let s = r(x - 1.2, y - 1.2, w + 2.4, h + 2.4, P.frame, `rx="${rx + 1}"`) + r(x, y, w, h, P.glass, `rx="${rx}"`);
    s += `<g stroke="${P.frame}" stroke-width=".8">`;
    for (let i = 1; i < bars; i++) s += `<line x1="${x}" y1="${y + (h * i) / bars}" x2="${x + w}" y2="${y + (h * i) / bars}"/>`;
    return s + '</g>';
  }

  // Canted bay seen from the front: a wide centre light between two angled side lights.
  function bay(x, y, w, h, wall, rows = 1) {
    let s = r(x, y, w, h, wall) + r(x, y, w * 0.18, h, 'rgba(0,0,0,.10)') + r(x + w * 0.82, y, w * 0.18, h, 'rgba(0,0,0,.10)');
    const rowH = h / rows;
    for (let i = 0; i < rows; i++) {
      const wy = y + i * rowH + rowH * 0.22, wh = rowH * 0.56;
      s += crittall(x + w * 0.25, wy, w * 0.5, wh, 3) + crittall(x + 1.8, wy, w * 0.18 - 3.2, wh, 1) + crittall(x + w * 0.82 + 1.4, wy, w * 0.18 - 3.2, wh, 1);
    }
    return s;
  }

  // Front door with the sunrise motif of the period in its upper panel.
  function sunDoor(x, y, h, color = P.door) {
    const w = 10, cx = x + w / 2, cy = y + h * 0.4, rad = w / 2 - 1.6;
    let s = r(x - 1.5, y - 1.5, w + 3, h + 1.5, P.frame) + r(x, y, w, h, color);
    s += `<path d="M${cx - rad} ${cy} A${rad} ${rad} 0 0 1 ${cx + rad} ${cy} Z" fill="${P.sun}"/><g stroke="${P.sunRay}" stroke-width=".6">`;
    for (const a of [30, 60, 90, 120, 150]) {
      const t = (a * Math.PI) / 180;
      s += `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(t) * rad).toFixed(2)}" y2="${(cy - Math.sin(t) * rad).toFixed(2)}"/>`;
    }
    return s + '</g>' + r(x + 2, cy + 3, w - 4, h * 0.34, 'rgba(0,0,0,.12)') + `<circle cx="${x + w - 2}" cy="${y + h * 0.64}" r=".9" fill="#e8c35a"/>`;
  }

  // Arched opening (porch recess or stone doorway) behind a door.
  function arch(x, w, top, fill) {
    return `<path d="M${x} ${GROUND} V${top + w / 2} A${w / 2} ${w / 2.6} 0 0 1 ${x + w} ${top + w / 2} V${GROUND} Z" fill="${fill}"/>`;
  }

  // Gable with black-and-white half-timbering and dark barge boards.
  function timberGable(x, y, w, rise, fill) {
    const mid = x + w / 2;
    let s = poly(`${x},${y} ${mid},${y - rise} ${x + w},${y}`, fill) + `<g stroke="${P.timber}" stroke-width="1.6">`;
    for (let i = 1; i < 6; i++) {
      const xx = x + (w * i) / 6;
      s += `<line x1="${xx}" y1="${y}" x2="${xx}" y2="${(y - rise * (1 - Math.abs(xx - mid) / (w / 2))).toFixed(1)}"/>`;
    }
    s += `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke-width="2.2"/></g>`;
    return s + `<polyline points="${x - 3},${y + 2} ${mid},${y - rise - 2} ${x + w + 3},${y + 2}" fill="none" stroke="${P.timber}" stroke-width="2.4"/>`;
  }

  function timberBand(x, y, w, h, fill) {
    const n = Math.max(2, Math.round(w / 7));
    let s = r(x, y, w, h, fill) + `<g stroke="${P.timber}" stroke-width="1.5">`;
    for (let i = 0; i <= n; i++) s += `<line x1="${(x + (w * i) / n).toFixed(1)}" y1="${y}" x2="${(x + (w * i) / n).toFixed(1)}" y2="${y + h}"/>`;
    return s + `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke-width="2"/><line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y + h}" stroke-width="2"/></g>`;
  }

  // Clay tile-hanging: rows of scalloped tiles on an upper storey or gable.
  function tileHung(x, y, w, h) {
    let s = r(x, y, w, h, '#b65a3b') + `<g fill="none" stroke="${P.tileDark}" stroke-width=".6">`;
    for (let yy = y + 3, row = 0; yy < y + h; yy += 3, row++) {
      let d = `M${x + (row % 2) * 1.5} ${yy}`;
      for (let xx = x + (row % 2) * 1.5; xx < x + w - 2.5; xx += 3) d += ` q1.5 1.8 3 0`;
      s += `<path d="${d}"/>`;
    }
    return s + '</g>';
  }

  // Each house returns its markup and the centre x of its front door(s), for paths and porches.
  const BODY = {
    rambler(wall) {
      const x = 30, w = 100, h = 30, y = GROUND - h;
      let s = stack(x + 66, y - 14, 10) + hipRoof(x, y, w, 24, 30, 5) + r(x, y, w, h, wall) + brickWall(x, GROUND - 6, w, 6);
      for (const bx of [x + 4, x + w - 34]) s += hipRoof(bx, y + 1, 30, 5, 5, 2) + bay(bx, y + 1, 30, h - 7, wall) + brickWall(bx, GROUND - 6, 30, 6);
      const dx = x + w / 2 - 5;
      s += arch(dx - 5, 20, y + 4, 'rgba(0,0,0,.2)') + sunDoor(dx, y + 11, h - 11);
      return { svg: s, doors: [dx + 5] };
    },
    cottage(wall) {
      const x = 20, w = 120, h = 56, y = GROUND - h, mid = x + w / 2;
      let s = stack(mid - 6, y - 18, 10, 12) + hipRoof(x, y, w, 26, 36, 5) + r(x, y, w, h, wall) + brickWall(x, y + 28, w, h - 28);
      s += r(mid - 0.5, y, 1, h, 'rgba(0,0,0,.18)');
      const doors = [];
      for (const side of [-1, 1]) {
        const bx = side < 0 ? x + 5 : x + w - 33;
        s += hipRoof(bx, y + 3, 28, 6, 5, 2) + bay(bx, y + 3, 28, h - 3, wall, 2) + brickWall(bx, y + 30, 28, 4);
        const dx = side < 0 ? mid - 20 : mid + 10;
        s += crittall(dx - 1, y + 9, 12, 11, 2) + r(dx - 4, y + 31, 18, 2.5, P.tileDark) + sunDoor(dx, y + 35, h - 35, side < 0 ? P.door : '#2c4a6b');
        doors.push(dx + 5);
      }
      return { svg: s, doors };
    },
    colonial(wall) {
      const x = 34, w = 96, h = 54, y = GROUND - h, gx = x - 4, gw = 46;
      let s = stack(x + w - 18, y - 12, 18) + hipRoof(x, y, w, 24, 26, 4) + r(x, y, w, h, wall) + brickWall(x, y + 27, w, h - 27);
      const dx = x + 64;
      s += crittall(x + 58, y + 8, 20, 13, 2) + crittall(x + 81, y + 34, 10, 13, 1);
      s += arch(dx - 4, 18, y + 29, P.stone) + sunDoor(dx, y + 37, h - 37);
      s += timberGable(gx, y, gw, 24, wall) + timberBand(gx, y, gw, 27, wall) + brickWall(gx, y + 27, gw, h - 27);
      s += bay(gx + 7, y + 4, gw - 14, h - 4, wall, 2);
      return { svg: s, doors: [dx + 5] };
    },
    victorian(wall) {
      const x = 28, w = 104, h = 52, y = GROUND - h, tx = x + 48, tw = 16;
      let s = r(x, y, w, h, wall) + r(x - 1, y - 3, w + 2, 3, P.green) + r(x, y, 6, h, 'rgba(0,0,0,.07)');
      for (const wy of [y + 8, y + 31]) s += ribbon(x, wy, 38, 13, 4, 5);
      s += r(tx, y - 12, tw, h + 12, wall) + r(tx - 1, y - 15, tw + 2, 3, P.green) + ribbon(tx + 4, y - 7, tw - 8, 44, 11);
      const dx = x + 72;
      s += ribbon(x + 70, y + 8, 28, 13, 4);
      s += r(dx - 5, y + 30, 20, 3, P.green, 'rx="1.5"') + sunDoor(dx, y + 34, h - 34, '#7a2f35');
      s += `<circle cx="${dx + 21}" cy="${y + 41}" r="4.6" fill="${P.frame}"/><circle cx="${dx + 21}" cy="${y + 41}" r="3.5" fill="${P.glass}"/>`;
      return { svg: s, doors: [dx + 5] };
    },
    craftsman(wall) {
      const x = 25, w = 110, h = 48, y = GROUND - h, gx = x + 56, gw = 54;
      // The catslide roof sweeps down to the ground floor, so the left wall only shows below it.
      let s = stack(x + 40, y - 20, 30, 9) + r(x, y + 24, gx - x, h - 24, wall) + r(gx, y, x + w - gx, h, wall);
      s += poly(`${x - 7},${y + 24} ${x + 44},${y - 22} ${gx + 4},${y - 22} ${gx + 4},${y + 24}`, P.tile);
      s += poly(`${x + 16},${y + 10} ${x + 23},${y + 2} ${x + 30},${y + 10}`, P.tileDark) + crittall(x + 19, y + 5, 8, 5, 2);
      const dx = x + 26;
      s += arch(dx - 3, 16, y + 28, 'rgba(0,0,0,.2)') + sunDoor(dx, y + 32, h - 32, '#4a3524') + crittall(x + 3, y + 30, 12, 10, 2);
      s += tileHung(gx, y - 2, gw, 24) + poly(`${gx - 4},${y} ${gx + gw / 2},${y - 28} ${gx + gw + 4},${y}`, P.tile);
      s += poly(`${gx + 6},${y - 1} ${gx + gw / 2},${y - 20} ${gx + gw - 6},${y - 1}`, '#b65a3b') + tileHung(gx + 14, y - 12, gw - 28, 11);
      s += r(gx, y + 22, gw, h - 22, wall) + crittall(gx + 7, y + 30, gw - 14, 11, 5) + crittall(gx + 12, y + 6, gw - 24, 10, 4);
      return { svg: s, doors: [dx + 5] };
    },
    mansion(wall) {
      const x = 12, w = 136, h = 58, y = GROUND - h, cw = 36, cx = x + cw, cwid = w - 2 * cw;
      let s = stack(x + 52, y - 14, 20, 6) + stack(x + 59, y - 14, 20, 6) + stack(x + 77, y - 14, 20, 6) + stack(x + 84, y - 14, 20, 6);
      s += hipRoof(cx - 4, y, cwid + 8, 20, 16, 2) + timberBand(cx, y, cwid, 28, wall) + brickWall(cx, y + 28, cwid, h - 28);
      s += crittall(cx + 6, y + 8, 16, 12, 3) + crittall(cx + cwid - 22, y + 8, 16, 12, 3) + crittall(cx + cwid / 2 - 5, y + 8, 10, 12, 2);
      s += crittall(cx + 6, y + 36, 14, 12, 2) + crittall(cx + cwid - 20, y + 36, 14, 12, 2);
      for (const wx of [x, x + w - cw]) {
        s += timberGable(wx, y - 2, cw, 22, wall) + timberBand(wx, y - 2, cw, 30, wall) + brickWall(wx, y + 28, cw, h - 28);
        s += crittall(wx + 8, y + 6, cw - 16, 13, 3) + bay(wx + 6, y + 32, cw - 12, h - 32, P.stone);
      }
      const dx = cx + cwid / 2 - 5;
      s += arch(dx - 5, 20, y + 30, P.stone) + sunDoor(dx, y + 40, h - 40, '#5a3722');
      return { svg: s, doors: [dx + 5] };
    },
  };

  // Brick-sided porch with a tiled gable over a front door.
  function porch(d) {
    const x = d - 11, y = GROUND - 23;
    return brickWall(x, y + 5, 4, 18) + brickWall(x + 18, y + 5, 4, 18) + poly(`${x - 3},${y + 6} ${d},${y - 3} ${x + 25},${y + 6}`, P.tile) +
      r(x - 3, y + 5, 28, 1.6, P.tileDark);
  }

  // Privet hedge with a sunburst gate and a crazy-paving path to each door, and a few roses.
  function yard(doors) {
    let s = '';
    for (const d of doors) {
      s += `<g fill="#cfc4ab" stroke="#a79c83" stroke-width=".5">` +
        [[-5, 0, 0, 0, -1, 4, -5, 5], [0, 0, 5, 0, 5, 6, -1, 4], [-5, 5, -1, 4, 0, 10, -5, 10], [-1, 4, 5, 6, 5, 11, 0, 10], [-5, 10, 0, 10, 1, 16, -5, 16], [0, 10, 5, 11, 5, 16, 1, 16]]
          .map((q) => `<polygon points="${q.map((v, i) => (i % 2 ? GROUND + v : d + v)).join(' ')}"/>`).join('') + '</g>';
    }
    const gaps = doors.map((d) => [d - 7, d + 7]);
    let from = 2;
    for (const [a, b] of gaps.concat([[W - 2, W]])) {
      if (a > from) s += r(from, GROUND + 7, a - from, 7, P.hedge, 'rx="2.5"') + r(from + 1, GROUND + 7, a - from - 2, 2.5, P.hedgeHi, 'rx="1.2"');
      from = b;
    }
    for (const d of doors) {
      s += r(d - 7, GROUND + 9, 14, 5, 'none', `stroke="${P.frame}" stroke-width="1"`) + `<g stroke="${P.frame}" stroke-width=".8">` +
        [0, 45, 90, 135, 180].map((a) => { const t = (a * Math.PI) / 180; return `<line x1="${d}" y1="${GROUND + 14}" x2="${(d + Math.cos(t) * 6).toFixed(1)}" y2="${(GROUND + 14 - Math.sin(t) * 4.6).toFixed(1)}"/>`; }).join('') + '</g>';
    }
    const roses = ['#c8374d', '#f2c14e', '#f4f0e6', '#e0768c'];
    for (let i = 0; i < 13; i++) {
      const rx = 8 + i * 12;
      if (!gaps.some(([a, b]) => rx > a - 2 && rx < b + 2)) s += `<circle cx="${rx}" cy="${GROUND + 7}" r="1.5" fill="${roses[i % 4]}"/>`;
    }
    return s;
  }

  function house(type, upgrades = [], stars = 0) {
    const c = STYLE[type];
    const wall = upgrades.includes('paint') ? c.paint : c.wall;
    const { svg, doors } = BODY[type](wall);
    let s = `<ellipse cx="${W / 2}" cy="${GROUND + 1}" rx="${c.w / 2 + 12}" ry="4" fill="rgba(0,0,0,.18)"/>`;
    if (!upgrades.includes('yard')) s += doors.map((d) => `<rect class="g-walk" x="${d - 5}" y="${GROUND}" width="10" height="16"/>`).join('');
    s += svg;
    if (upgrades.includes('porch')) s += doors.map(porch).join('');
    if (upgrades.includes('yard')) s += yard(doors);
    if (stars) s += `<text x="80" y="118" text-anchor="middle" font-size="8" font-weight="800" fill="#f2c14e" stroke="#5d4820" stroke-width=".5">${'★'.repeat(stars)}</text>`;
    return s;
  }

  function lawn(path) {
    let s = `<rect class="g-grass" x="0" y="0" width="${W}" height="120"/>`;
    s += `<rect class="g-grass2" x="0" y="0" width="${W}" height="30"/>`;
    if (path) s += `<rect class="g-walk" x="${W / 2 - 6}" y="${GROUND}" width="12" height="16"/>`;
    return s;
  }

  function tree(x, y, s = 1) {
    return `<rect x="${x - 2 * s}" y="${y}" width="${4 * s}" height="${12 * s}" fill="#6b4a33"/>` +
      `<circle cx="${x}" cy="${y - 4 * s}" r="${11 * s}" class="g-tree"/><circle cx="${x - 5 * s}" cy="${y - 1 * s}" r="${8 * s}" class="g-tree2"/><circle cx="${x + 4 * s}" cy="${y - 9 * s}" r="${6 * s}" class="g-tree2"/>`;
  }

  function rundown() {
    const x = 36, y = GROUND - 32, w = 84;
    let s = `<ellipse cx="80" cy="${GROUND + 1}" rx="54" ry="4" fill="rgba(0,0,0,.18)"/>`;
    s += poly(`${x - 5},${y + 2} ${x + 30},${y - 18} ${x + w + 5},${y - 2}`, '#5d544b') + r(x, y, w, 32, '#8f857a');
    s += poly(`${x + 44},${y - 12} ${x + 54},${y - 13} ${x + 50},${y - 2}`, '#8f857a');
    for (const wx of [x + 10, x + 58]) s += r(wx, y + 8, 16, 12, '#3b3631') + `<g stroke="#b59a6d" stroke-width="3"><line x1="${wx - 2}" y1="${y + 9}" x2="${wx + 18}" y2="${y + 18}"/><line x1="${wx - 2}" y1="${y + 18}" x2="${wx + 18}" y2="${y + 10}"/></g>`;
    s += r(x + 36, y + 12, 11, 20, '#4a3f36');
    for (let i = 0; i < 9; i++) s += `<path d="M${10 + i * 17} ${GROUND + 12} l3 -9 l2 9 l3 -7 l1 7" fill="#5c7a36"/>`;
    return s;
  }

  function stakes() {
    const pts = [[24, 40], [136, 40], [24, 100], [136, 100]];
    let s = '<g stroke="#caa66b" stroke-width="1" stroke-dasharray="3 3" fill="none"><rect x="24" y="40" width="112" height="60"/></g>';
    for (const [x, y] of pts) s += r(x - 1, y - 9, 2.5, 10, '#caa66b') + poly(`${x + 1.5},${y - 9} ${x + 8},${y - 7} ${x + 1.5},${y - 5}`, '#ff7a2e');
    return s;
  }

  function saleSign() {
    return r(78, 56, 3, 40, '#6b4a33') + r(56, 42, 48, 20, '#fdfbf6', 'rx="1.5"') + r(58, 44, 44, 16, '#d2462f', 'rx="1"') +
      `<text x="80" y="54.5" text-anchor="middle" font-size="7.5" font-weight="700" letter-spacing=".3" fill="#fff" font-family="system-ui, sans-serif">FOR SALE</text>`;
  }

  const SPECIAL = {
    park() {
      let s = `<ellipse cx="80" cy="78" rx="62" ry="26" fill="#d9c9a2"/><ellipse cx="80" cy="78" rx="48" ry="18" class="g-grass"/>`;
      s += `<ellipse cx="80" cy="80" rx="14" ry="6" fill="#8fb8cf"/><rect x="77" y="66" width="6" height="12" fill="#b9b2a4"/><circle cx="80" cy="64" r="4" fill="#bfe0ef"/>`;
      s += tree(28, 52, 1.3) + tree(132, 50, 1.2) + tree(40, 92, 0.9) + tree(124, 94, 0.9);
      s += r(96, 92, 18, 3, '#7a5236') + r(97, 95, 2, 5, '#3b3631') + r(111, 95, 2, 5, '#3b3631');
      return s;
    },
    mill() {
      let s = poly('26,58 70,34 114,58', '#7a2f28') + r(30, 58, 80, 46, '#a2473a') + r(58, 72, 24, 32, '#5b2a23');
      s += `<g stroke="#f1e6d6" stroke-width="2"><line x1="58" y1="72" x2="82" y2="104"/><line x1="82" y1="72" x2="58" y2="104"/></g>`;
      s += `<circle cx="126" cy="70" r="16" fill="#c7ccd1"/><circle cx="126" cy="70" r="5" fill="#6d737a"/>`;
      s += `<g fill="#c7ccd1">${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<circle cx="${(126 + Math.cos(a) * 17).toFixed(1)}" cy="${(70 + Math.sin(a) * 17).toFixed(1)}" r="2.2"/>`; }).join('')}</g>`;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3 - i; j++) s += `<circle cx="${122 + j * 9 + i * 4.5}" cy="${100 - i * 8}" r="4.5" fill="#b48457" stroke="#7a5236"/>`;
      return s;
    },
    workshop() {
      let s = r(28, 50, 104, 54, '#6f7f8c') + poly('22,50 80,32 138,50', '#3c4650');
      s += r(40, 64, 40, 40, '#dfe3e6') + `<g stroke="#b7bec4">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<line x1="40" y1="${68 + i * 5}" x2="80" y2="${68 + i * 5}"/>`).join('')}</g>`;
      s += windowAt(94, 66, 24, 14, '#e8ebee');
      s += r(92, 38, 40, 12, '#f2c14e', 'rx="2"') + `<text x="112" y="46.5" text-anchor="middle" font-size="7" font-weight="800" fill="#2b2f33" font-family="system-ui, sans-serif">WORKS</text>`;
      return s;
    },
  };

  // Scaffolding shown over a structure under construction.
  function scaffold() {
    let s = '<g stroke="#c48a3a" stroke-width="2" fill="none">';
    for (let x = 30; x <= 130; x += 25) s += `<line x1="${x}" y1="${GROUND}" x2="${x}" y2="36"/>`;
    for (let y = GROUND - 22; y > 36; y -= 22) s += `<line x1="26" y1="${y}" x2="134" y2="${y}"/>`;
    return s + '</g>';
  }

  // Full picture for a lot. `id` keeps clip-path ids unique on the page.
  function lotSVG(lot, id) {
    let inner = lawn(false);
    if (!lot.task) {
      if (lot.kind === 'house' || lot.kind === 'damaged-sale') {
        inner += house(lot.house.type, lot.house.upgrades, lot.house.stars || 0);
        if (lot.house.damaged) inner += `<circle cx="134" cy="27" r="9" fill="#c94c3b"/><text x="134" y="31" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">!</text>`;
      }
      else if (lot.kind === 'special') inner += SPECIAL[lot.special]();
      else if (lot.kind === 'rundown') inner += rundown();
      else if (lot.owned) inner += stakes() + tree(146, 30, 0.7);
      else inner += tree(18, 34, 0.8) + tree(146, 28, 0.7);
      if (!lot.owned) inner += saleSign();
    } else {
      const t = lot.task;
      let before = '', after = '';
      if (t.kind === 'build') { before = stakes(); after = house(t.type); }
      else if (t.kind === 'special') { before = stakes(); after = SPECIAL[t.type](); }
      else if (t.kind === 'upgrade') {
        before = house(lot.house.type, lot.house.upgrades, lot.house.stars || 0);
        after = house(lot.house.type, t.type === 'star' ? lot.house.upgrades : lot.house.upgrades.concat(t.type), (lot.house.stars || 0) + (t.type === 'star' ? 1 : 0));
      }
      else if (t.kind === 'demolish') { before = lot.kind === 'house' ? house(lot.house.type, lot.house.upgrades) : rundown(); after = stakes(); }
      const reveal = t.kind === 'demolish' ? 'down' : 'up';
      inner += before;
      inner += `<clipPath id="clip-${id}"><rect data-reveal="${reveal}" x="0" y="0" width="${W}" height="0"/></clipPath>`;
      inner += `<g clip-path="url(#clip-${id})">${t.kind === 'demolish' ? lawn(false) + after : after}</g>`;
      if (t.kind !== 'upgrade') inner += scaffold();
    }
    return `<svg viewBox="0 0 ${W} 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${inner}</svg>`;
  }

  // Standalone thumbnail of a building for menus.
  function thumbSVG(kind, type) {
    const body = kind === 'house' ? house(type) : SPECIAL[type]();
    return `<svg viewBox="0 20 ${W} 96" aria-hidden="true">${body}</svg>`;
  }

  root.BAL = Object.assign(root.BAL || {}, { art: { lotSVG, thumbSVG } });
})(typeof self !== 'undefined' ? self : this);
