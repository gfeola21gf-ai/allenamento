/* figure.js — i disegni degli esercizi.
   Per correggere un disegno basta spostare i punti della sua posa qui sotto (x verso destra, y verso il basso, terreno a y = 136). */
// ---------- disegni: sagoma piena (stile B, scelto il 28/10). Ogni esercizio = posa di inizio e di fine.
// Lato lontano grigio, attrezzo a colori (kettlebell arancio, manubri blu, elastici verde, macchinari viola), arredo grigio.
// Nelle liste si vede la posa finale; a schermo intero la figura si muove tra le due pose (stile D).
const PAV = '<path d="M-40 136H240" stroke="var(--scena)" stroke-width="2.5" stroke-linecap="round"/>';
const kb = (x, y) => `<path d="M${x - 6} ${y - 6} Q${x} ${y - 20} ${x + 6} ${y - 6}" stroke="var(--tratto)" stroke-width="3.2" fill="none" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="8.5" fill="var(--kb)" stroke="var(--tratto)" stroke-width="2.4"/>`;
const kbSu = (x, y) => `<path d="M${x - 6} ${y + 6} Q${x} ${y + 20} ${x + 6} ${y + 6}" stroke="var(--tratto)" stroke-width="3.2" fill="none" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="8.5" fill="var(--kb)" stroke="var(--tratto)" stroke-width="2.4"/>`;
const elastico = (a, b) => `<path d="M${a[0]} ${a[1] + 1} L${b[0]} ${b[1] + 1}" stroke="var(--ela)" stroke-width="4.5" stroke-linecap="round"/><circle cx="${a[0]}" cy="${a[1] + 1}" r="4.5" fill="none" stroke="var(--ela)" stroke-width="3"/><circle cx="${b[0]}" cy="${b[1] + 1}" r="4.5" fill="none" stroke="var(--ela)" stroke-width="3"/>`;
const SCENE = {
  sedia: '<path d="M46 58V136M46 100H80M76 104V136" stroke="var(--scena)" stroke-width="4" stroke-linecap="round" fill="none"/><rect x="44" y="98" width="38" height="6" rx="2" fill="var(--scena-bg)" stroke="var(--scena)" stroke-width="2.5"/>',
  panca: '<path d="M30 114V136M84 114V136" stroke="var(--scena)" stroke-width="4" stroke-linecap="round"/><rect x="20" y="107" width="72" height="8" rx="3" fill="var(--scena-bg)" stroke="var(--scena)" stroke-width="2.5"/>',
  pancaDx: '<path d="M136 108V136M182 108V136" stroke="var(--scena)" stroke-width="4" stroke-linecap="round"/><rect x="126" y="101" width="64" height="8" rx="3" fill="var(--scena-bg)" stroke="var(--scena)" stroke-width="2.5"/>',
};
const SBARRA = '<path d="M66 136V16M134 136V16" stroke="var(--scena)" stroke-width="3" stroke-linecap="round"/><path d="M60 16H140" stroke="var(--scena)" stroke-width="5" stroke-linecap="round"/>';
const TAPPETO = '<rect x="24" y="52" width="152" height="88" rx="10" fill="var(--scena-bg)" stroke="var(--scena)" stroke-width="2"/>';
const MURO = '<path d="M164 136V60" stroke="var(--scena)" stroke-width="5" stroke-linecap="round"/>';
const GRADINO = '<rect x="78" y="111" width="46" height="25" rx="3" fill="var(--scena-bg)" stroke="var(--scena)" stroke-width="2.5"/>';
const ASCIUGAMANO = '<rect x="46" y="124" width="62" height="8" rx="4" fill="var(--scena-bg)" stroke="var(--scena)" stroke-width="2"/>';
const IN_PIEDI = { testa: [94, 21], tronco: [[92, 37], [91, 76]], gambe: [[[91, 76], [93, 105], [92, 134], [105, 135]]] };
const POSE = {
  squat: { scena: SCENE.sedia, inc: [[44, 56]], attrezzo: P => kb(P.braccia[0][2][0] + 4, P.braccia[0][2][1] + 9),
    inizio: { testa: [93, 21], tronco: [[91, 37], [90, 74]], lontano: [[[88, 74], [90, 104], [88, 133], [101, 135]], [[89, 38], [93, 56], [102, 45]]],
      gambe: [[[90, 74], [93, 104], [91, 133], [104, 135]]], braccia: [[[91, 39], [96, 57], [105, 46]]] },
    fine: { testa: [104, 47], tronco: [[97, 62], [82, 98]], lontano: [[[80, 97], [108, 102], [101, 133], [114, 135]], [[95, 63], [100, 81], [110, 69]]],
      gambe: [[[82, 98], [111, 104], [105, 133], [118, 135]]], braccia: [[[97, 64], [103, 82], [113, 70]]] } },
  rematore: { scena: SCENE.panca, inc: [[34, 108]], attrezzo: P => kb(P.braccia[0][2][0], P.braccia[0][2][1] + 9),
    inizio: { testa: [79, 66], tronco: [[94, 72], [130, 80]], lontano: [[[128, 80], [120, 107], [116, 134], [104, 135]], [[95, 73], [92, 92], [86, 107]]],
      gambe: [[[130, 80], [134, 108], [132, 134], [120, 135]]], braccia: [[[96, 74], [97, 93], [98, 110]]] },
    fine: { testa: [79, 66], tronco: [[94, 72], [130, 80]], lontano: [[[128, 80], [120, 107], [116, 134], [104, 135]], [[95, 73], [92, 92], [86, 107]]],
      gambe: [[[130, 80], [134, 108], [132, 134], [120, 135]]], braccia: [[[96, 74], [114, 66], [112, 86]]] } },
  elastico: { attrezzo: P => elastico(P.braccia[0][2], P.braccia[1][2]),
    inizio: { testa: [100, 22], tronco: [[88, 37], [112, 37], [108, 80], [92, 80]], lontano: [],
      gambe: [[[95, 80], [94, 107], [93, 133], [86, 135]], [[105, 80], [106, 107], [107, 133], [114, 135]]], braccia: [[[88, 41], [84, 64], [93, 66]], [[112, 41], [116, 64], [107, 66]]] },
    fine: { testa: [100, 22], tronco: [[88, 37], [112, 37], [108, 80], [92, 80]], lontano: [],
      gambe: [[[95, 80], [94, 107], [93, 133], [86, 135]], [[105, 80], [106, 107], [107, 133], [114, 135]]], braccia: [[[88, 41], [84, 64], [62, 60]], [[112, 41], [116, 64], [138, 60]]] } },
  bottomsup: { attrezzo: P => { const w = P.braccia[0][2]; return w[1] < 62 ? kbSu(w[0] + 1, w[1] - 11) : kb(w[0], w[1] + 9); },
    inizio: { ...IN_PIEDI, lontano: [[[89, 76], [90, 105], [89, 134], [102, 135]], [[90, 38], [90, 58], [91, 77]]], braccia: [[[93, 40], [94, 59], [95, 78]]] },
    fine: { ...IN_PIEDI, lontano: [[[89, 76], [90, 105], [89, 134], [102, 135]], [[90, 38], [90, 58], [91, 77]]], braccia: [[[93, 40], [104, 56], [110, 40]]] } },
  yt: { attrezzo: () => '',
    inizio: { testa: [42, 118], tronco: [[56, 124], [110, 127]], lontano: [[[108, 127], [138, 129], [168, 131], [176, 135]], [[56, 124], [38, 129], [20, 131]]],
      gambe: [[[110, 127], [140, 129], [170, 130], [178, 135]]], braccia: [[[58, 124], [40, 128], [22, 130]]] },
    fine: { testa: [42, 117], tronco: [[56, 124], [110, 127]], lontano: [[[108, 127], [138, 129], [168, 131], [176, 135]], [[56, 122], [38, 115], [20, 107]]],
      gambe: [[[110, 127], [140, 129], [170, 130], [178, 135]]], braccia: [[[58, 122], [40, 114], [22, 106]]] } },
  split: { attrezzo: P => kb(P.braccia[0][2][0], P.braccia[0][2][1] + 9),
    inizio: { testa: [102, 18], tronco: [[100, 34], [100, 74]], lontano: [[[98, 74], [88, 102], [66, 124], [61, 131]]],
      gambe: [[[100, 74], [118, 98], [124, 130], [137, 134]]], braccia: [[[100, 36], [101, 55], [102, 74]]] },
    fine: { testa: [102, 40], tronco: [[100, 56], [100, 96]], lontano: [[[98, 96], [92, 124], [64, 128], [60, 135]]],
      gambe: [[[100, 96], [126, 100], [124, 130], [137, 134]]], braccia: [[[100, 58], [101, 77], [102, 96]]] } },
  flessioni: { attrezzo: () => '',
    inizio: { testa: [43, 86], tronco: [[58, 92], [122, 111]], lontano: [[[120, 111], [148, 119], [175, 128], [179, 135]], [[56, 93], [55, 114], [54, 135]]],
      gambe: [[[122, 111], [150, 119], [178, 128], [182, 135]]], braccia: [[[58, 94], [58, 114], [58, 135]]] },
    fine: { testa: [46, 113], tronco: [[62, 118], [122, 124]], lontano: [[[120, 124], [148, 126], [175, 129], [179, 135]], [[60, 118], [77, 117], [63, 135]]],
      gambe: [[[122, 124], [150, 126], [178, 129], [182, 135]]], braccia: [[[62, 119], [80, 118], [66, 135]]] } },
  carry: { attrezzo: P => kb(P.braccia[0][2][0], P.braccia[0][2][1] + 9),
    inizio: { testa: [98, 21], tronco: [[96, 37], [96, 76]], lontano: [[[94, 76], [88, 104], [82, 132], [93, 135]], [[94, 39], [98, 58], [100, 76]]],
      gambe: [[[96, 76], [104, 104], [106, 133], [118, 135]]], braccia: [[[96, 39], [96, 58], [96, 78]]] },
    fine: { testa: [98, 21], tronco: [[96, 37], [96, 76]], lontano: [[[94, 76], [104, 104], [106, 133], [118, 135]], [[94, 39], [90, 58], [88, 76]]],
      gambe: [[[96, 76], [88, 104], [82, 132], [93, 135]]], braccia: [[[96, 39], [96, 58], [96, 78]]] } },
  copenhagen: { scena: SCENE.pancaDx, inc: [[176, 100]], attrezzo: () => '',
    inizio: { testa: [40, 98], tronco: [[54, 106], [100, 120]], lontano: [[[98, 122], [122, 128], [146, 132]]],
      gambe: [[[100, 120], [128, 103], [160, 96]]], braccia: [[[54, 108], [52, 134], [72, 134]]] },
    fine: { testa: [40, 94], tronco: [[54, 104], [104, 100]], lontano: [[[102, 102], [126, 112], [148, 122]]],
      gambe: [[[104, 100], [134, 98], [160, 96]]], braccia: [[[54, 106], [52, 134], [72, 134]]] } },
  ponte: { attrezzo: () => '',
    inizio: { testa: [36, 124], tronco: [[50, 128], [100, 130]], lontano: [[[98, 130], [123, 111], [135, 133], [147, 135]]],
      gambe: [[[100, 130], [126, 110], [138, 133], [150, 135]]], braccia: [[[52, 128], [72, 132], [92, 133]]] },
    fine: { testa: [36, 124], tronco: [[50, 128], [102, 106]], lontano: [[[100, 107], [127, 105], [135, 133], [147, 135]]],
      gambe: [[[102, 106], [130, 104], [138, 133], [150, 135]]], braccia: [[[52, 128], [72, 132], [92, 133]]] } },
  gatto: { attrezzo: () => '',
    inizio: { testa: [48, 102], tronco: [[62, 92], [92, 72], [122, 92]], lontano: [[[120, 92], [123, 112], [124, 134], [156, 134]], [[60, 93], [58, 114], [57, 134]]],
      gambe: [[[122, 92], [126, 112], [128, 134], [160, 134]]], braccia: [[[62, 94], [61, 114], [60, 134]]] },
    fine: { testa: [46, 80], tronco: [[62, 90], [92, 100], [122, 92]], lontano: [[[120, 92], [123, 112], [124, 134], [156, 134]], [[60, 91], [58, 113], [57, 134]]],
      gambe: [[[122, 92], [126, 112], [128, 134], [160, 134]]], braccia: [[[62, 92], [61, 113], [60, 134]]] } },
  stacco: { attrezzo: P => kb(P.braccia[0][2][0], P.braccia[0][2][1] + 9),
    inizio: { testa: [122, 52], tronco: [[108, 62], [78, 88]], lontano: [[[76, 88], [100, 104], [92, 133], [105, 135]], [[106, 63], [104, 84], [102, 103]]],
      gambe: [[[78, 88], [102, 104], [94, 133], [107, 135]]], braccia: [[[108, 64], [106, 84], [104, 104]]] },
    fine: { testa: [94, 21], tronco: [[92, 37], [90, 76]], lontano: [[[88, 76], [92, 105], [92, 133], [105, 135]], [[90, 39], [91, 58], [92, 77]]],
      gambe: [[[90, 76], [94, 105], [94, 133], [107, 135]]], braccia: [[[92, 39], [93, 58], [94, 77]]] } },
  trazioni: { scena: SBARRA, inc: [[66, 12], [134, 12]], attrezzo: () => '',
    inizio: { testa: [101, 40], tronco: [[98, 54], [98, 93]], lontano: [[[96, 93], [103, 116], [89, 130]], [[95, 54], [99, 36], [97, 17]]],
      gambe: [[[98, 93], [106, 116], [92, 130]]], braccia: [[[98, 54], [103, 36], [100, 17]]] },
    fine: { testa: [102, 15], tronco: [[96, 32], [96, 71]], lontano: [[[94, 71], [101, 94], [87, 108]], [[93, 32], [110, 29], [97, 17]]],
      gambe: [[[96, 71], [104, 94], [90, 108]]], braccia: [[[96, 32], [114, 29], [100, 17]]] } },
  deadbug: { attrezzo: () => '',
    inizio: { testa: [40, 124], tronco: [[54, 126], [100, 128]], lontano: [[[54, 124], [54, 104], [54, 86]], [[98, 128], [98, 100], [126, 100], [132, 96]]],
      gambe: [[[100, 128], [100, 100], [128, 100], [134, 96]]], braccia: [[[56, 124], [56, 104], [56, 86]]] },
    fine: { testa: [40, 124], tronco: [[54, 126], [100, 128]], lontano: [[[54, 124], [54, 104], [54, 86]], [[98, 128], [126, 123], [154, 119], [160, 114]]],
      gambe: [[[100, 128], [100, 100], [128, 100], [134, 96]]], braccia: [[[56, 124], [38, 118], [20, 114]]] } },
  birddog: { attrezzo: () => '',
    inizio: { testa: [48, 86], tronco: [[62, 92], [122, 94]], lontano: [[[60, 93], [58, 114], [57, 134]], [[120, 94], [123, 114], [124, 134], [156, 134]]],
      gambe: [[[122, 94], [126, 114], [128, 134], [160, 134]]], braccia: [[[62, 94], [61, 114], [60, 134]]] },
    fine: { testa: [48, 86], tronco: [[62, 92], [122, 94]], lontano: [[[60, 93], [58, 114], [57, 134]], [[120, 94], [148, 92], [176, 90], [180, 84]]],
      gambe: [[[122, 94], [126, 114], [128, 134], [160, 134]]], braccia: [[[62, 92], [44, 90], [26, 88]]] } },
  sideplank: { attrezzo: () => '',
    inizio: { testa: [42, 98], tronco: [[56, 106], [104, 124]], lontano: [[[58, 104], [80, 112], [100, 120]], [[102, 125], [137, 130], [168, 133], [174, 129]]],
      gambe: [[[104, 124], [138, 129], [170, 133], [176, 129]]], braccia: [[[56, 108], [54, 134], [74, 134]]] },
    fine: { testa: [42, 94], tronco: [[56, 104], [104, 116]], lontano: [[[58, 102], [80, 106], [100, 112]], [[102, 117], [136, 123], [168, 131], [174, 127]]],
      gambe: [[[104, 116], [138, 124], [170, 132], [176, 128]]], braccia: [[[56, 106], [54, 134], [74, 134]]] } },
  plank: { attrezzo: () => '',
    inizio: { testa: [46, 108], tronco: [[60, 112], [122, 119]], lontano: [[[58, 112], [57, 134], [77, 134]], [[120, 119], [148, 123], [176, 128], [180, 135]]],
      gambe: [[[122, 119], [150, 123], [178, 128], [182, 135]]], braccia: [[[60, 112], [60, 134], [80, 134]]] },
    fine: { testa: [46, 106], tronco: [[60, 110], [122, 114]], lontano: [[[58, 110], [57, 134], [77, 134]], [[120, 114], [148, 120], [176, 127], [180, 135]]],
      gambe: [[[122, 114], [150, 120], [178, 127], [182, 135]]], braccia: [[[60, 110], [60, 134], [80, 134]]] } },
  // ---- vista dall'alto (tappetino): sdraiato su un fianco ----
  openbook: { scena: TAPPETO, senzaPav: true, inc: [[24, 52], [176, 140]], attrezzo: () => '',
    inizio: { testa: [48, 96], tronco: [[62, 96], [112, 96]], lontano: [[[110, 97], [120, 72], [146, 77]], [[62, 97], [64, 77], [66, 58]]],
      gambe: [[[112, 96], [122, 70], [148, 74]]], braccia: [[[62, 96], [67, 77], [71, 58]]] },
    fine: { testa: [47, 98], tronco: [[62, 96], [112, 96]], lontano: [[[110, 97], [120, 72], [146, 77]], [[62, 97], [64, 77], [66, 58]]],
      gambe: [[[112, 96], [122, 70], [148, 74]]], braccia: [[[62, 96], [60, 115], [58, 134]]] } },
  respiri: { scena: MURO, inc: [[166, 70]], attrezzo: () => '',
    inizio: { testa: [40, 124], tronco: [[54, 126], [80, 127], [104, 128]], lontano: [[[102, 128], [121, 99], [149, 99], [154, 90]]],
      gambe: [[[104, 128], [124, 98], [152, 98], [157, 89]]], braccia: [[[56, 126], [76, 130], [94, 131]]] },
    fine: { testa: [40, 124], tronco: [[54, 125], [80, 120], [104, 128]], lontano: [[[102, 128], [121, 99], [149, 99], [154, 90]]],
      gambe: [[[104, 128], [124, 98], [152, 98], [157, 89]]], braccia: [[[56, 125], [76, 130], [94, 131]]] } },
  aroundworld: { attrezzo: P => { const a = P.braccia[0][2], b = P.braccia[1][2]; return kb((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 8); },
    inizio: { testa: [100, 22], tronco: [[88, 37], [112, 37], [108, 80], [92, 80]], lontano: [],
      gambe: [[[95, 80], [94, 107], [93, 133], [86, 135]], [[105, 80], [106, 107], [107, 133], [114, 135]]], braccia: [[[88, 41], [98, 64], [116, 80]], [[112, 41], [120, 62], [120, 80]]] },
    fine: { testa: [100, 22], tronco: [[88, 37], [112, 37], [108, 80], [92, 80]], lontano: [],
      gambe: [[[95, 80], [94, 107], [93, 133], [86, 135]], [[105, 80], [106, 107], [107, 133], [114, 135]]], braccia: [[[88, 41], [80, 62], [80, 80]], [[112, 41], [102, 64], [84, 80]]] } },
  curlup: { attrezzo: () => '',
    inizio: { testa: [40, 124], tronco: [[54, 126], [104, 128]], lontano: [[[102, 128], [124, 108], [138, 132], [150, 134]]],
      gambe: [[[104, 128], [134, 130], [164, 131], [168, 124]]], braccia: [[[56, 125], [70, 130], [84, 131]]] },
    fine: { testa: [43, 114], tronco: [[56, 120], [104, 128]], lontano: [[[102, 128], [124, 108], [138, 132], [150, 134]]],
      gambe: [[[104, 128], [134, 130], [164, 131], [168, 124]]], braccia: [[[58, 121], [70, 129], [84, 131]]] } },
  bear: { attrezzo: () => '',
    inizio: { testa: [48, 88], tronco: [[62, 94], [122, 96]], lontano: [[[60, 95], [58, 115], [57, 134]], [[120, 96], [123, 133], [150, 134], [156, 135]]],
      gambe: [[[122, 96], [126, 133], [154, 134], [160, 135]]], braccia: [[[62, 96], [61, 115], [60, 134]]] },
    fine: { testa: [48, 86], tronco: [[62, 92], [122, 92]], lontano: [[[120, 92], [123, 122], [150, 129], [156, 135]]],
      gambe: [[[122, 92], [126, 122], [154, 129], [160, 135]]], braccia: [[[62, 94], [61, 114], [60, 134]]] } },
  wallslide: { attrezzo: P => elastico(P.braccia[0][2], P.braccia[1][2]),
    inizio: { testa: [100, 22], tronco: [[88, 37], [112, 37], [108, 80], [92, 80]], lontano: [],
      gambe: [[[95, 80], [94, 107], [93, 133], [86, 135]], [[105, 80], [106, 107], [107, 133], [114, 135]]], braccia: [[[88, 41], [74, 50], [76, 28]], [[112, 41], [126, 50], [124, 28]]] },
    fine: { testa: [100, 22], tronco: [[88, 37], [112, 37], [108, 80], [92, 80]], lontano: [],
      gambe: [[[95, 80], [94, 107], [93, 133], [86, 135]], [[105, 80], [106, 107], [107, 133], [114, 135]]], braccia: [[[88, 39], [80, 21], [77, 2]], [[112, 39], [120, 21], [123, 2]]] } },
  lateralwalk: { attrezzo: P => elastico(P.gambe[0][1], P.gambe[1][1]),
    inizio: { testa: [100, 30], tronco: [[88, 45], [112, 45], [108, 86], [92, 86]], lontano: [],
      gambe: [[[95, 86], [90, 110], [90, 133], [80, 135]], [[105, 86], [110, 110], [110, 133], [120, 135]]], braccia: [[[88, 49], [83, 68], [92, 80]], [[112, 49], [117, 68], [108, 80]]] },
    fine: { testa: [100, 30], tronco: [[88, 45], [112, 45], [108, 86], [92, 86]], lontano: [],
      gambe: [[[95, 86], [82, 110], [76, 133], [66, 135]], [[105, 86], [118, 110], [124, 133], [134, 135]]], braccia: [[[88, 49], [83, 68], [92, 80]], [[112, 49], [117, 68], [108, 80]]] } },
  stepdown: { scena: GRADINO, inc: [[78, 110], [124, 110]], attrezzo: () => '',
    inizio: { testa: [97, 0], tronco: [[96, 15], [98, 54]], lontano: [[[96, 54], [92, 82], [88, 108], [80, 110]], [[96, 17], [106, 34], [118, 40]]],
      gambe: [[[98, 54], [100, 82], [100, 110], [112, 111]]], braccia: [[[96, 17], [108, 30], [120, 36]]] },
    fine: { testa: [101, 13], tronco: [[98, 28], [92, 66]], lontano: [[[90, 66], [86, 96], [84, 128], [76, 135]], [[98, 30], [110, 42], [124, 48]]],
      gambe: [[[92, 66], [112, 86], [100, 110], [112, 111]]], braccia: [[[98, 30], [112, 40], [126, 44]]] } },
  novanta: { attrezzo: () => '',
    inizio: { testa: [98, 74], tronco: [[86, 88], [110, 88], [108, 124], [92, 124]], lontano: [],
      gambe: [[[94, 124], [66, 124], [96, 133]], [[106, 124], [134, 126], [146, 112]]], braccia: [[[88, 92], [80, 108], [74, 122]], [[108, 92], [116, 108], [122, 122]]] },
    fine: { testa: [86, 78], tronco: [[76, 92], [100, 89], [106, 124], [90, 124]], lontano: [],
      gambe: [[[94, 124], [66, 124], [96, 133]], [[106, 124], [134, 126], [146, 112]]], braccia: [[[78, 95], [70, 110], [66, 124]], [[98, 92], [104, 108], [110, 122]]] } },
  asciugamano: { scena: ASCIUGAMANO, inc: [[46, 126]], attrezzo: () => '',
    inizio: { testa: [38, 118], tronco: [[52, 120], [104, 122]], lontano: [[[102, 122], [122, 103], [136, 132], [148, 134]]],
      gambe: [[[104, 122], [126, 104], [140, 132], [152, 134]]], braccia: [[[54, 120], [74, 126], [94, 128]]] },
    fine: { testa: [38, 118], tronco: [[52, 120], [104, 122]], lontano: [[[102, 122], [122, 103], [136, 132], [148, 134]]],
      gambe: [[[104, 122], [126, 104], [140, 132], [152, 134]]], braccia: [[[54, 120], [36, 126], [18, 130]]] } },
};
const lerp = (a, b, t) => Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], t)) : typeof a === 'object' ? Object.fromEntries(Object.keys(a).map(k => [k, lerp(a[k], b[k], t)])) : a + (b - a) * t;
const percorso = pts => 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
const tratto = (pts, col, w) => `<path d="${percorso(pts)}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
function sagoma(P, p) {
  let s = P.lontano.map(a => tratto(a, 'var(--lontano)', 7.5)).join('');
  s += P.tronco.length === 4 ? `<path d="${percorso(P.tronco)}Z" fill="var(--tratto)" stroke="var(--tratto)" stroke-width="6" stroke-linejoin="round"/>` : tratto(P.tronco, 'var(--tratto)', 16);
  s += `<circle cx="${P.testa[0]}" cy="${P.testa[1]}" r="9.5" fill="var(--tratto)"/>`;
  s += P.gambe.map(a => tratto(a, 'var(--tratto)', 7.5)).join('') + p.attrezzo(P) + P.braccia.map(a => tratto(a, 'var(--tratto)', 7.5)).join('');
  return s;
}
// riquadro ritagliato attorno alla persona (le due pose + l'arredo importante), in proporzione 4:3
const punti = o => Array.isArray(o) && typeof o[0] === 'number' ? [o] : Object.values(o).flatMap(punti);
function riquadro(p) {
  if (p.box) return p.box;
  const pts = [...punti(p.inizio), ...punti(p.fine), ...(p.inc || [])], xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
  let x1 = Math.min(...xs) - 16, x2 = Math.max(...xs) + 16, y1 = Math.min(...ys) - 16, y2 = p.senzaPav ? Math.max(...ys) + 4 : Math.max(138, Math.max(...ys) + 6);
  let w = x2 - x1, h = y2 - y1;
  if (w / h < 4 / 3) { const nw = h * 4 / 3; x1 -= (nw - w) / 2; w = nw; } else { const nh = w * 3 / 4; y1 -= nh - h; h = nh; }
  return (p.box = [x1, y1, w, h].map(v => +v.toFixed(1)).join(' '));
}

// ---------- attrezzi: colore fisso e icona (per gli esercizi senza disegno) ----------
export const ATTREZZI = {
  cl: { nome: 'Corpo libero', col: '--cl', ico: '<circle cx="12" cy="5" r="2.2"/><path d="M12 8v6M8 10.5l4-1.5 4 1.5M9 21l3-7 3 7"/>' },
  kb: { nome: 'Kettlebell', col: '--kb', ico: '<path d="M9 8.5a3 3 0 0 1 6 0"/><circle cx="12" cy="14.5" r="5.5"/>' },
  man: { nome: 'Manubri', col: '--man', ico: '<path d="M8 12h8"/><rect x="3.5" y="8" width="4" height="8" rx="1.2"/><rect x="16.5" y="8" width="4" height="8" rx="1.2"/>' },
  bil: { nome: 'Bilanciere', col: '--man', ico: '<path d="M2 12h20"/><rect x="5" y="6.5" width="3" height="11" rx="1"/><rect x="16" y="6.5" width="3" height="11" rx="1"/>' },
  mac: { nome: 'Macchinario', col: '--mac', ico: '<path d="M6 21V4h12"/><path d="M15 4v7"/><rect x="11" y="11" width="8" height="5" rx="1"/><path d="M4 21h8"/>' },
  cavo: { nome: 'Cavi', col: '--mac', ico: '<path d="M5 3v18M5 4h9"/><circle cx="14" cy="5" r="1.6"/><path d="M14 6.5V14"/><path d="M11 14h6"/>' },
  ela: { nome: 'Elastico', col: '--ela', ico: '<path d="M4 12c3-5 13-5 16 0-3 5-13 5-16 0z"/>' },
  mob: { nome: 'Mobilità', col: '--mob', ico: '<path d="M12 3a9 9 0 1 0 9 9"/><path d="M21 4l-4 4m0-4h4v4"/>' },
  pis: { nome: 'Piscina', col: '--pis', ico: '<path d="M2 16c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0M2 20c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0"/><circle cx="15" cy="7" r="2"/><path d="M5 12l5-4 3 3"/>' },
};
export const haDisegno = nome => !!POSE[nome];
export const nomiPose = () => Object.keys(POSE);

// t = 1 → posa finale (liste); 0..1 → a metà del movimento (schermo intero).
// Senza disegno: l'icona grande dell'attrezzo, del suo colore.
export function figura(nome, t = 1, att = 'cl') {
  const p = POSE[nome];
  if (!p) {
    const a = ATTREZZI[att] || ATTREZZI.cl;
    return `<svg class="fig" viewBox="-6 -3 36 27" aria-hidden="true"><g fill="none" stroke="var(${a.col})" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${a.ico}</g></svg>`;
  }
  const P = t === 1 ? p.fine : lerp(p.inizio, p.fine, t);
  return `<svg class="fig" viewBox="${riquadro(p)}" aria-hidden="true">${p.senzaPav ? '' : PAV}${p.scena || ''}${sagoma(P, p)}</svg>`;
}
export function iconaAttrezzo(att, size = 20) {
  const a = ATTREZZI[att] || ATTREZZI.cl;
  return `<svg class="ic" viewBox="0 0 24 24" style="width:${size}px;height:${size}px;color:var(${a.col})">${a.ico}</svg>`;
}
