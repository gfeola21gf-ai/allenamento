/* app.js — il regista: disegna le schermate e reagisce ai tocchi.
   Schermate: accesso · home · seduta (si fa tutto da lì) · esercizio a schermo intero · schede · diario · dettaglio.
   Fogli che salgono dal basso: modifica esercizio, menu •••, libreria, profilo, storico di un esercizio.
   I dati passano tutti da dati.js (prima sul telefono, poi su Supabase). Chiavi: vedi supabase/allenamento.sql. */
import * as D from "./dati.js";
import { figura, ATTREZZI, iconaAttrezzo, nomiPose, haDisegno } from "./figure.js";
import { LIBRERIA, CATEGORIE, schedeBase } from "./esercizi.js";

// ---------- aiutanti ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clona = o => o == null ? o : JSON.parse(JSON.stringify(o));
const mmss = s => `${Math.floor(s / 60)}:${String(Math.max(0, Math.round(s)) % 60).padStart(2, '0')}`;
const dataISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const oggi = () => dataISO();
const ieri = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dataISO(d); };
const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const dataBella = ms => { const d = new Date(ms); return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]}`; };
const coloreDolore = n => n <= 3 ? 'var(--ok)' : n <= 6 ? 'var(--avv)' : 'var(--rosso)';
const ic = d => `<svg class="ic" viewBox="0 0 24 24">${d}</svg>`;
const ICO = {
  check: ic('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  lucchetto: ic('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
  maniglia: ic('<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" stroke-width="3.4"/>'),
  play: ic('<path d="M8 5.5v13l10-6.5z" fill="currentColor"/>'),
  meno: ic('<path d="M6 12h12"/>'), piu: ic('<path d="M12 6v12M6 12h12"/>'),
  freccia: ic('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  indietro: ic('<path d="M15 5l-7 7 7 7"/>'), avanti: ic('<path d="M9 5l7 7-7 7"/>'),
  chiudi: ic('<path d="M6 6l12 12M18 6L6 18"/>'),
  giu: '<svg class="ic" viewBox="0 0 24 24" style="width:18px;height:18px"><path d="M6 9l6 6 6-6"/></svg>',
  puntini: ic('<path d="M6 12h.01M12 12h.01M18 12h.01" stroke-width="3.4"/>'),
  matita: ic('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>'),
  intero: ic('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  scambia: ic('<path d="M7 4L4 7l3 3M4 7h13M17 20l3-3-3-3M20 17H7"/>'),
  su: ic('<path d="M12 19V5M6 11l6-6 6 6"/>'), giuF: ic('<path d="M12 5v14M6 13l6 6 6-6"/>'),
  cestino: ic('<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>'),
  nota: ic('<path d="M5 4h14v16H5z"/><path d="M9 9h6M9 13h6"/>'),
  grafico: ic('<path d="M4 19h16"/><path d="M5 15l4-4 4 3 6-7"/>'),
  casa: ic('<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>'),
  schede: ic('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/>'),
  diario: ic('<path d="M6 3h10l3 3v15H6z"/><path d="M9 10h7M9 14h7M9 18h4"/>'),
  persona: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  cerca: ic('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>'),
  nuvola: ic('<path d="M7 18a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 8.5a4.5 4.5 0 0 1 .5 9.5z"/><path d="M4 4l16 16"/>'),
};
const COLORE_SCHEDA = { A: 'var(--A)', B: 'var(--B)' };
const coloreScheda = s => COLORE_SCHEDA[s?.lettera] || (s?.tipo === 'routine' ? 'var(--Q)' : s?.tipo === 'mobilita' ? 'var(--M)' : 'var(--cl)');
// MET (equivalente metabolico) per tipo di attività: kcal = MET × peso × ore
const MET = { allenamento: 4.2, routine: 2.8, mobilita: 2.3, riscaldamento: 3, camminata: 3.5 };

// ---------- dati ----------
const profilo = () => D.leggi('profilo') || {};
const schede = () => D.elenco('scheda:').map(([, v]) => v).sort((a, b) => (a.ordine ?? 9) - (b.ordine ?? 9));
const scheda = id => D.leggi('scheda:' + id);
const sedute = () => D.elenco('seduta:').map(([, v]) => v).filter(s => s.fine).sort((a, b) => b.inizio - a.inizio);
const giorno = (d = oggi()) => D.leggi('giorno:' + d) || {};
const libreriaMia = () => D.elenco('esercizio:').map(([, v]) => v);
const libreria = () => { const mie = libreriaMia(), ids = new Set(mie.map(e => e.id)); return [...mie, ...LIBRERIA.filter(e => !ids.has(e.id))]; };
const chiaveEs = e => e.lib || e.nome;
/** pause attive per attrezzo: { kb: { motivo, fino } } (fino = AAAA-MM-GG compreso, vuoto = finché non la togli) */
function pauseAttive() {
  const pz = profilo().pause || {};
  return Object.fromEntries(Object.entries(pz).filter(([, v]) => v && (!v.fino || v.fino >= oggi())));
}
const inPausa = e => !!e.pausa || !!pauseAttive()[e.att];
/** se metà degli esercizi o più è in pausa, la Home propone prima la routine */
const quasiTuttoInPausa = sc => !!sc && sc.esercizi.length > 0 && sc.esercizi.filter(inPausa).length * 2 >= sc.esercizi.length;
const obiettivo = () => profilo().obiettivo || 3;
const kcal = (min, met) => { const p = profilo().peso; return p ? Math.round(met * p * min / 60) : null; };

function prossimoAllenamento() {
  const rot = schede().filter(s => s.tipo === 'allenamento' && s.rotazione !== false);
  if (!rot.length) return null;
  const ultima = sedute().find(s => s.tipo === 'allenamento' && rot.some(r => r.id === s.scheda));
  if (!ultima) return rot[0];
  const i = rot.findIndex(r => r.id === ultima.scheda);
  return rot[(i + 1) % rot.length];
}
/** l'ultima volta che hai fatto questo esercizio (seduta finita, almeno una serie fatta) */
function ultimaVolta(e, esclusa) {
  for (const s of sedute()) {
    if (s.id === esclusa) continue;
    const x = s.esercizi.find(x => chiaveEs(x) === chiaveEs(e) && x.sets.some(z => z.fatta));
    if (x) return { ...x, quando: s.inizio };
  }
  return null;
}
/** regola di progressione: 2 sedute di fila pulite (tutte le serie, dolore ≤ 3, non al limite) allo stesso carico → +2 kg */
function suggerimento(e, esclusa) {
  if (e.kg == null || e.progressione === 'mai') return null;
  const volte = [];
  for (const s of sedute()) {
    if (s.id === esclusa) continue;
    const x = s.esercizi.find(x => chiaveEs(x) === chiaveEs(e));
    if (x && x.sets.length) volte.push(x);
    if (volte.length === 2) break;
  }
  if (volte.length < 2) return null;
  const pulita = x => x.sets.every(z => z.fatta && (z.kg ?? 0) >= e.kg && (z.rip ?? 0) >= (e.rip ?? 0)) && (x.dolore == null || x.dolore <= 3) && x.riserva !== '0-1';
  if (!volte.every(pulita)) return null;
  // il mattino dopo non deve essere peggio: se oggi una zona è salita rispetto a ieri, niente aumento
  if (peggioDiIeri().length) return null;
  return e.progressione === 'rip' ? { rip: (e.rip || 0) + 1 } : { kg: e.kg + 2 };
}
function peggioDiIeri() {
  const a = giorno().mattino, b = giorno(ieri()).mattino;
  if (!a || !b) return [];
  return ['schiena', 'spalla', 'ginocchio'].filter(z => a[z] != null && b[z] != null && a[z] > b[z]);
}
function settimana() {
  const d = new Date(); const lun = new Date(d); lun.setHours(0, 0, 0, 0); lun.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => { const g = new Date(lun); g.setDate(lun.getDate() + i); return dataISO(g); });
}
function kcalSettimana() {
  const giorni = new Set(settimana()); let tot = 0, ok = true;
  for (const s of sedute()) if (giorni.has(dataISO(new Date(s.inizio)))) { if (s.kcal == null) ok = false; tot += s.kcal || 0; }
  for (const g of giorni) { const c = giorno(g).camminate || {}; tot += Object.values(c).filter(Boolean).length * (kcal(10, MET.camminata) || 0); }
  return profilo().peso && ok ? tot : null;
}

// ---------- prima apertura: schede di partenza ----------
function semina() {
  aggiornaDati();
  if (D.elenco('scheda:').length) return;
  D.senzaRegistro(() => {
    schedeBase().forEach(s => D.scrivi('scheda:' + s.id, s));
    if (!D.leggi('profilo')) D.scrivi('profilo', D.PROVA ? { peso: 75, altezza: 175, eta: 25 } : { pause: { kb: { motivo: 'Indicazione del fisioterapista' } } });
    if (D.PROVA) semiProva();
  });
}
// dati salvati con versioni vecchie dell'app: disegni nuovi della libreria e pausa kettlebell → pause generali
function aggiornaDati() {
  const LIB = Object.fromEntries(LIBRERIA.map(e => [e.id, e]));
  const conDisegno = e => { if (!e.posa && LIB[e.lib]?.posa) { e.posa = LIB[e.lib].posa; return true; } return false; };
  D.senzaRegistro(() => {
    for (const sc of schede()) { const c = clona(sc); if (c.esercizi.map(conDisegno).some(Boolean)) D.scrivi('scheda:' + c.id, c); }
    const id = D.leggi('corrente'), sd = id && D.leggi('seduta:' + id);
    if (sd && !sd.fine) { const c = clona(sd); const cambiato = [...c.esercizi.map(conDisegno), ...c.extra.flatMap(x => x.voci.map(conDisegno))].some(Boolean); if (cambiato) D.scrivi('seduta:' + c.id, c); }
    const p = D.leggi('profilo');
    if (p && 'kbPausa' in p) { const { kbPausa, ...resto } = p; D.scrivi('profilo', { ...resto, pause: { ...(resto.pause || {}), ...(kbPausa ? { kb: { motivo: 'Indicazione del fisioterapista' } } : {}) } }); }
  });
}
// modalità prova: qualche seduta finta nelle ultime due settimane, per vedere diario e suggerimenti
function semiProva() {
  const giornoFa = (n, h = 18) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, 0, 0, 0); return d.getTime(); };
  [[12, 'A'], [10, 'B'], [8, 'A'], [5, 'B'], [3, 'A']].forEach(([n, id], k) => {
    const sc = scheda(id), inizio = giornoFa(n);
    const s = nuovaSedutaDa(sc, inizio);
    s.id = 'prova' + k;
    s.esercizi.forEach(e => { e.sets.forEach(z => z.fatta = true); e.dolore = e.att === 'kb' ? 1 : 0; e.riserva = '2-3'; });
    s.esercizi[1].nota = k === 4 ? 'spalla ok, polso un po\' stanco' : '';
    s.fine = inizio + 52 * 60000; s.minuti = 52; s.kcal = kcal(52, MET.allenamento);
    s.appunti = k === 4 ? 'Buona energia, schiena sciolta dopo il riscaldamento.' : '';
    D.scrivi('seduta:' + s.id, s);
  });
  [11, 9, 6, 4, 2, 1].forEach(n => { const d = new Date(); d.setDate(d.getDate() - n); D.scrivi('giorno:' + dataISO(d), { routine: true, camminate: { colazione: true, pranzo: n % 2 === 0, cena: true }, mattino: { schiena: 2, spalla: 1, ginocchio: 0 } }); });
}

// ---------- seduta ----------
let S = null;   // la seduta aperta (copia: si salva con salvaSeduta)
function nuovaSedutaDa(sc, inizio = Date.now()) {
  const tutto = sc.tipo === 'allenamento';
  const risc = (sc.conRisc ?? tutto) && sc.id !== 'risc' ? scheda('risc') : null, mob = (sc.conMob ?? tutto) && sc.id !== 'mob' ? scheda('mob') : null;
  return {
    id: 's' + inizio.toString(36), scheda: sc.id, nome: sc.nome, lettera: sc.lettera || null, tipo: sc.tipo, inizio, fine: null,
    esercizi: sc.esercizi.map(e => ({ ...clona(e), pausa: inPausa(e), sets: Array.from({ length: e.serie }, () => ({ kg: e.kg, rip: e.rip, sec: e.sec, fatta: false })), nota: '', dolore: null, riserva: null })),
    extra: [risc && { id: 'risc', nome: 'Riscaldamento', minuti: risc.minuti, prima: true, voci: risc.esercizi.map(e => ({ ...clona(e), fatto: false })) },
            mob && { id: 'mob', nome: 'Mobilità', minuti: mob.minuti, voci: mob.esercizi.map(e => ({ ...clona(e), fatto: false })) }].filter(Boolean),
    appunti: '', cambiato: false,
  };
}
function iniziaSeduta(idScheda) {
  const corrente = D.leggi('corrente');
  if (corrente && D.leggi('seduta:' + corrente) && !D.leggi('seduta:' + corrente).fine) { apriSeduta(corrente); avviso('Hai già un allenamento in corso: eccolo'); return; }
  const s = nuovaSedutaDa(scheda(idScheda));
  D.scrivi('seduta:' + s.id, s); D.scrivi('corrente', s.id);
  apriSeduta(s.id);
}
function apriSeduta(id) { S = clona(D.leggi('seduta:' + id)); V.prox = null; vai('seduta'); }
function salvaSeduta(unisci = false) { if (S) D.scrivi('seduta:' + S.id, clona(S), { unisci }); }
const ES = () => S?.esercizi || [];
const primoLibero = e => e.sets.findIndex(s => !s.fatta);
const attivi = () => ES().map((e, i) => ({ e, i })).filter(x => !x.e.pausa);
function prossimo() {
  const p = V.prox;
  if (p && ES()[p.i] && ES()[p.i].sets[p.j] && !ES()[p.i].sets[p.j].fatta && !ES()[p.i].pausa) return p;
  const x = attivi().find(x => primoLibero(x.e) >= 0);
  return x ? { i: x.i, j: primoLibero(x.e) } : null;
}
const partner = e => e.coppia ? ES().findIndex(x => x.codice === e.coppia && !x.pausa) : -1;

// ---------- schermate ----------
const V = { vista: 'caricamento', scheda: 'A', prox: null, cur: 0, dritta: true, dettaglio: null };
const app = $('#app');
app.innerHTML = `<section class="schermo" id="schermo"></section>
  <div class="foglio" id="foglio" hidden></div>
  <div class="velo" id="velo" hidden aria-live="polite">
    <div class="anello"><svg viewBox="0 0 220 220"><circle class="bg" cx="110" cy="110" r="96"/><circle class="fg" id="anello-fg" cx="110" cy="110" r="96"/></svg>
      <div class="t"><span id="rec-tit">Recupero</span><b id="rec-t">0</b></div></div>
    <div class="poi" id="rec-poi"></div><div class="comandi" id="rec-com"></div>
  </div>
  <div class="avviso" id="avviso" hidden role="status"><span id="avv-testo"></span><button id="avv-annulla" hidden>Annulla</button></div>`;
const schermo = $('#schermo');

function vai(vista, opz = {}) { if (vista !== 'home') V.modHome = false; V.vista = vista; Object.assign(V, opz); disegna(true); }
function disegna(nuova = false) {
  const corpo = $('.corpo', schermo), y = corpo ? corpo.scrollTop : 0;
  const f = { accesso: vistaAccesso, home: vistaHome, seduta: vistaSeduta, esercizio: vistaEsercizio, schede: vistaSchede, diario: vistaDiario, dettaglio: vistaDettaglio }[V.vista];
  schermo.innerHTML = f ? f() : '<p class="caricamento">Caricamento…</p>';
  const c2 = $('.corpo', schermo); if (c2 && !nuova) c2.scrollTop = y;
  mostraTimer();
  if (V.vista === 'esercizio') schermoAcceso();
}
let tAvv;
function avviso(t, annulla) {
  $('#avv-testo').textContent = t; $('#avviso').hidden = false;
  const b = $('#avv-annulla'); b.hidden = !annulla;
  b.onclick = () => { $('#avviso').hidden = true; annulla(); };
  clearTimeout(tAvv); tAvv = setTimeout(() => $('#avviso').hidden = true, annulla ? 5000 : 2400);
}
/** annulla l'ultima modifica (dati.js tiene la storia) e ridisegna */
function annullaUltima() { D.annulla(); if (S) S = clona(D.leggi('seduta:' + S.id)) || S; chiudiFoglio(); disegna(); }

// fogli (un solo contenitore: ogni foglio ne riscrive il contenuto)
let alChiudereFoglio = null;
function apriFoglio(html, { alto = false, menu = false } = {}) {
  const f = $('#foglio');
  f.innerHTML = `<div class="lastra${alto ? ' alta' : ''}" role="dialog" aria-modal="true">${menu ? `<div class="menu-voci">${html}</div>` : html}</div>`;
  f.hidden = false;
}
function chiudiFoglio() { $('#foglio').hidden = true; $('#foglio').innerHTML = ''; alChiudereFoglio = null; }
function apriMenu(testo, voci) {
  apriFoglio((testo ? `<p>${testo}</p>` : '') + voci.map((v, k) => `<button data-voce="${k}" class="${v.cls || ''}">${v.ico || ''}${esc(v.testo)}</button>`).join(''), { menu: true });
  alChiudereFoglio = voci;
}
const barra = (titolo, sx = `<button class="tasto" data-a="vai" data-v="home" aria-label="Indietro">${ICO.indietro}</button>`, dx = '') =>
  `<div class="barra">${sx}<h3>${titolo}</h3>${dx}</div>`;
const tabBar = attiva => `<nav class="schede" aria-label="Sezioni">
  <button data-a="vai" data-v="home"${attiva === 'home' ? ' aria-current="page"' : ''}>${ICO.casa}Oggi</button>
  <button data-a="vai" data-v="schede"${attiva === 'schede' ? ' aria-current="page"' : ''}>${ICO.schede}Schede</button>
  <button data-a="vai" data-v="diario"${attiva === 'diario' ? ' aria-current="page"' : ''}>${ICO.diario}Diario</button>
  <button data-a="profilo">${ICO.persona}Profilo</button></nav>`;

// ---------- accesso ----------
function vistaAccesso() {
  return `<div class="accesso">
    <div class="logo"><svg viewBox="0 0 100 100" width="44" height="44"><path d="M34 50V33a9 9 0 0 1 9-9h14a9 9 0 0 1 9 9v17" fill="none" stroke="currentColor" stroke-width="7"/><path d="M21 64a29 29 0 1 1 58 0c0 9-3 14-9 17H30c-6-3-9-8-9-17z" fill="var(--kb)"/></svg></div>
    <div><h1>Allenamento</h1><p class="tenue">Entra con lo stesso account delle tue altre app: schede e diario si sincronizzano su iPhone, iPad e Mac.</p></div>
    <form id="form-accesso">
      <input id="acc-email" type="email" autocomplete="email" placeholder="Email" required aria-label="Email">
      <input id="acc-pw" type="password" autocomplete="current-password" placeholder="Password" required aria-label="Password">
      <p class="errore" id="acc-err"></p>
      <button class="vai">Entra</button>
    </form>
    <p class="tenue">Vuoi solo guardarla? <a class="link" href="?prova">Provala con dati finti</a> (niente account, resta su questo dispositivo).</p>
  </div>`;
}

// ---------- home: riquadri da riordinare come i widget dell'iPhone ----------
// L'ordine e quali si vedono stanno in profilo.home (si sincronizza su tutti i dispositivi).
const WIDGET = {
  settimana: { nome: 'La tua settimana', desc: 'I giorni con allenamento e routine' },
  avvisi: { nome: 'Avvisi', desc: 'Kettlebell in pausa, dolore peggio di ieri' },
  prossimo: { nome: 'Prossimo allenamento', desc: 'A e B si alternano da soli' },
  altre: { nome: 'Routine e mobilità', desc: 'Le schede brevi di tutti i giorni' },
  camminate: { nome: 'Camminata dopo i pasti', desc: 'Tre spunte al giorno' },
  mattino: { nome: 'Come stai stamattina?', desc: 'Dolore 0-10 di schiena, spalla, ginocchio' },
  calorie: { nome: 'Calorie della settimana', desc: 'Stima con il metodo MET' },
  ultimo: { nome: 'Ultimo allenamento', desc: 'Quando, quanto e com\'è andata' },
  appunto: { nome: 'Appunto del giorno', desc: 'Una nota veloce, finisce nel diario' },
};
const HOME_BASE = ['settimana', 'avvisi', 'prossimo', 'altre', 'camminate', 'mattino', 'calorie'];
const ordineHome = () => (profilo().home || HOME_BASE).filter(w => WIDGET[w]);
function vistaHome() {
  const p = profilo(), g = giorno(), sett = settimana(), sed = sedute();
  const corrente = D.leggi('corrente'), inCorso = corrente && D.leggi('seduta:' + corrente) && !D.leggi('seduta:' + corrente).fine ? D.leggi('seduta:' + corrente) : null;
  const prossima = prossimoAllenamento(), routine = scheda('routine'), mob = scheda('mob');
  const eroe = (sc, etichetta, bottone) => {
    // in copertina l'esercizio principale (il primo della forza, A1), altrimenti il primo con un disegno
    const fig = sc.esercizi.find(e => !inPausa(e) && e.codice && haDisegno(e.posa)) || sc.esercizi.find(e => !inPausa(e) && haDisegno(e.posa)) || sc.esercizi.find(e => haDisegno(e.posa)) || sc.esercizi[0];
    const n = sc.esercizi.filter(e => !inPausa(e)).length, min = sc.minuti || 30;
    const k = kcal(min, MET[sc.tipo] || 3);
    return `<article class="eroe">
      <div class="tela">${figura(fig?.posa, 1, fig?.att)}<span class="etichetta">${etichetta}</span>${sc.lettera ? `<span class="lettera" style="color:${coloreScheda(sc)}">${sc.lettera}</span>` : ''}</div>
      <div class="dentro"><div><h2>${esc(sc.nome)}</h2>${sc.tipo === 'allenamento' ? `<div class="tenue">${ultimaDi(sc)}</div>` : ''}</div>
        <div class="righe"><span class="pillola">${n} esercizi</span><span class="pillola">≈ ${min}'</span>${k ? `<span class="pillola kcal">≈ ${Math.round(k * .85 / 10) * 10}-${Math.round(k * 1.15 / 10) * 10} kcal</span>` : `<button class="pillola kcal" data-a="profilo">Calorie: aggiungi il peso</button>`}</div>
        ${bottone}</div></article>`;
  };
  const W = {
    settimana() {
      const fatti = new Map();
      for (const s of sed) { const d = dataISO(new Date(s.inizio)); if (!fatti.has(d)) fatti.set(d, new Set()); fatti.get(d).add(s.tipo); }
      const nAll = sett.filter(d => fatti.get(d)?.has('allenamento')).length;
      return `<div class="settimana" aria-label="La tua settimana">${sett.map((d, k) => {
        const t = fatti.get(d), all = t?.has('allenamento'), rout = t?.has('routine') || t?.has('mobilita') || giorno(d).routine;
        return `<div class="giorno${all ? ' all' : rout ? ' rout' : ''}${d === oggi() ? ' oggi' : ''}"><i>${all ? ICO.check : ''}</i>${'LMMGVSD'[k]}</div>`;
      }).join('')}</div>
        <div class="legenda" style="margin-top:8px"><span><b style="background:var(--A)"></b>Allenamenti ${nAll} di ${obiettivo()}</span><span><b style="background:var(--Q)"></b>Routine o mobilità</span></div>`;
    },
    avvisi() {
      const peggio = peggioDiIeri();
      let h = '';
      if (peggio.length) h += `<div class="avviso-dolore">${ICO.lucchetto}<div><b>${peggio.map(z => z[0].toUpperCase() + z.slice(1)).join(' e ')} peggio di ieri</b>Oggi niente aumenti di carico. Se resta così, sentilo dal fisioterapista.</div></div>`;
      for (const [att, v] of Object.entries(pauseAttive())) h += `<button class="fisio" data-a="profilo" style="text-align:left">${ICO.lucchetto}<div><b>${ATTREZZI[att]?.nome || att} in pausa${v.fino ? ` fino al ${new Date(v.fino).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}` : ''}</b>${esc(v.motivo || 'Gli esercizi con questo attrezzo hanno il lucchetto.')} Si cambia dal profilo.</div></button>`;
      return h ? `<div style="display:grid;gap:10px">${h}</div>` : (V.modHome ? '<p class="tenue" style="margin:0">Nessun avviso, per ora.</p>' : '');
    },
    prossimo() {
      if (inCorso) return eroe({ ...scheda(inCorso.scheda), nome: inCorso.nome }, 'In corso', `<button class="vai" data-a="riprendi">Riprendi ${ICO.freccia}</button>`);
      if (quasiTuttoInPausa(prossima) && routine) return `<div style="display:grid;gap:10px">${eroe(routine, 'Oggi', `<button class="vai" data-a="inizia" data-id="routine">Inizia ${ICO.freccia}</button>`)}
        ${prossima ? `<div class="attesa"><div class="tela">${figura(prossima.esercizi.find(e => haDisegno(e.posa))?.posa)}</div>
          <div class="t"><b>${esc(prossima.nome)}</b>Senza gli esercizi in pausa</div><button class="bottoncino" data-a="inizia" data-id="${prossima.id}">Fallo</button></div>` : ''}</div>`;
      return prossima ? eroe(prossima, 'Prossimo', `<button class="vai" data-a="inizia" data-id="${prossima.id}">Inizia ${ICO.freccia}</button>`) : '';
    },
    altre() {
      const mini = [quasiTuttoInPausa(prossima) && !inCorso ? null : routine, mob].filter(Boolean);
      return mini.length ? `<div class="coppia">${mini.map(sc => { const f = sc.esercizi.find(e => haDisegno(e.posa)) || sc.esercizi[0];
        return `<button class="mini" data-a="inizia" data-id="${sc.id}"><div class="tela">${figura(f?.posa, 1, f?.att)}</div><div class="dentro"><b style="--c:${coloreScheda(sc)}">${esc(sc.nome === 'Routine quotidiana' ? 'Routine' : sc.nome)}</b><span class="tenue">${sc.esercizi.length} esercizi · ${sc.minuti}'</span></div></button>`; }).join('')}</div>` : '';
    },
    camminate() {
      const c = g.camminate || {};
      return `<section class="riquadro"><div class="su"><h3>Camminata dopo i pasti</h3><span class="tenue">10' ciascuna</span></div>
        <div class="pasti">${['colazione', 'pranzo', 'cena'].map(m => `<button class="pasto" data-a="pasto" data-m="${m}" aria-pressed="${!!c[m]}">${ICO.check}${m[0].toUpperCase() + m.slice(1)}</button>`).join('')}</div></section>`;
    },
    mattino() {
      const m = g.mattino || {}, aperta = V.zona;
      const ZONE = [['schiena', 'Schiena'], ['spalla', 'Spalla dx'], ['ginocchio', 'Ginocchio']];
      return `<section class="riquadro"><div class="su"><h3>Come stai stamattina?</h3><span class="tenue">dolore 0-10</span></div>
        <div class="zone">${ZONE.map(([z, n]) =>
          `<button class="zona${aperta === z ? ' aperta' : ''}" data-a="zona" data-z="${z}" aria-expanded="${aperta === z}" style="--c:${m[z] == null ? 'var(--linea)' : coloreDolore(m[z])}"><span>${n}</span><b class="num">${m[z] ?? '–'}</b></button>`).join('')}</div>
        ${aperta ? `<div class="voto"><span class="et">${ZONE.find(x => x[0] === aperta)[1]}: quanto fa male?</span><div class="dolore">${Array.from({ length: 11 }, (_, n) =>
          `<button style="--c:${coloreDolore(n)}" data-a="zona-val" data-z="${aperta}" data-n="${n}" aria-pressed="${m[aperta] === n}">${n}</button>`).join('')}</div></div>` : ''}</section>`;
    },
    calorie() {
      const kcs = kcalSettimana();
      return `<section class="riquadro"><div class="kcal-sett"><h3>Questa settimana</h3>${kcs != null ? `<b>≈ ${kcs.toLocaleString('it-IT')} kcal</b>` : `<button class="link" data-a="profilo">aggiungi il peso</button>`}</div>
        <span class="tenue">Allenamenti, routine e camminate. Stima col metodo MET (±30%).</span></section>`;
    },
    ultimo() {
      const s = sed[0];
      if (!s) return `<section class="riquadro"><h3>Ultimo allenamento</h3><span class="tenue">Ancora nessuno: il primo ti aspetta.</span></section>`;
      const dol = Math.max(-1, ...s.esercizi.map(e => e.dolore ?? -1)), serie = s.esercizi.reduce((n, e) => n + e.sets.filter(z => z.fatta).length, 0);
      return `<button class="voce-diario" data-a="dettaglio" data-id="${s.id}"><span class="lett" style="--c:${coloreScheda(s)}">${esc(s.lettera || s.nome[0])}</span>
        <span class="t"><span class="occhiello">Ultimo allenamento</span><b>${esc(s.nome)}</b>${esc(dataBella(s.inizio))} · ${s.minuti}' · ${serie} serie</span>
        ${dol >= 0 ? `<span class="pallino" style="--c:${coloreDolore(dol)}" title="Dolore massimo ${dol}"></span>` : ''}</button>`;
    },
    appunto() {
      return `<section class="riquadro"><div class="su"><h3>Appunto del giorno</h3><span class="tenue">si salva da solo</span></div>
        <textarea class="nota" data-campo-giorno="appunto" placeholder="Com'è andata oggi, cosa ricordare…">${esc(g.appunto || '')}</textarea></section>`;
    },
  };
  const ordine = ordineHome();
  let h = `<div class="testa"><div><div class="occhiello">${esc(dataBella(Date.now()))}</div><h1>Oggi</h1></div>
      <div style="display:flex;gap:8px;align-items:center"><span class="rete" id="rete"></span>${V.modHome
        ? `<button class="vai" data-a="home-fine" style="width:auto;height:40px;padding:0 18px;font-size:15px;border-radius:12px">Fine</button>`
        : `<button class="tondo" data-a="profilo" aria-label="Profilo">${ICO.persona}</button>`}</div></div>`;
  if (V.modHome) h += `<p class="tenue" style="margin:0">Tieni premuto un riquadro e trascinalo dove vuoi: la pagina scorre da sola quando arrivi in fondo. Il − lo toglie.</p>`;
  h += `<div class="widgets${V.modHome ? ' modifica-home' : ''}" id="widgets">${ordine.map(w => {
    const dentro = W[w]();
    if (!dentro && !V.modHome) return '';
    return `<div class="widget" data-w="${w}">${V.modHome ? `<button class="w-togli" data-a="w-togli" data-w="${w}" aria-label="Togli ${WIDGET[w].nome}">${ICO.meno}</button>
      <span class="w-man" aria-label="Trascina ${WIDGET[w].nome}">${ICO.maniglia}</span>` : ''}${dentro || `<p class="tenue" style="margin:0">${WIDGET[w].nome}</p>`}</div>`;
  }).join('')}</div>`;
  if (V.modHome) {
    const mancanti = Object.keys(WIDGET).filter(w => !ordine.includes(w));
    h += `<section class="riquadro"><h3>Aggiungi un riquadro</h3>${mancanti.length ? mancanti.map(w => `<button class="w-agg" data-a="w-aggiungi" data-w="${w}">
        <span class="piu">${ICO.piu}</span><span class="t"><b>${WIDGET[w].nome}</b>${WIDGET[w].desc}</span></button>`).join('')
      : '<span class="tenue">Ci sono già tutti.</span>'}
      <button class="link" data-a="w-reset" style="justify-self:start">Torna all'ordine iniziale</button></section>`;
  } else h += `<button class="aggiungi" data-a="home-modifica">${ICO.matita}Personalizza questa pagina</button>`;
  return `<div class="corpo">${h}</div>${tabBar('home')}`;
}
const salvaOrdineHome = ordine => D.scrivi('profilo', { ...profilo(), home: ordine });
// ---------- trascinare come sull'iPhone ----------
// L'elemento si solleva e segue il dito, al suo posto resta un segnaposto tratteggiato, gli altri scorrono
// con un'animazione per fargli spazio e, vicino ai bordi, la pagina scorre da sola (così si arriva ovunque).
// Usato per i riquadri di Oggi e per gli esercizi nelle Schede.
let DR = null;
function iniziaTrascino(el, y, fine) {
  const lista = el.parentElement, scroller = el.closest('.corpo'), r = el.getBoundingClientRect();
  const posto = document.createElement('div');
  posto.className = 'segnaposto'; posto.style.height = r.height + 'px';
  posto.innerHTML = `<span>${el.classList.contains('widget') ? 'Lascia qui' : ''}</span>`;
  lista.insertBefore(posto, el);
  Object.assign(el.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', margin: '0', zIndex: '60' });
  el.classList.add('sollevato');
  DR = { el, lista, scroller, posto, dy: y - r.top, y, fine, raf: 0 };
  DR.raf = requestAnimationFrame(autoScorri);
  navigator.vibrate?.(10);
}
function piazza() {
  const { lista, posto, el, y } = DR;
  const altri = [...lista.children].filter(c => c !== posto && c !== el);
  const dopo = altri.find(c => { const b = c.getBoundingClientRect(); return y < b.top + b.height / 2; }) || null;
  let ora = posto.nextElementSibling; if (ora === el) ora = ora.nextElementSibling;
  if (ora === dopo) return;
  // FLIP: ricordo dove sono, sposto il segnaposto, li faccio scivolare dalla vecchia alla nuova posizione
  const prima = new Map(altri.map(c => [c, c.getBoundingClientRect().top]));
  lista.insertBefore(posto, dopo);
  for (const c of altri) {
    const d = prima.get(c) - c.getBoundingClientRect().top; if (!d) continue;
    c.style.transition = 'none'; c.style.translate = `0 ${d}px`;
    requestAnimationFrame(() => requestAnimationFrame(() => { c.style.transition = 'translate .25s cubic-bezier(.2,.8,.2,1)'; c.style.translate = '0 0'; }));
  }
  navigator.vibrate?.(4);
}
function autoScorri() {
  if (!DR) return;
  const b = DR.scroller.getBoundingClientRect(), bordo = 80;
  let v = 0;
  if (DR.y < b.top + bordo) v = -(b.top + bordo - DR.y) / 4;
  else if (DR.y > b.bottom - bordo) v = (DR.y - (b.bottom - bordo)) / 4;
  if (v) {
    const prima = DR.scroller.scrollTop;
    DR.scroller.scrollTop += Math.max(-18, Math.min(18, v));
    if (DR.scroller.scrollTop !== prima) piazza();
  }
  DR.raf = requestAnimationFrame(autoScorri);
}
function finisciTrascino() {
  const { el, posto, lista, fine, raf } = DR; DR = null;
  cancelAnimationFrame(raf);
  const b = posto.getBoundingClientRect();
  el.classList.add('atterra'); el.style.top = b.top + 'px'; el.style.left = b.left + 'px';
  setTimeout(() => {
    lista.insertBefore(el, posto); posto.remove();
    el.removeAttribute('style'); el.classList.remove('sollevato', 'atterra');
    for (const c of lista.children) { c.style.translate = ''; c.style.transition = ''; }
    fine();
  }, 220);
}
document.addEventListener('pointermove', ev => { if (!DR) return; ev.preventDefault(); DR.y = ev.clientY; DR.el.style.top = (ev.clientY - DR.dy) + 'px'; piazza(); });
document.addEventListener('pointerup', () => { if (DR) finisciTrascino(); });
document.addEventListener('pointercancel', () => { if (DR) finisciTrascino(); });
// mentre trascini, il dito non deve far scorrere la pagina (su iPhone serve bloccare touchmove)
document.addEventListener('touchmove', ev => { if (DR || attesa?.armato) ev.preventDefault(); }, { passive: false });

// riquadri di Oggi: tieni premuto (0,45 s) → entri in modifica e continui a trascinare senza staccare il dito.
// In modifica: dai puntini parte subito, dal resto del riquadro dopo una breve pressione (un tocco veloce fa scorrere la pagina).
let attesa = null;
app.addEventListener('pointerdown', ev => {
  if (V.vista !== 'home' || DR) return;
  const w = ev.target.closest('#widgets .widget'); if (!w || ev.target.closest('input, textarea, .w-togli')) return;
  const id = w.dataset.w, y = ev.clientY;
  if (V.modHome && ev.target.closest('.w-man')) { ev.preventDefault(); iniziaTrascino(w, y, salvaWidget); return; }
  attesa = { x: ev.clientX, y0: y, y, armato: false, t: setTimeout(() => {
    attesa.armato = true; sopprimi = true;
    if (!V.modHome) { V.modHome = true; disegna(); }
    const nuovo = $(`#widgets .widget[data-w="${id}"]`);
    if (nuovo) iniziaTrascino(nuovo, attesa.y, salvaWidget);
    attesa = null;
  }, V.modHome ? 180 : 450) };
});
app.addEventListener('pointermove', ev => {
  if (!attesa) return;
  attesa.y = ev.clientY;
  if (Math.hypot(ev.clientX - attesa.x, ev.clientY - attesa.y0) > 8) { clearTimeout(attesa.t); attesa = null; }   // stai scorrendo
});
['pointerup', 'pointercancel'].forEach(t => app.addEventListener(t, () => { if (attesa) { clearTimeout(attesa.t); attesa = null; } }));
app.addEventListener('contextmenu', ev => { if (V.vista === 'home' && ev.target.closest('.widget')) ev.preventDefault(); });
function salvaWidget() {
  const ordine = $$('#widgets .widget').map(w => w.dataset.w);
  if (ordine.join() !== ordineHome().join()) salvaOrdineHome(ordine);
}
function ultimaDi(sc) {
  const s = sedute().find(s => s.tipo === 'allenamento');
  if (!s) return 'Il primo allenamento: buon inizio.';
  const giorni = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(s.inizio).setHours(0, 0, 0, 0)) / 864e5);
  return `Ultimo: ${esc(s.lettera || s.nome)}, ${giorni === 0 ? 'oggi' : giorni === 1 ? 'ieri' : dataBella(s.inizio).split(' ')[0]}.`;
}

// ---------- seduta: tutto da qui ----------
function vistaSeduta() {
  if (!S) return vistaHome();
  let h = V.dritta && !localeLeggi('dritta') ? `<div class="dritta"><span>Spunta ✓ a ogni serie: parte il recupero. Scorri una serie a sinistra per toglierla.</span><button data-a="dritta">Ok</button></div>` : '';
  for (const x of S.extra.filter(x => x.prima)) h += gruppoHTML(x);
  let blocco = '';
  ES().forEach((e, i) => {
    if (e.blocco !== blocco) { if (blocco) h += '</div>'; blocco = e.blocco; h += `<div class="blocco"><div class="occhiello"><span>${esc(blocco || 'Esercizi')}</span>${ES().some(x => x.blocco === blocco && x.coppia) ? '<span>a coppie</span>' : ''}</div>`; }
    h += cardHTML(e, i);
  });
  if (blocco) h += '</div>';
  for (const x of S.extra.filter(x => !x.prima)) h += gruppoHTML(x);
  h += `<button class="aggiungi" data-a="libreria" data-modo="oggi">${ICO.piu}Aggiungi un esercizio a oggi</button>
    <div class="campo"><label for="sed-appunti">Appunti della seduta</label><textarea class="nota" id="sed-appunti" data-campo-seduta="appunti" placeholder="Come ti sei sentito, cosa cambiare la prossima volta…">${esc(S.appunti)}</textarea></div>`;
  return `${barra(`${esc(S.nome)}<small id="sed-info">${infoSeduta()}</small>`, undefined, `<button class="tasto" data-a="guidata" aria-label="Modalità a schermo intero">${ICO.intero}</button>`)}
    <div class="corpo">${h}</div>
    <div class="piede-sed"><div class="timer-bar" id="sed-timer" hidden>
        <div class="riga-t"><div class="testi"><span id="st-testo"></span><b id="st-sotto"></b></div><span class="n" id="st-n"></span></div>
        <div class="linea-t"><i id="st-riemp"></i></div><div class="com" id="st-com"></div></div>
      <button class="vai" id="sed-fine" data-a="termina">Termina allenamento</button></div>`;
}
function infoSeduta() {
  if (!S) return '';
  const min = (Date.now() - S.inizio) / 60000, k = kcal(min, MET[S.tipo] || 3);
  return `${mmss(min * 60)}${k != null ? ` · ≈ ${k} kcal` : ''}`;
}
setInterval(() => { const el = $('#sed-info'); if (el) el.textContent = infoSeduta(); }, 1000);
function gruppoHTML(x) {
  const fatti = x.voci.filter(v => v.fatto).length, tutto = fatti === x.voci.length;
  return `<details class="gruppo"${tutto ? '' : ' open'}><summary><span class="stato${tutto ? ' fatto' : ''}">${tutto ? ICO.check : ''}</span>
      <span class="c-nome"><b>${esc(x.nome)}</b><span class="tenue">${fatti}/${x.voci.length} · ${x.minuti}'</span></span>${ICO.giu}</summary>
    <div class="spunte">${x.voci.map((v, k) => `<button class="spunta${inPausa(v) ? ' in-pausa' : ''}" data-a="spunta" data-g="${x.id}" data-k="${k}" aria-pressed="${v.fatto}">
      <span class="tela">${figura(v.posa, 1, v.att)}</span><span class="nome"><b>${esc(v.nome)}</b>${esc(dettaglio(v))}${inPausa(v) ? ' · <span class="lucchetto">in pausa</span>' : ''}</span><span class="stato">${ICO.check}</span></button>`).join('')}</div></details>`;
}
function dettaglio(e) {
  const n = e.sets ? e.sets.length : e.serie;
  const rip = e.tipo === 'tempo' ? `${e.sec}"` : (e.ripTesto || e.rip) + (e.unita ? ' ' + e.unita : '');
  return `${n > 1 ? n + ' × ' : ''}${rip}${e.lato ? '/lato' : ''}` + (e.kg ? ` · ${e.kg} kg` : '');
}
function cardHTML(e, i) {
  if (e.pausa) return `<article class="card in-pausa" id="c-${i}"><div class="c-testa"><div class="tela">${figura(e.posa, 1, e.att)}</div>
      <div class="c-nome"><b>${e.codice ? `<span class="codice">${e.codice}</span>` : ''}${esc(e.nome)}</b><span class="lucchetto">${ICO.lucchetto}In pausa</span></div>
      <button class="bottoncino" data-a="sblocca" data-i="${i}">Fallo oggi</button></div></article>`;
  const fatte = e.sets.filter(s => s.fatta).length, finito = fatte === e.sets.length && fatte > 0;
  const px = prossimo(), c = partner(e), tempo = e.tipo === 'tempo', prima = ultimaVolta(e, S.id), sg = !finito && suggerimento(e, S.id);
  const sotto = finito ? '<span class="fatto-tag">Fatto</span>' : `${fatte}/${e.sets.length} serie · rec. ${e.rec}"${c >= 0 ? ' · con ' + ES()[c].codice : ''}`;
  let h = `<article class="card${px && px.i === i ? ' attiva' : ''}" id="c-${i}">
    <div class="c-testa"><button class="tela" data-a="apri-es" data-i="${i}" aria-label="Apri a schermo intero">${figura(e.posa, 1, e.att)}</button>
      <button class="c-nome" data-a="apri-es" data-i="${i}"><b>${e.codice ? `<span class="codice">${e.codice}</span>` : ''}${esc(e.nome)}</b><span>${sotto}</span></button>
      <button class="tasto piccolo" data-a="menu-es" data-i="${i}" aria-label="Altre azioni">${ICO.puntini}</button></div>`;
  if (sg && !e.suggUsato) h += `<div class="consiglio"><div><b>Pronto a salire</b>2 sedute pulite di fila, dolore massimo 3</div><button data-a="sugg" data-i="${i}">${sg.kg ? `Usa ${sg.kg} kg` : `${sg.rip} ripetizioni`}</button></div>`;
  if (prima?.nota) h += `<p class="nota-prima">Nota della volta scorsa: <b>${esc(prima.nota)}</b></p>`;
  h += `<div class="set-intesta"><span>#</span><span>Prima</span><span>${e.kg != null ? 'kg' : ''}</span><span>${tempo ? 'sec' : (e.unita || 'rip')}${e.lato ? '/l' : ''}</span><span></span></div>`;
  e.sets.forEach((s, j) => {
    const p = px && px.i === i && px.j === j, z = prima?.sets[j];
    const pr = z ? (tempo ? `${z.sec}"` : z.kg ? `${z.kg} × ${z.rip}` : `${z.rip}`) : '–';
    h += `<div class="set-wrap" data-swipe="set" data-i="${i}" data-j="${j}"><div class="set-del">Elimina</div>
      <div class="set${s.fatta ? ' f' : ''}${p ? ' p' : ''}"><span class="n">${j + 1}</span><span class="pr">${pr}</span>
      ${e.kg != null ? `<input class="in" inputmode="decimal" data-campo="kg" data-i="${i}" data-j="${j}" value="${s.kg ?? ''}" aria-label="Chili serie ${j + 1}">` : '<span class="pr c">—</span>'}
      <input class="in" inputmode="numeric" data-campo="${tempo ? 'sec' : 'rip'}" data-i="${i}" data-j="${j}" value="${(tempo ? s.sec : s.rip) ?? ''}" aria-label="${tempo ? 'Secondi' : 'Ripetizioni'} serie ${j + 1}">
      ${tempo && !s.fatta ? `<button class="ok" data-a="tempo" data-i="${i}" data-j="${j}" aria-label="Avvia il timer">${ICO.play}</button>`
                         : `<button class="ok" data-a="ok" data-i="${i}" data-j="${j}" aria-pressed="${s.fatta}" aria-label="Serie fatta">${ICO.check}</button>`}
      </div></div>`;
  });
  if (finito) h += votoHTML(e, i);
  h += `<div class="c-piede"><button class="bottoncino" data-a="piu-serie" data-i="${i}">${ICO.piu}Serie</button>
    <button class="bottoncino" data-a="nota" data-i="${i}">${ICO.nota}Nota</button>
    <button class="bottoncino" data-a="storico" data-i="${i}">${ICO.grafico}Storico</button></div>`;
  if (e.notaAperta || e.nota) h += `<textarea class="nota" data-campo-nota="${i}" placeholder="Appunto su questo esercizio (oggi)">${esc(e.nota)}</textarea>`;
  return h + '</article>';
}
function votoHTML(e, i) {
  return `<div class="voto"><span class="et">Dolore durante</span><div class="dolore">${Array.from({ length: 11 }, (_, n) =>
    `<button style="--c:${coloreDolore(n)}" data-a="dolore" data-i="${i}" data-n="${n}" aria-pressed="${e.dolore === n}">${n}</button>`).join('')}</div>
    <span class="et">Quante ne avevi ancora</span><div class="riserva">${[['0-1', 'al limite'], ['2-3', 'giusto'], ['4+', 'facile']].map(([a, b]) =>
    `<button data-a="riserva" data-i="${i}" data-r="${a}" aria-pressed="${e.riserva === a}"><b>${a}</b>${b}</button>`).join('')}</div></div>`;
}
function completaSet(i, j) {
  const e = ES()[i]; if (!e || !e.sets[j]) return;
  e.sets[j].fatta = true; sbloccaSuono(); bip(880, .08);
  let dopo = null;
  const c = partner(e);
  if (c >= 0 && primoLibero(ES()[c]) >= 0) dopo = { i: c, j: primoLibero(ES()[c]) };
  else if (primoLibero(e) >= 0) dopo = { i, j: primoLibero(e) };
  else { const x = attivi().find(x => x.i > i && primoLibero(x.e) >= 0); if (x) dopo = { i: x.i, j: primoLibero(x.e) }; }
  V.prox = dopo;
  salvaSeduta(); disegna();
  if (dopo && e.rec > 0) {
    const d = ES()[dopo.i];
    avviaTimer({ tipo: 'rec', resto: e.rec, testo: 'Recupero', sotto: `${d.codice ? d.codice + ' · ' : ''}${esc(d.nome)}, serie ${dopo.j + 1}`,
      fine: () => { if (V.vista === 'esercizio') { V.cur = dopo.i; disegna(); } } });
  }
  if (dopo && V.vista === 'seduta') setTimeout(() => $('#c-' + dopo.i)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60);
}
function menuEsercizio(i) {
  const e = ES()[i];
  apriMenu(`<b>${esc(e.nome)}</b>`, [
    { testo: 'Schermo intero', ico: ICO.intero, fn: () => vai('esercizio', { cur: i }) },
    { testo: 'Sostituisci con un altro', ico: ICO.scambia, fn: () => apriLibreria('sostituisci', i) },
    ...(i > 0 ? [{ testo: 'Sposta su', ico: ICO.su, fn: () => spostaInSeduta(i, -1) }] : []),
    ...(i < ES().length - 1 ? [{ testo: 'Sposta giù', ico: ICO.giuF, fn: () => spostaInSeduta(i, 1) }] : []),
    ...(e.id && scheda(S.scheda)?.esercizi.some(x => x.id === e.id) ? [{ testo: 'Cambia nella scheda (serie, recupero, note…)', ico: ICO.matita, fn: () => apriModifica(S.scheda, e.id) }] : []),
    { testo: 'Mettilo in pausa per oggi', ico: ICO.lucchetto, fn: () => { e.pausa = true; salvaSeduta(); disegna(); avviso('In pausa per oggi', annullaUltima); } },
    { testo: 'Togli da oggi', ico: ICO.cestino, cls: 'rosso', fn: () => { S.esercizi.splice(i, 1); S.cambiato = true; salvaSeduta(); disegna(); avviso('Tolto da oggi', annullaUltima); } },
  ]);
}
function spostaInSeduta(i, d) {
  const [x] = S.esercizi.splice(i, 1), vicino = S.esercizi[i + d - (d > 0 ? 1 : 0)];
  if (vicino) x.blocco = vicino.blocco;
  S.esercizi.splice(i + d, 0, x); salvaSeduta(); disegna();
  setTimeout(() => $('#c-' + (i + d))?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 30);
}
function termina() {
  const min = Math.max(1, Math.round((Date.now() - S.inizio) / 60000));
  const chiudi = aggiorna => {
    fermaTimer();
    S.fine = Date.now(); S.minuti = min; S.kcal = kcal(min, MET[S.tipo] || 3);
    if (aggiorna) aggiornaScheda();
    salvaSeduta(); D.scrivi('corrente', null);
    if (S.tipo === 'routine' || S.tipo === 'mobilita') { const g = giorno(); D.scrivi('giorno:' + oggi(), { ...g, routine: true }); }
    const k = S.kcal; S = null; vai('home');
    avviso(`Salvato nel diario: ${min}'${k != null ? ` · ≈ ${k} kcal` : ''}`);
  };
  const nulla = !ES().some(e => e.sets.some(s => s.fatta)) && !S.extra.some(x => x.voci.some(v => v.fatto));
  if (nulla) return apriMenu('Non hai segnato niente. Cosa faccio?', [
    { testo: 'Elimina questo allenamento', cls: 'rosso', fn: () => { fermaTimer(); D.scrivi('seduta:' + S.id, null); D.scrivi('corrente', null); S = null; vai('home'); avviso('Eliminato', annullaUltima); } },
    { testo: 'Salvalo lo stesso', fn: () => chiudi(false) }]);
  if (S.cambiato) apriMenu('Oggi hai cambiato carichi o serie. Li tengo anche per la prossima volta?', [
    { testo: 'Sì, aggiorna la scheda', cls: 'forte', fn: () => chiudi(true) }, { testo: 'No, valeva solo per oggi', fn: () => chiudi(false) }]);
  else chiudi(false);
}
function aggiornaScheda() {
  const sc = clona(scheda(S.scheda)); if (!sc) return;
  for (const e of ES()) {
    const t = sc.esercizi.find(x => x.id === e.id); if (!t || !e.sets.length) continue;
    const ult = e.sets[e.sets.length - 1];
    t.serie = e.sets.length;
    if (t.kg != null && ult.kg != null) t.kg = ult.kg;
    if (e.tipo === 'tempo') t.sec = ult.sec; else if (!t.ripTesto) t.rip = ult.rip;
  }
  D.scrivi('scheda:' + sc.id, sc);
}

// ---------- esercizio a schermo intero (stessi dati dell'elenco) ----------
function vistaEsercizio() {
  const lista = attivi();
  if (!S || !lista.length) return vistaSeduta();
  if (!lista.some(x => x.i === V.cur)) V.cur = lista[0].i;
  const pos = lista.findIndex(x => x.i === V.cur), e = ES()[V.cur], j = primoLibero(e), finito = j < 0, s = e.sets[j] || {};
  const c = partner(e), un = e.tipo === 'tempo' ? '"' : (e.unita ? ' ' + e.unita : ''), prima = ultimaVolta(e, S.id), sg = !finito && suggerimento(e, S.id);
  const a = ATTREZZI[e.att];
  let h = `<div class="tela" id="es-tela">${figura(e.posa, 1, e.att)}
      ${c >= 0 ? `<span class="coppia-tag">${e.codice} in coppia con ${ES()[c].codice}</span>` : ''}
      ${e.video ? `<a class="video" href="${esc(e.video)}" target="_blank" rel="noopener">${ICO.play}Video</a>` : ''}</div>
    <div class="es-nome"><div class="occhiello">${esc(e.blocco || '')}${e.codice ? ' · ' + e.codice : ''}</div><h2>${esc(e.nome)}</h2></div>
    <div class="chips">${a && e.att !== 'cl' ? `<span class="chip att" style="--c:var(${a.col})">${a.nome}</span>` : ''}<span class="chip">${e.sets.length} × ${e.tipo === 'tempo' ? e.sec + '"' : (e.ripTesto || e.rip) + un}${e.lato ? '<small>per lato</small>' : ''}</span>
      ${e.kg != null ? `<span class="chip">${s.kg ?? e.kg} kg</span>` : ''}<span class="chip">${e.rec}"<small>recupero</small></span></div>`;
  if (sg && !e.suggUsato) h += `<div class="consiglio"><div><b>Pronto a salire</b>2 sedute pulite di fila, dolore massimo 3</div><button data-a="sugg" data-i="${V.cur}">${sg.kg ? `Usa ${sg.kg} kg` : `${sg.rip} ripetizioni`}</button></div>`;
  h += `<div class="serie">${e.sets.map((x, k) => `<div class="${x.fatta ? 'f' : k === j ? 'c' : ''}">Serie ${k + 1}<b>${x.fatta ? 'fatta' : e.tipo === 'tempo' ? x.sec + '"' : x.rip + un}</b></div>`).join('')}</div>`;
  if (finito) h += votoHTML(e, V.cur);
  else if (e.tipo !== 'tempo') h += `<div class="passo">
      ${e.kg != null ? `<div><button data-a="passo" data-k="kg" data-d="-2" aria-label="Meno carico">${ICO.meno}</button><span class="val"><b>${s.kg}</b><span>kg</span></span><button data-a="passo" data-k="kg" data-d="2" aria-label="Più carico">${ICO.piu}</button></div>`
           : `<div style="justify-content:center"><span class="val"><b style="font-size:16px">Corpo libero</b><span>niente carico</span></span></div>`}
      <div><button data-a="passo" data-k="rip" data-d="-1" aria-label="Meno ripetizioni">${ICO.meno}</button><span class="val"><b>${s.rip}</b><span>${e.unita || 'ripetizioni'}</span></span><button data-a="passo" data-k="rip" data-d="1" aria-label="Più ripetizioni">${ICO.piu}</button></div></div>`;
  const pz = prima?.sets[Math.max(0, j)];
  h += `<div class="prima"><span>La volta scorsa</span><b>${pz ? (e.tipo === 'tempo' ? pz.sec + '"' : (pz.kg ? pz.kg + ' kg × ' : '') + pz.rip) + (prima.dolore != null ? ' · dolore ' + prima.dolore : '') : 'mai fatto'}</b></div>
    ${prima?.nota ? `<p class="nota-prima">Nota: <b>${esc(prima.nota)}</b></p>` : ''}
    ${e.come?.length ? `<details class="come"><summary>Come si fa ${ICO.giu}</summary><ul>${e.come.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>` : ''}`;
  const ultimo = pos === lista.length - 1;
  const az = finito ? (ultimo ? 'Torna all\'elenco' : `Prossimo esercizio ${ICO.freccia}`) : e.tipo === 'tempo' ? `${ICO.play} Avvia ${s.sec}"${e.lato ? ' per lato' : ''}` : `Serie ${j + 1} fatta`;
  return `<div class="barra"><button class="tasto" data-a="vai" data-v="seduta" aria-label="Torna all'elenco">${ICO.chiudi}</button>
      <div class="avanz">${lista.map(x => `<i class="${primoLibero(x.e) < 0 ? 'f' : x.i === V.cur ? 'c' : ''}"></i>`).join('')}</div>
      <span class="tenue num" style="font-weight:700">${pos + 1}/${lista.length}</span></div>
    <div class="corpo">${h}</div>
    <div class="piede"><button class="tasto" data-a="es-prec" aria-label="Esercizio precedente"${pos === 0 ? ' disabled' : ''}>${ICO.indietro}</button>
      <button class="vai${finito ? ' verde' : ''}" data-a="es-azione">${az}</button>
      <button class="tasto" data-a="es-succ" aria-label="Esercizio successivo"${ultimo ? ' disabled' : ''}>${ICO.avanti}</button></div>`;
}
function spostaEs(d) { const l = attivi(), k = l.findIndex(x => x.i === V.cur) + d; if (l[k]) { V.cur = l[k].i; disegna(true); } }
// la figura si muove tra le due pose (3,6 s a ripetizione), solo a schermo intero
const senzaMoto = matchMedia('(prefers-reduced-motion: reduce)').matches;
function anima(ms) {
  const svg = !senzaMoto && V.vista === 'esercizio' && $('#es-tela svg.fig');
  const e = svg && ES()[V.cur];
  if (e && haDisegno(e.posa)) { const f = (ms % 3600) / 3600; svg.outerHTML = figura(e.posa, (1 - Math.cos(Math.min(1, f * 1.15) * 2 * Math.PI)) / 2, e.att); }
  requestAnimationFrame(anima);
}
requestAnimationFrame(anima);

// ---------- timer unico: recupero, preparazione, esercizi a tempo ----------
let T = null;
const CIRC = 2 * Math.PI * 96;
function avviaTimer(o) { fermaTimer(); T = { ...o, tot: o.resto, fineAlle: Date.now() + o.resto * 1000 }; T.int = setInterval(tick, 250); mostraTimer(); }
function tick() {
  // si basa sull'orologio: se il telefono va in pausa, al ritorno il tempo è giusto
  const resto = Math.ceil((T.fineAlle - Date.now()) / 1000);
  if (resto === T.resto) return;
  T.resto = resto;
  if (resto <= 3 && resto > 0) bip(660, .05);
  if (resto <= 0) { const f = T.fine, tipo = T.tipo; fermaTimer(); bip(1200, .25); voce(tipo); f && f(); } else mostraTimer();
}
function fermaTimer() { if (T) clearInterval(T.int); T = null; mostraTimer(); }
const comandi = () => T.tipo === 'rec' ? '<button data-t="-15">− 15"</button><button data-t="15">+ 15"</button><button class="forte" data-t="salta">Salta</button>'
                                        : '<button data-t="ferma">Ferma</button><button class="forte" data-t="salta">Fatto</button>';
function mostraTimer() {
  const bar = $('#sed-timer'), fine = $('#sed-fine');
  if (bar) {
    bar.hidden = !T; if (fine) fine.hidden = !!T;
    if (T) {
      $('#st-testo').textContent = T.testo; $('#st-sotto').innerHTML = T.sotto; $('#st-n').textContent = T.tipo === 'rec' ? mmss(T.resto) : T.resto;
      $('#st-riemp').style.width = (100 * (1 - T.resto / T.tot)) + '%';
      if ($('#st-com').dataset.tipo !== T.tipo) { $('#st-com').innerHTML = comandi(); $('#st-com').dataset.tipo = T.tipo; }
    }
  }
  const inEs = V.vista === 'esercizio';
  $('#velo').hidden = !(T && inEs);
  if (T && inEs) {
    $('#rec-tit').textContent = T.testo; $('#rec-t').textContent = T.resto; $('#rec-poi').innerHTML = (T.tipo === 'rec' ? 'Poi' : '') + `<b>${T.sotto}</b>`;
    $('#anello-fg').style.strokeDasharray = CIRC; $('#anello-fg').style.strokeDashoffset = CIRC * (1 - T.resto / T.tot);
    if ($('#rec-com').dataset.tipo !== T.tipo) { $('#rec-com').innerHTML = comandi(); $('#rec-com').dataset.tipo = T.tipo; }
  }
}
function comandoTimer(ev) {
  const b = ev.target.closest('[data-t]'); if (!b || !T) return;
  const a = b.dataset.t;
  if (a === 'salta') { const f = T.fine; fermaTimer(); f && f(); }
  else if (a === 'ferma') fermaTimer();
  else { T.fineAlle = Math.max(Date.now() + 1000, T.fineAlle + +a * 1000); T.resto = Math.ceil((T.fineAlle - Date.now()) / 1000); T.tot = Math.max(T.tot, T.resto); mostraTimer(); }
}
app.addEventListener('click', ev => { if (ev.target.closest('#st-com, #rec-com')) comandoTimer(ev); });
function avviaTempo(i, j, lato = 0) {
  const e = ES()[i], s = e.sets[j], quale = e.lato ? (lato ? ' · lato destro' : ' · lato sinistro') : '';
  avviaTimer({ tipo: 'prep', resto: 3, testo: 'Preparati', sotto: esc(e.nome) + quale,
    fine: () => avviaTimer({ tipo: 'tempo', resto: s.sec || 20, testo: 'Tieni' + quale, sotto: `${esc(e.nome)}, serie ${j + 1}`,
      fine: () => { if (e.lato && !lato) avviaTempo(i, j, 1); else completaSet(i, j); } }) });
}

// ---------- suoni, voce e schermo acceso ----------
let ctx;
function sbloccaSuono() { try { ctx ||= new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state !== 'running') ctx.resume(); } catch { /* niente audio */ } }
function bip(f, d) {
  if (!ctx) return;
  try { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f;
    g.gain.setValueAtTime(.18, ctx.currentTime); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + d);
    o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + d + .02); } catch { /* niente audio */ }
}
function voce(tipo) {
  if (!profilo().voce || !('speechSynthesis' in window)) return;
  const t = { rec: 'Recupero finito', tempo: 'Tempo', prep: '' }[tipo]; if (!t) return;
  const u = new SpeechSynthesisUtterance(t); u.lang = 'it-IT'; speechSynthesis.speak(u);
}
let wake = null;
async function schermoAcceso() { try { if (!wake || wake.released) wake = await navigator.wakeLock?.request('screen'); } catch { /* non disponibile */ } }
document.addEventListener('visibilitychange', () => { if (!document.hidden && V.vista === 'esercizio') schermoAcceso(); });

// ---------- schede ----------
function vistaSchede() {
  const tutte = schede(); if (!tutte.some(s => s.id === V.scheda)) V.scheda = tutte[0]?.id;
  const sc = scheda(V.scheda);
  const corto = s => s.lettera || ({ risc: 'Riscaldamento', routine: 'Routine', mob: 'Mobilità' }[s.id] || s.nome);
  let lista = '';
  if (sc) {
    const blocchi = [...new Set(sc.esercizi.map(e => e.blocco || ''))];
    lista = blocchi.map(b => `<div class="blocco">${b ? `<div class="occhiello"><span>${esc(b)}</span></div>` : ''}<div class="lista" style="display:grid;gap:6px">` +
      sc.esercizi.filter(e => (e.blocco || '') === b).map(e => `<div class="set-wrap riga-wrap" data-swipe="es" data-id="${e.id}"><div class="set-del">Togli</div>
        <div class="riga${inPausa(e) ? ' pausa' : ''}"><span class="maniglia" aria-label="Trascina per spostare">${ICO.maniglia}</span>
        <div class="tela">${figura(e.posa, 1, e.att)}</div>
        <button class="nome" data-a="modifica" data-id="${e.id}"><b>${e.codice ? `<span class="codice">${e.codice}</span>` : ''}${esc(e.nome)}</b>
          <span>${esc(dettaglio(e))}${e.rec ? ` · rec. ${e.rec}"` : ''}</span>${inPausa(e) ? `<span class="lucchetto">${ICO.lucchetto}In pausa${!e.pausa ? ': kettlebell' : ''}</span>` : ''}</button></div></div>`).join('') + '</div></div>').join('');
  }
  return `${barra('Le mie schede', `<button class="tasto" data-a="vai" data-v="home" aria-label="Indietro">${ICO.indietro}</button>`, `<button class="tasto" data-a="libreria" data-modo="guarda" aria-label="Libreria esercizi">${ICO.cerca}</button>`)}
    <div class="corpo">
      <div class="scelte scorre" role="group" aria-label="Scheda">${tutte.map(s => `<button data-a="scheda" data-id="${s.id}" aria-pressed="${s.id === V.scheda}">${esc(corto(s))}</button>`).join('')}
        <button data-a="scheda-imp" data-nuova="1" aria-label="Nuova scheda">${ICO.piu}</button></div>
      ${sc ? `<p class="tenue" style="margin:0">Trascina dai puntini per spostare, scorri verso sinistra per togliere, tocca per cambiare.</p>
      <div id="mod-lista" style="display:grid;gap:14px">${lista || '<p class="vuoto">Scheda vuota: aggiungi il primo esercizio.</p>'}</div>
      <button class="aggiungi" data-a="libreria" data-modo="scheda">${ICO.piu}Aggiungi dalla libreria</button>
      <button class="bottoncino" data-a="scheda-imp" style="justify-self:start">${ICO.matita}Nome e impostazioni della scheda</button>
      ${sc.tipo !== 'riscaldamento' ? `<button class="vai" data-a="inizia" data-id="${sc.id}">Allenati con ${esc(sc.nome)} ${ICO.freccia}</button>` : ''}` : ''}
    </div>${tabBar('schede')}`;
}
function scriviScheda(sc) { D.scrivi('scheda:' + sc.id, clona(sc)); }

// nome e impostazioni di una scheda (anche nuova): così l'app va bene per qualsiasi periodo e attività
const TIPI = [['allenamento', 'Allenamento'], ['routine', 'Routine'], ['mobilita', 'Mobilità'], ['riscaldamento', 'Riscaldamento'], ['altro', 'Altro']];
let SB = null;
function apriImpScheda(id) {
  const sc = id ? scheda(id) : null;
  SB = sc ? { ...clona(sc), esercizi: undefined } : { id: 'sc' + Date.now().toString(36), nome: '', tipo: 'allenamento', minuti: 45, _nuova: true };
  disegnaImpScheda();
}
function disegnaImpScheda() {
  const all = SB.tipo === 'allenamento';
  const leva = (k, titolo, testo, val) => `<div class="interruttore"><div><b>${titolo}</b>${testo}</div><button class="leva verde" role="switch" data-a="sb-leva" data-k="${k}" aria-checked="${val}" aria-label="${titolo}"></button></div>`;
  apriFoglio(`<div class="barra"><button class="tasto" data-a="chiudi-foglio" aria-label="Chiudi">${ICO.chiudi}</button><h3>${SB._nuova ? 'Nuova scheda' : 'Impostazioni scheda'}</h3>
      <button class="vai" data-a="sb-salva" style="width:auto;height:40px;padding:0 16px;font-size:15px;border-radius:12px">Salva</button></div>
    <div class="corpo">
      <div class="campo"><label for="sb-nome">Nome</label><input type="text" id="sb-nome" value="${esc(SB.nome)}" placeholder="Es. Piscina, Palestra lunedì, Programma estate"></div>
      <div class="campo"><span class="et">Che cos'è</span><div class="scelte">${TIPI.map(([v, t]) => `<button data-a="sb-tipo" data-v="${v}" aria-pressed="${SB.tipo === v}">${t}</button>`).join('')}</div></div>
      ${all ? `<div class="campo"><label for="sb-lettera">Lettera (es. A, B, C)</label><input type="text" id="sb-lettera" maxlength="2" value="${esc(SB.lettera || '')}" style="width:90px;text-transform:uppercase"></div>
        ${leva('rotazione', 'Nella rotazione', 'La Home la propone a turno con le altre schede di allenamento', SB.rotazione !== false)}` : ''}
      ${SB.tipo !== 'riscaldamento' && SB.id !== 'risc' ? leva('conRisc', 'Riscaldamento prima', 'Aggiunge la lista del riscaldamento in cima', SB.conRisc ?? all) : ''}
      ${SB.tipo !== 'mobilita' && SB.id !== 'mob' ? leva('conMob', 'Mobilità dopo', 'Aggiunge la lista della mobilità in fondo', SB.conMob ?? all) : ''}
      <div class="campo"><span class="et">Durata indicativa</span><div class="scelte">${[5, 10, 15, 30, 45, 60, 90].map(m => `<button data-a="sb-min" data-m="${m}" aria-pressed="${(SB.minuti || 45) === m}">${m}'</button>`).join('')}</div></div>
      ${SB._nuova ? '' : `<button class="elimina" data-a="sb-elimina">Elimina la scheda</button>`}
    </div>`);
}
function leggiImpScheda() { SB.nome = $('#sb-nome').value; if ($('#sb-lettera')) SB.lettera = $('#sb-lettera').value.trim().toUpperCase() || undefined; }

// trascinare gli esercizi dai puntini (stesso sistema dei riquadri di Oggi)
app.addEventListener('pointerdown', ev => {
  const m = ev.target.closest('#mod-lista .maniglia'); if (!m || DR) return;
  ev.preventDefault();
  iniziaTrascino(m.closest('.riga-wrap'), ev.clientY, () => {
    const ordine = $$('#mod-lista .riga-wrap').map(r => r.dataset.id), sc = clona(scheda(V.scheda));
    const prima = sc.esercizi.map(e => e.id).join();
    sc.esercizi.sort((a, b) => ordine.indexOf(a.id) - ordine.indexOf(b.id));
    if (sc.esercizi.map(e => e.id).join() !== prima) { scriviScheda(sc); avviso('Ordine salvato', annullaUltima); }
  });
});

// foglio di modifica di un esercizio della scheda
let F = null;
function apriModifica(idScheda, idEs, base) {
  const sc = scheda(idScheda), e = idEs ? sc.esercizi.find(x => x.id === idEs) : null;
  F = e ? { ...clona(e), _scheda: idScheda } : { id: 'e' + Date.now().toString(36), _scheda: idScheda, _nuovo: true, nome: '', att: 'cl', posa: '', blocco: sc.esercizi.at(-1)?.blocco || '', tipo: 'rip', serie: 3, rip: 10, kg: null, rec: 60, come: [], ...base };
  F._note = (F.come || []).join('\n');
  disegnaModifica();
}
function disegnaModifica() {
  const sc = scheda(F._scheda);
  const passo = (k, val, et, d) => `<div class="passo"><div><button data-a="fp" data-k="${k}" data-d="-${d}" aria-label="Meno">${ICO.meno}</button><span class="val"><b>${val}</b><span>${et}</span></span><button data-a="fp" data-k="${k}" data-d="${d}" aria-label="Più">${ICO.piu}</button></div></div>`;
  const codici = sc.esercizi.filter(x => x.id !== F.id && x.codice).map(x => x.codice);
  apriFoglio(`<div class="barra"><button class="tasto" data-a="chiudi-foglio" aria-label="Chiudi">${ICO.chiudi}</button><h3>${F._nuovo ? 'Nuovo esercizio' : 'Modifica esercizio'}</h3>
      <button class="vai" data-a="salva-mod" style="width:auto;height:40px;padding:0 16px;font-size:15px;border-radius:12px">Salva</button></div>
    <div class="corpo">
      <div class="campo"><label for="fo-nome">Nome</label><input type="text" id="fo-nome" value="${esc(F.nome)}" placeholder="Es. Stacco rumeno"></div>
      <div class="campo"><span class="et">Attrezzo</span><div class="scelte">${CATEGORIE.map(c => `<button data-a="f-att" data-c="${c}" aria-pressed="${F.att === c}">${ATTREZZI[c].nome}</button>`).join('')}</div></div>
      <div class="campo"><span class="et">Disegno</span><div class="cambia-ill"><div class="tela">${figura(F.posa, 1, F.att)}</div><button class="bottoncino" data-a="f-ill">Cambia disegno</button></div></div>
      <div class="campo"><span class="et">Si misura in</span><div class="segmenti"><button data-a="f-tipo" data-t="rip" aria-pressed="${F.tipo === 'rip'}">Ripetizioni</button><button data-a="f-tipo" data-t="tempo" aria-pressed="${F.tipo === 'tempo'}">Tempo</button></div></div>
      <div class="griglia2">${passo('serie', F.serie, 'serie', 1)}
        ${F.tipo === 'tempo' ? passo('sec', F.sec || 20, 'secondi', 5) : passo('rip', F.rip ?? 10, F.unita || 'ripetizioni', 1)}
        ${passo('kg', F.kg ?? 0, F.kg ? 'kg' : 'senza carico', 2)}${passo('rec', F.rec ?? 60, 'sec. recupero', 15)}</div>
      <div class="interruttore"><div><b>Per lato</b>Si fa prima un lato, poi l'altro</div><button class="leva verde" role="switch" data-a="f-leva" data-k="lato" aria-checked="${!!F.lato}" aria-label="Per lato"></button></div>
      <div class="campo"><label for="fo-blocco">Gruppo (es. Forza, Chiusura)</label><input type="text" id="fo-blocco" value="${esc(F.blocco || '')}"></div>
      <div class="campo"><label for="fo-codice">Sigla per le coppie (es. A1)</label><input type="text" id="fo-codice" value="${esc(F.codice || '')}" maxlength="4"></div>
      ${codici.length ? `<div class="campo"><span class="et">In coppia con (superserie)</span><div class="scelte"><button data-a="f-coppia" data-c="" aria-pressed="${!F.coppia}">Nessuno</button>${codici.map(c => `<button data-a="f-coppia" data-c="${c}" aria-pressed="${F.coppia === c}">${c}</button>`).join('')}</div></div>` : ''}
      <div class="campo"><span class="et">Quando salire</span><div class="scelte">${[['kg', '+2 kg dopo 2 sedute pulite'], ['rip', '+1 ripetizione'], ['mai', 'Lo decido io']].map(([v, t]) =>
        `<button data-a="f-prog" data-v="${v}" aria-pressed="${(F.progressione || 'kg') === v}">${t}</button>`).join('')}</div></div>
      <div class="campo"><label for="fo-note">Come si fa (una riga per indicazione)</label><textarea id="fo-note">${esc(F._note)}</textarea></div>
      <div class="campo"><label for="fo-video">Link al video</label><input type="url" id="fo-video" placeholder="https://youtube.com/…" value="${esc(F.video || '')}"></div>
      <div class="interruttore"><div><b>In pausa</b>Resta nella scheda col lucchetto, ma non te lo propone</div><button class="leva" role="switch" data-a="f-leva" data-k="pausa" aria-checked="${!!F.pausa}" aria-label="In pausa"></button></div>
      ${F._nuovo ? '' : `<button class="elimina" data-a="f-elimina">Togli dalla scheda</button>`}
    </div>`);
}
function leggiCampi() {
  if (!F) return;
  F.nome = $('#fo-nome').value; F._note = $('#fo-note').value; F.video = $('#fo-video').value.trim();
  F.blocco = $('#fo-blocco').value.trim(); F.codice = $('#fo-codice').value.trim().toUpperCase() || undefined;
}
function salvaModifica() {
  leggiCampi();
  if (!F.nome.trim()) { avviso('Scrivi il nome dell\'esercizio'); $('#fo-nome').focus(); return; }
  const { _scheda, _nuovo, _note, ...dati } = F;
  dati.come = _note.split('\n').map(s => s.trim()).filter(Boolean);
  const sc = clona(scheda(_scheda)), k = sc.esercizi.findIndex(x => x.id === dati.id);
  if (k >= 0) sc.esercizi[k] = dati; else sc.esercizi.push(dati);
  scriviScheda(sc);
  if (!dati.lib) D.scrivi('esercizio:' + dati.id, { id: dati.id, nome: dati.nome, att: dati.att, muscoli: '', posa: dati.posa, tipo: dati.tipo, lato: !!dati.lato, mio: true });
  // se l'esercizio è nella seduta di oggi, aggiorno anche lì le impostazioni (le serie già scritte restano)
  if (S && S.scheda === _scheda) {
    const x = S.esercizi.find(x => x.id === dati.id);
    if (x) { const { serie, kg, rip, sec, pausa, ...meta } = dati; Object.assign(x, meta); salvaSeduta(); }
  }
  chiudiFoglio(); F = null; disegna(); avviso(_nuovo ? 'Esercizio aggiunto' : 'Salvato', annullaUltima);
}

// ---------- libreria ----------
let L = { modo: 'scheda', i: null, filtro: 'tutti', q: '' };
function apriLibreria(modo, i) { L = { modo, i, filtro: 'tutti', q: '' }; disegnaLibreria(true); }
function disegnaLibreria(nuova) {
  const q = L.q.trim().toLowerCase();
  const voci = libreria().filter(e => (L.filtro === 'tutti' || e.att === L.filtro) && (!q || `${e.nome} ${e.muscoli} ${ATTREZZI[e.att]?.nome}`.toLowerCase().includes(q)))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
  const titolo = { sostituisci: 'Sostituisci con…', oggi: 'Aggiungi a oggi', scheda: 'Aggiungi alla scheda', guarda: 'Libreria esercizi' }[L.modo];
  const righe = voci.length ? voci.map(e => `<button class="lib-voce" data-a="lib-scegli" data-id="${esc(e.id)}"><span class="seg">${iconaAttrezzo(e.att, 22)}</span>
      <span class="nome"><b>${esc(e.nome)}</b><span>${ATTREZZI[e.att]?.nome || ''}${e.muscoli ? ' · ' + esc(e.muscoli) : ''}${e.mio ? ' · tuo' : ''}</span></span>
      ${L.modo === 'guarda' ? '' : `<span class="piu">${L.modo === 'sostituisci' ? ICO.scambia : ICO.piu}</span>`}</button>`).join('')
    : `<p class="tenue">Nessun esercizio trovato. Crealo tu qui sotto.</p>`;
  if (!nuova && $('#lib-lista')) { $('#lib-lista').innerHTML = righe; $('#lib-filtri').innerHTML = filtri(); return; }
  apriFoglio(`<div class="barra"><button class="tasto" data-a="chiudi-foglio" aria-label="Chiudi">${ICO.chiudi}</button><h3>${titolo}<small>${libreria().length} esercizi</small></h3></div>
    <div class="corpo" style="gap:10px">
      <input class="cerca" id="lib-cerca" type="search" placeholder="Cerca: squat, dorsali, elastico…" aria-label="Cerca un esercizio" value="${esc(L.q)}">
      <div class="scelte scorre" id="lib-filtri">${filtri()}</div>
      <div id="lib-lista">${righe}</div>
      ${L.modo === 'guarda' ? '' : `<button class="aggiungi" data-a="lib-nuovo">${ICO.piu}Crea un esercizio nuovo</button>`}
    </div>`, { alto: true });
  function filtri() { return ['tutti', ...CATEGORIE].map(f => `<button data-a="lib-filtro" data-f="${f}" aria-pressed="${L.filtro === f}">${f === 'tutti' ? 'Tutti' : ATTREZZI[f].nome}</button>`).join(''); }
}
function daLibreria(b) {
  const conPeso = !['cl', 'ela', 'mob', 'pis'].includes(b.att);
  return { id: 'e' + Date.now().toString(36), lib: b.id, nome: b.nome, att: b.att, posa: b.posa || '', tipo: b.tipo, lato: b.lato, serie: 3,
    rip: b.tipo === 'tempo' ? undefined : 10, sec: b.tipo === 'tempo' ? 30 : undefined, kg: conPeso ? 10 : null, rec: 60, come: [] };
}
function sceltaLibreria(id) {
  const b = libreria().find(e => e.id === id); if (!b) return;
  if (L.modo === 'guarda') return;
  const nuovo = daLibreria(b);
  chiudiFoglio();
  if (L.modo === 'sostituisci') {
    const vecchio = ES()[L.i];
    S.esercizi[L.i] = { ...nuovo, blocco: vecchio.blocco, codice: vecchio.codice, coppia: vecchio.coppia, rec: vecchio.rec,
      sets: vecchio.sets.map(s => ({ kg: nuovo.kg, rip: nuovo.rip, sec: nuovo.sec, fatta: false })), nota: '', dolore: null, riserva: null };
    S.cambiato = true; salvaSeduta(); disegna(); avviso(`Al posto di «${vecchio.nome}»`, annullaUltima);
  } else if (L.modo === 'oggi') {
    S.esercizi.push({ ...nuovo, blocco: 'Aggiunti oggi', sets: Array.from({ length: 3 }, () => ({ kg: nuovo.kg, rip: nuovo.rip, sec: nuovo.sec, fatta: false })), nota: '', dolore: null, riserva: null });
    salvaSeduta(); disegna(); avviso(`«${b.nome}» aggiunto a oggi`, annullaUltima);
    setTimeout(() => $('#c-' + (ES().length - 1))?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
  } else {
    const sc = clona(scheda(V.scheda)); nuovo.blocco = sc.esercizi.at(-1)?.blocco || ''; sc.esercizi.push(nuovo);
    scriviScheda(sc); disegna(); avviso(`«${b.nome}» aggiunto`, annullaUltima);
  }
}

// ---------- diario ----------
function vistaDiario() {
  const sed = sedute();
  let h = '', mese = '';
  for (const s of sed) {
    const d = new Date(s.inizio), m = `${MESI[d.getMonth()]} ${d.getFullYear()}`;
    if (m !== mese) { mese = m; h += `<div class="occhiello" style="margin-top:6px">${m}</div>`; }
    const dol = Math.max(-1, ...s.esercizi.map(e => e.dolore ?? -1)), serie = s.esercizi.reduce((n, e) => n + e.sets.filter(z => z.fatta).length, 0);
    h += `<button class="voce-diario" data-a="dettaglio" data-id="${s.id}"><span class="lett" style="--c:${coloreScheda(s)}">${esc(s.lettera || s.nome[0])}</span>
      <span class="t"><b>${esc(s.nome)}</b>${esc(dataBella(s.inizio))} · ${s.minuti}' · ${serie} serie${s.kcal != null ? ` · ≈ ${s.kcal} kcal` : ''}</span>
      ${dol >= 0 ? `<span class="pallino" style="--c:${coloreDolore(dol)}" title="Dolore massimo ${dol}"></span>` : ''}</button>`;
  }
  if (!h) h = `<div class="vuoto">${ICO.diario}<b>Ancora niente</b><span>Quando finisci un allenamento lo trovi qui, con carichi, dolore e note.</span></div>`;
  return `${barra('Diario')}<div class="corpo" style="gap:8px">${h}</div>${tabBar('diario')}`;
}
function vistaDettaglio() {
  const s = D.leggi('seduta:' + V.dettaglio);
  if (!s) return vistaDiario();
  let h = `<div class="tenue">${esc(dataBella(s.inizio))} · ${s.minuti}'${s.kcal != null ? ` · ≈ ${s.kcal} kcal` : ''}</div>`;
  for (const e of s.esercizi.filter(e => e.sets.some(z => z.fatta))) {
    const t = e.tipo === 'tempo';
    h += `<section class="riquadro"><div class="su"><b>${esc(e.nome)}</b>${e.dolore != null ? `<span class="tenue">dolore <b style="color:${coloreDolore(e.dolore)}">${e.dolore}</b></span>` : ''}</div>
      <table class="tabella"><tr><th>#</th>${e.kg != null ? '<th>kg</th>' : ''}<th>${t ? 'sec' : e.unita || 'rip'}</th></tr>${e.sets.filter(z => z.fatta).map((z, j) =>
        `<tr><td>${j + 1}</td>${e.kg != null ? `<td>${z.kg}</td>` : ''}<td>${t ? z.sec : z.rip}</td></tr>`).join('')}</table>
      ${e.riserva ? `<span class="tenue">In riserva: ${e.riserva}</span>` : ''}${e.nota ? `<p class="nota-prima">Nota: <b>${esc(e.nota)}</b></p>` : ''}
      <button class="bottoncino" data-a="storico-lib" data-k="${esc(chiaveEs(e))}">${ICO.grafico}Storico</button></section>`;
  }
  if (s.appunti) h += `<section class="riquadro"><b>Appunti</b><p style="margin:0">${esc(s.appunti)}</p></section>`;
  h += `<button class="elimina" data-a="elimina-seduta" data-id="${s.id}">Elimina dal diario</button>`;
  return `${barra(esc(s.nome), `<button class="tasto" data-a="vai" data-v="diario" aria-label="Indietro">${ICO.indietro}</button>`)}<div class="corpo">${h}</div>`;
}
function apriStorico(chiave, nome) {
  const righe = [];
  for (const s of sedute()) { const x = s.esercizi.find(x => chiaveEs(x) === chiave && x.sets.some(z => z.fatta)); if (x) righe.push({ s, x }); if (righe.length >= 12) break; }
  const conKg = righe.some(r => r.x.kg != null);
  const valore = r => conKg ? Math.max(...r.x.sets.filter(z => z.fatta).map(z => z.kg || 0)) : Math.max(...r.x.sets.filter(z => z.fatta).map(z => (r.x.tipo === 'tempo' ? z.sec : z.rip) || 0));
  let graf = '';
  if (righe.length > 1) {
    const pts = righe.slice().reverse().map(valore), mn = Math.min(...pts), mx = Math.max(...pts), W = 320, H = 110;
    const xy = pts.map((v, k) => [12 + k * (W - 24) / (pts.length - 1), H - 18 - (mx === mn ? .5 : (v - mn) / (mx - mn)) * (H - 36)]);
    graf = `<svg class="grafico" viewBox="0 0 ${W} ${H}" role="img" aria-label="Andamento">
      <path d="M12 ${H - 18}H${W - 12}" stroke="var(--linea)" stroke-width="1"/>
      <path d="M${xy.map(p => p.join(' ')).join(' L')}" fill="none" stroke="var(--B)" stroke-width="2.5" stroke-linejoin="round"/>
      ${xy.map((p, k) => `<circle cx="${p[0]}" cy="${p[1]}" r="${k === xy.length - 1 ? 5 : 3}" fill="var(--B)"/>`).join('')}
      <text x="${xy.at(-1)[0]}" y="${xy.at(-1)[1] - 10}" text-anchor="end" font-size="12" font-weight="700" fill="var(--inchiostro)">${pts.at(-1)}${conKg ? ' kg' : ''}</text></svg>`;
  }
  const tab = righe.length ? `<table class="tabella"><tr><th>Quando</th><th>Serie</th><th>Dolore</th></tr>${righe.map(({ s, x }) =>
    `<tr><td>${new Date(s.inizio).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</td><td>${x.sets.filter(z => z.fatta).map(z => x.tipo === 'tempo' ? z.sec + '"' : (z.kg != null ? z.kg + '×' : '') + z.rip).join(' · ')}</td>
      <td>${x.dolore != null ? `<b style="color:${coloreDolore(x.dolore)}">${x.dolore}</b>` : '–'}</td></tr>`).join('')}</table>`
    : '<p class="tenue">Ancora nessuna seduta con questo esercizio.</p>';
  apriFoglio(`<div class="barra"><button class="tasto" data-a="chiudi-foglio" aria-label="Chiudi">${ICO.chiudi}</button><h3>${esc(nome)}<small>Storico</small></h3></div>
    <div class="corpo">${graf ? `<div class="campo"><span class="et">${conKg ? 'Carico massimo' : 'Il migliore'} per seduta</span>${graf}</div>` : ''}${tab}</div>`, { alto: true });
}

// ---------- profilo ----------
let profiloBozza = null;   // il profilo mentre lo modifichi (si salva con «Salva»)
function leggiPause() {
  const pz = clona(profiloBozza?.pause || {});
  $$('[data-pausa-motivo]').forEach(i => { if (pz[i.dataset.pausaMotivo]) pz[i.dataset.pausaMotivo].motivo = i.value.trim(); });
  $$('[data-pausa-fino]').forEach(i => { if (pz[i.dataset.pausaFino]) pz[i.dataset.pausaFino].fino = i.value || null; });
  return pz;
}
function apriProfilo(bozza) {
  profiloBozza = bozza || clona(profilo());
  const p = profiloBozza, utente = D.chiSei();
  const obiettivo = () => p.obiettivo || 3;
  apriFoglio(`<div class="barra"><button class="tasto" data-a="chiudi-foglio" aria-label="Chiudi">${ICO.chiudi}</button><h3>Profilo</h3>
      <button class="vai" data-a="salva-profilo" style="width:auto;height:40px;padding:0 16px;font-size:15px;border-radius:12px">Salva</button></div>
    <div class="corpo">
      <div class="campi2">
        <label>Peso (kg)<input id="pr-peso" inputmode="decimal" value="${p.peso ?? ''}"></label>
        <label>Altezza (cm)<input id="pr-altezza" inputmode="numeric" value="${p.altezza ?? ''}"></label>
        <label>Età<input id="pr-eta" inputmode="numeric" value="${p.eta ?? ''}"></label>
      </div>
      <span class="tenue">Servono per stimare le calorie. Restano solo nel tuo account.</span>
      <div class="campo"><span class="et">Allenamenti a settimana (obiettivo)</span><div class="scelte">${[1, 2, 3, 4, 5, 6].map(n =>
        `<button data-a="pr-obiettivo" data-n="${n}" aria-pressed="${obiettivo() === n}">${n}</button>`).join('')}</div></div>
      <div class="campo"><span class="et">Pause (infortuni, indicazioni del fisioterapista, attrezzi che non hai)</span>
        <span class="tenue">Gli esercizi con un attrezzo in pausa hanno il lucchetto: puoi sempre farli lo stesso dalla seduta.</span>
        <div class="scelte">${CATEGORIE.map(c => `<button data-a="pr-pausa" data-c="${c}" aria-pressed="${!!(p.pause || {})[c]}">${ATTREZZI[c].nome}</button>`).join('')}</div>
        ${Object.entries(p.pause || {}).map(([c, v]) => `<div class="riquadro" style="gap:8px"><b>${ATTREZZI[c]?.nome || c} in pausa</b>
          <input class="cerca" data-pausa-motivo="${c}" value="${esc(v.motivo || '')}" placeholder="Perché (es. indicazione del fisioterapista)" aria-label="Motivo">
          <label class="tenue" style="display:flex;gap:8px;align-items:center">Fino al <input type="date" class="cerca" style="width:auto" data-pausa-fino="${c}" value="${v.fino || ''}"> <span>(vuoto = finché non la togli)</span></label></div>`).join('')}
      </div>
      <div class="interruttore"><div><b>Voce a fine recupero</b>Dice «Recupero finito» oltre al bip</div>
        <button class="leva verde" role="switch" id="pr-voce" data-a="leva" aria-checked="${!!p.voce}" aria-label="Voce"></button></div>
      ${D.PROVA ? `<p class="tenue">Sei in modalità prova: i dati restano su questo dispositivo. <a class="link" href="./">Entra col tuo account</a></p>`
               : `<p class="tenue">Account: ${esc(utente?.email || '')}</p><button class="bottoncino" data-a="esci">Esci dall'account</button>`}
    </div>`);
}

// ---------- tocchi ----------
let sopprimi = false;
document.addEventListener('click', ev => { if (sopprimi) { sopprimi = false; ev.stopPropagation(); ev.preventDefault(); } }, true);
app.addEventListener('click', ev => {
  const t = ev.target;
  if (t.id === 'foglio') { chiudiFoglio(); return; }
  const voce = t.closest('[data-voce]');
  if (voce && alChiudereFoglio) { const v = alChiudereFoglio[+voce.dataset.voce]; chiudiFoglio(); v.fn(); return; }
  const b = t.closest('[data-a]'); if (!b) return;
  const a = b.dataset.a, i = +b.dataset.i, j = +b.dataset.j;
  const e = Number.isFinite(i) ? ES()[i] : null;
  switch (a) {
    case 'vai': vai(b.dataset.v); break;   // il timer continua: lo ritrovi tornando in seduta
    case 'profilo': apriProfilo(); break;
    case 'inizia': sbloccaSuono(); iniziaSeduta(b.dataset.id); break;
    case 'riprendi': apriSeduta(D.leggi('corrente')); break;
    case 'pasto': { const g = giorno(), c = { ...(g.camminate || {}) }; c[b.dataset.m] = !c[b.dataset.m]; D.scrivi('giorno:' + oggi(), { ...g, camminate: c }); disegna(); break; }
    case 'zona': V.zona = V.zona === b.dataset.z ? null : b.dataset.z; disegna(); break;
    case 'zona-val': { const g = giorno(), m = { ...(g.mattino || {}), [b.dataset.z]: +b.dataset.n }; D.scrivi('giorno:' + oggi(), { ...g, mattino: m }); V.zona = null; disegna(); break; }
    case 'home-modifica': V.modHome = true; disegna(); break;
    case 'home-fine': V.modHome = false; disegna(); break;
    case 'w-togli': { const w = b.dataset.w; salvaOrdineHome(ordineHome().filter(x => x !== w)); disegna(); avviso(`«${WIDGET[w].nome}» tolto`, annullaUltima); break; }
    case 'w-aggiungi': salvaOrdineHome([...ordineHome(), b.dataset.w]); disegna(); break;
    case 'w-reset': salvaOrdineHome(HOME_BASE); disegna(); break;
    case 'dritta': localeScrivi('dritta', 1); V.dritta = false; disegna(); break;
    case 'guidata': { const p = prossimo(); vai('esercizio', { cur: p ? p.i : attivi()[0]?.i ?? 0 }); break; }
    case 'apri-es': vai('esercizio', { cur: i }); break;
    case 'menu-es': menuEsercizio(i); break;
    case 'ok': if (e.sets[j].fatta) { e.sets[j].fatta = false; salvaSeduta(); disegna(); } else completaSet(i, j); break;
    case 'tempo': sbloccaSuono(); avviaTempo(i, j); break;
    case 'piu-serie': { const u = e.sets.at(-1) || { kg: e.kg, rip: e.rip, sec: e.sec }; e.sets.push({ kg: u.kg, rip: u.rip, sec: u.sec, fatta: false }); S.cambiato = true; salvaSeduta(); disegna(); break; }
    case 'nota': e.notaAperta = true; disegna(); $(`[data-campo-nota="${i}"]`)?.focus(); break;
    case 'storico': apriStorico(chiaveEs(e), e.nome); break;
    case 'storico-lib': apriStorico(b.dataset.k, b.closest('.riquadro')?.querySelector('b')?.textContent || ''); break;
    case 'sugg': { const sg = suggerimento(e, S.id); if (!sg) break; e.suggUsato = true;
      e.sets.forEach(s => { if (!s.fatta) { if (sg.kg) s.kg = sg.kg; if (sg.rip) s.rip = sg.rip; } }); if (sg.kg) e.kg = sg.kg;
      S.cambiato = true; salvaSeduta(); disegna(); avviso(sg.kg ? `Carico a ${sg.kg} kg per le serie che mancano` : 'Una ripetizione in più', annullaUltima); break; }
    case 'dolore': e.dolore = +b.dataset.n; salvaSeduta(); disegna(); if (e.dolore > 3) avviso('Sopra 3: la prossima volta niente aumento'); break;
    case 'riserva': e.riserva = b.dataset.r; salvaSeduta(); disegna(); if (e.riserva === '0-1') avviso('Troppo vicino al limite: tieni 2-3 in riserva'); break;
    case 'sblocca': e.pausa = false; salvaSeduta(); disegna(); break;
    case 'spunta': { const g = S.extra.find(x => x.id === b.dataset.g), v = g.voci[+b.dataset.k]; v.fatto = !v.fatto; salvaSeduta();
      b.setAttribute('aria-pressed', v.fatto); const s = b.closest('details').querySelector('summary .tenue'); if (s) s.textContent = `${g.voci.filter(x => x.fatto).length}/${g.voci.length} · ${g.minuti}'`; break; }
    case 'termina': termina(); break;
    case 'es-prec': spostaEs(-1); break;
    case 'es-succ': spostaEs(1); break;
    case 'es-azione': { const x = ES()[V.cur], k = primoLibero(x);
      if (k < 0) { const l = attivi(); if (l.findIndex(y => y.i === V.cur) === l.length - 1) vai('seduta'); else spostaEs(1); }
      else if (x.tipo === 'tempo') { sbloccaSuono(); avviaTempo(V.cur, k); }
      else completaSet(V.cur, k); break; }
    case 'passo': { const x = ES()[V.cur], k = primoLibero(x), d = +b.dataset.d, campo = b.dataset.k;
      const v = campo === 'kg' ? Math.max(0, (x.sets[k].kg ?? 0) + d) : Math.max(1, (x.sets[k].rip ?? 0) + d);
      x.sets.forEach((s, jj) => { if (jj >= k && !s.fatta) s[campo] = v; }); S.cambiato = true; salvaSeduta(true); disegna(); break; }
    // schede
    case 'scheda': V.scheda = b.dataset.id; disegna(true); break;
    case 'scheda-imp': apriImpScheda(b.dataset.nuova ? null : V.scheda); break;
    case 'sb-tipo': leggiImpScheda(); SB.tipo = b.dataset.v; disegnaImpScheda(); break;
    case 'sb-min': leggiImpScheda(); SB.minuti = +b.dataset.m; disegnaImpScheda(); break;
    case 'sb-leva': { const k = b.dataset.k, ora = b.getAttribute('aria-checked') === 'true'; SB[k] = !ora; b.setAttribute('aria-checked', !ora); break; }
    case 'sb-salva': { leggiImpScheda();
      if (!SB.nome.trim()) { avviso('Scrivi il nome della scheda'); $('#sb-nome').focus(); break; }
      const { _nuova, ...dati } = SB, vecchia = scheda(dati.id);
      if (dati.tipo !== 'allenamento') { delete dati.lettera; delete dati.rotazione; }
      const sc = { ...dati, nome: dati.nome.trim(), esercizi: vecchia?.esercizi || [], ordine: vecchia?.ordine ?? Math.max(0, ...schede().map(x => x.ordine ?? 0)) + 1 };
      scriviScheda(sc); V.scheda = sc.id; chiudiFoglio(); disegna(); avviso(_nuova ? 'Scheda creata: aggiungi gli esercizi' : 'Scheda salvata', annullaUltima); break; }
    case 'sb-elimina': { const nome = SB.nome; D.scrivi('scheda:' + SB.id, null); V.scheda = schede()[0]?.id; chiudiFoglio(); disegna(); avviso(`Scheda «${nome}» eliminata`, annullaUltima); break; }
    case 'modifica': apriModifica(V.scheda, b.dataset.id); break;
    case 'chiudi-foglio': chiudiFoglio(); F = null; break;
    case 'salva-mod': salvaModifica(); break;
    case 'fp': { leggiCampi(); const k = b.dataset.k, d = +b.dataset.d;
      if (k === 'kg') { const v = Math.max(0, (F.kg ?? 0) + d); F.kg = v || null; }
      else if (k === 'sec') F.sec = Math.max(5, (F.sec || 20) + d);
      else if (k === 'rec') F.rec = Math.max(0, (F.rec ?? 60) + d);
      else F[k] = Math.max(1, (F[k] ?? 1) + d);
      disegnaModifica(); break; }
    case 'f-att': leggiCampi(); F.att = b.dataset.c; disegnaModifica(); break;
    case 'f-ill': { leggiCampi(); const nomi = ['', ...nomiPose()]; F.posa = nomi[(nomi.indexOf(F.posa || '') + 1) % nomi.length]; disegnaModifica(); break; }
    case 'f-tipo': leggiCampi(); F.tipo = b.dataset.t; if (F.tipo === 'tempo') F.sec ||= 20; else F.rip ||= 10; disegnaModifica(); break;
    case 'f-leva': F[b.dataset.k] = !F[b.dataset.k]; b.setAttribute('aria-checked', F[b.dataset.k]); break;
    case 'f-coppia': leggiCampi(); F.coppia = b.dataset.c || undefined; disegnaModifica(); break;
    case 'f-prog': leggiCampi(); F.progressione = b.dataset.v; disegnaModifica(); break;
    case 'f-elimina': { const sc = clona(scheda(F._scheda)), nome = F.nome; sc.esercizi = sc.esercizi.filter(x => x.id !== F.id); scriviScheda(sc); chiudiFoglio(); F = null; disegna(); avviso(`«${nome}» tolto`, annullaUltima); break; }
    // libreria
    case 'libreria': apriLibreria(b.dataset.modo); break;
    case 'lib-filtro': L.filtro = b.dataset.f; disegnaLibreria(); break;
    case 'lib-scegli': sceltaLibreria(b.dataset.id); break;
    case 'lib-nuovo': { const nome = L.q.trim(), modo = L.modo; chiudiFoglio();
      if (modo === 'scheda') apriModifica(V.scheda, null, { nome });
      else { apriModifica(S.scheda, null, { nome }); avviso('Lo aggiungo alla scheda: lo trovi anche oggi dalla libreria'); } break; }
    // diario
    case 'dettaglio': vai('dettaglio', { dettaglio: b.dataset.id }); break;
    case 'elimina-seduta': D.scrivi('seduta:' + b.dataset.id, null); vai('diario'); avviso('Eliminato dal diario', annullaUltima); break;
    // profilo
    case 'leva': b.setAttribute('aria-checked', b.getAttribute('aria-checked') !== 'true'); break;
    case 'pr-pausa': case 'pr-obiettivo': {
      // ridisegno il profilo tenendo quello che hai già scritto
      const n = id => { const v = parseFloat($(id).value.replace(',', '.')); return Number.isFinite(v) && v > 0 ? v : null; };
      const bz = { ...profiloBozza, peso: n('#pr-peso'), altezza: n('#pr-altezza'), eta: n('#pr-eta'), pause: leggiPause(), voce: $('#pr-voce').getAttribute('aria-checked') === 'true' };
      if (a === 'pr-obiettivo') bz.obiettivo = +b.dataset.n;
      else { const c = b.dataset.c; if (bz.pause[c]) delete bz.pause[c]; else bz.pause[c] = { motivo: '', fino: null }; }
      apriProfilo(bz); break; }
    case 'salva-profilo': {
      const n = id => { const v = parseFloat($(id).value.replace(',', '.')); return Number.isFinite(v) && v > 0 ? v : null; };
      D.scrivi('profilo', { ...profilo(), obiettivo: profiloBozza.obiettivo, peso: n('#pr-peso'), altezza: n('#pr-altezza'), eta: n('#pr-eta'),
        pause: leggiPause(), voce: $('#pr-voce').getAttribute('aria-checked') === 'true' });
      chiudiFoglio(); disegna(); avviso('Profilo salvato'); break; }
    case 'esci': D.esci().then(() => { S = null; chiudiFoglio(); vai('accesso'); }); break;
  }
});

// campi di testo: salvano senza ridisegnare (così la tastiera non si chiude)
app.addEventListener('input', ev => {
  const t = ev.target;
  if (t.id === 'lib-cerca') { L.q = t.value; disegnaLibreria(); return; }
  if (t.dataset.campoGiorno) { D.scrivi('giorno:' + oggi(), { ...giorno(), [t.dataset.campoGiorno]: t.value }, { unisci: true }); return; }
  if (!S) return;
  if (t.dataset.campoNota != null) { ES()[+t.dataset.campoNota].nota = t.value; salvaSeduta(true); return; }
  if (t.dataset.campoSeduta) { S[t.dataset.campoSeduta] = t.value; salvaSeduta(true); return; }
  if (t.dataset.campo) {
    const e = ES()[+t.dataset.i], j = +t.dataset.j, k = t.dataset.campo, v = parseFloat(t.value.replace(',', '.'));
    if (!Number.isFinite(v)) return;
    e.sets[j][k] = v; S.cambiato = true;
    // cambiare una serie aggiorna anche le successive non ancora fatte
    e.sets.forEach((s, jj) => { if (jj > j && !s.fatta) { s[k] = v; const inp = $(`[data-campo="${k}"][data-i="${t.dataset.i}"][data-j="${jj}"]`); if (inp) inp.value = v; } });
    salvaSeduta(true);
  }
});
app.addEventListener('submit', async ev => {
  if (ev.target.id !== 'form-accesso') return;
  ev.preventDefault();
  const err = $('#acc-err'); err.textContent = '';
  try { await D.accedi($('#acc-email').value.trim(), $('#acc-pw').value); dopoAccesso(); }
  catch (x) { err.textContent = /Invalid login/i.test(x.message) ? 'Email o password non giuste.' : x.message; }
});
document.addEventListener('keydown', ev => {
  const tag = document.activeElement?.tagName;
  if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'z' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
    ev.preventDefault(); if (ev.shiftKey) D.ripeti(); else D.annulla();
    if (S) S = clona(D.leggi('seduta:' + S.id)) || S; disegna();
  }
  if (ev.key === 'Escape' && !$('#foglio').hidden) chiudiFoglio();
});

// ---------- scorri a sinistra per togliere (serie nella seduta, esercizi nelle schede) ----------
let sw = null;
app.addEventListener('pointerdown', ev => {
  const w = ev.target.closest('[data-swipe]');
  if (!w || ev.target.closest('input, textarea, .maniglia, .ok')) return;
  sw = { w, el: w.lastElementChild, x0: ev.clientX, y0: ev.clientY, dx: 0, att: false };
});
app.addEventListener('pointermove', ev => {
  if (!sw) return;
  const dx = ev.clientX - sw.x0, dy = ev.clientY - sw.y0;
  if (!sw.att) {
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) { sw.att = true; sw.el.style.transition = 'none'; sw.w.classList.add('scorre-via'); }
    else if (Math.abs(dy) > 10) { sw = null; return; } else return;
  }
  sw.dx = Math.min(0, dx); sw.el.style.transform = `translateX(${sw.dx}px)`;
});
function rilascia() {
  if (!sw) return;
  const { w, el, att, dx } = sw; sw = null;
  el.style.transition = '';
  if (!att) return;
  sopprimi = true; setTimeout(() => sopprimi = false, 50);
  if (dx < -90) { el.style.transform = 'translateX(-100%)'; setTimeout(() => togli(w), 120); }
  else { el.style.transform = ''; setTimeout(() => w.classList.remove('scorre-via'), 160); }
}
app.addEventListener('pointerup', rilascia);
app.addEventListener('pointercancel', rilascia);
function togli(w) {
  if (w.dataset.swipe === 'set') {
    const e = ES()[+w.dataset.i], j = +w.dataset.j; e.sets.splice(j, 1); S.cambiato = true; salvaSeduta(); disegna();
    avviso(`Serie ${j + 1} tolta`, annullaUltima);
  } else {
    const sc = clona(scheda(V.scheda)), x = sc.esercizi.find(e => e.id === w.dataset.id);
    sc.esercizi = sc.esercizi.filter(e => e.id !== w.dataset.id); scriviScheda(sc); disegna();
    avviso(`«${x?.nome}» tolto dalla scheda`, annullaUltima);
  }
}

// ---------- piccole preferenze del dispositivo ----------
function localeLeggi(k) { try { return localStorage.getItem('allenamento.' + k); } catch { return null; } }
function localeScrivi(k, v) { try { localStorage.setItem('allenamento.' + k, v); } catch { /* niente */ } }

// ---------- avvio ----------
D.suStato(s => { const r = $('#rete'); if (r) { r.className = 'rete' + (s === 'offline' ? ' offline' : ''); r.innerHTML = s === 'offline' ? `${ICO.nuvola}senza rete` : ''; } });
D.suCambio(() => {
  // arrivano modifiche da un altro dispositivo: ridisegno solo se non stai scrivendo
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || !$('#foglio').hidden) return;
  if (S) { const s = D.leggi('seduta:' + S.id); S = s && !s.fine ? clona(s) : null; if (!S && (V.vista === 'seduta' || V.vista === 'esercizio')) V.vista = 'home'; }
  disegna();
});
function dopoAccesso() {
  semina();
  const c = D.leggi('corrente'), s = c && D.leggi('seduta:' + c);
  if (s && !s.fine) { S = clona(s); vai('seduta'); } else vai('home');
}
if ('serviceWorker' in navigator && !location.hostname.match(/^(localhost|127\.)/)) navigator.serviceWorker.register('sw.js').catch(() => {});
(async () => {
  try { if (await D.avvia()) dopoAccesso(); else vai('accesso'); }
  catch (x) { console.warn(x); vai('accesso'); }
})();
