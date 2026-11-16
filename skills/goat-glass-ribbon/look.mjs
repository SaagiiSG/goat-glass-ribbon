// 14 Glass Ribbon: a talking head in a soft violet grade, a glowing violet-to-white ribbon and purple orbs floating
// behind the speaker (the person is cut out of every frame and laid back on top), a frosted glass card top right,
// a white pill and plain white captions with one starred word in big Cormorant italic. A soft violet streak wipes to
// a scene that acts out what is said, on a violet backdrop with a glowing line: numbered glass cards for a list
// (steps), a glass news panel for an announcement (news), or a glass chat window typing a question and its answer.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { missing } from "./scripts/fonts.mjs";
import { cutOut, headAt, noHeadNote } from "./scripts/cutout.mjs";

export const NAME = "glass-ribbon";
export const TALKS = true;

const SKILL_DIR = dirname(fileURLToPath(import.meta.url));
const INTER = ["Inter", join(SKILL_DIR, "fonts", "Inter[opsz,wght].ttf")];
const SERIF = ["Cormorant Garamond", join(SKILL_DIR, "fonts", "CormorantGaramond-Italic[wght].ttf")];

// v1's violet grade, verbatim. Baked in at prep (clipFilter), so the cut-out is graded the same as the footage.
export const GRADE = "colorbalance=rs=0.06:gs=-0.08:bs=0.18:rm=0.04:gm=-0.08:bm=0.12:rh=0.02:gh=-0.02:bh=0.05," +
  "eq=brightness=-0.03:contrast=1.04:saturation=0.95,vignette=PI/5";

// Row limits, from HarfBuzz advances of the bundled fonts at the floor sizes look.js fits down to, so a row of the
// widest Mongolian letters (Ш Щ Ю Ж) still fits: card title 14 x 0.981 em (Cormorant 600 Ш) at 28 px = 385 of the
// card's 388 px inside its padding and edges (it shrinks from 44 px; "Арьс арчилгаа" stays at 44, 237 px); pill
// 26 x 1.015 em (Inter 600 Ю) at 30 px = 792 of 792 (fixed, 840 less its padding); step 15 x 1.002 em (Inter 400 Ю)
// at 28 px = 421 of the card's 423 (from 32 px). The scenes: a news headline 13 x 0.981 em (Cormorant 600 Ш) at
// 56 px = 714 of the panel's 748 (it shrinks from 104 px), its badge 12 x (1.022 + 0.06 spacing) em (Inter 700 Ю) at
// 30 px = 390 (fixed), its line 23 x 1.006 em (Inter 500 Ю) at 32 px = 740 of 748 (fixed); a chat message 16 x
// 1.006 em (Inter 500 Ю) at 42 px = 676 of its bubble's 716, the reply 14 x 1.013 em (Inter 600 Ю) at 48 px = 681 of
// 708, the header name 16 x 1.013 em at 36 px = 583 of 594 (all fixed); a big word 7 x 1.039 em (Inter 800 Ж) at
// 100 px = 727 of 748 (it shrinks from 220 px; "Day 1" stays at 220, 533 px), its line 21 x 1.006 em at 34 px = 719;
// a quote 13 x 0.981 em (Cormorant 600 Ш) at 56 px = 714 of 748 (from 84 px); a compare's before 14 x 1.013 em
// (Inter 600 Ю) at 52 px = 737 of 748 (fixed), its after 12 x 0.981 em (Cormorant) at 60 px = 706 (from 80 px); a list item
// 14 x 1.006 em (Inter 500 Ю) at 46 px = 648 of the 676 beside its tick (fixed). Rarer symbols wider than Ю (№) can
// still run past by a few px.
const ROW = { card: 14, pill: 26, step: 15, news: 13, badge: 12, line: 23, message: 16, reply: 14, name: 16, big: 7, bigLine: 21,
  quote: 13, before: 14, after: 12, item: 14 };
const ROWS = { card: 2, pill: 1, step: 1 };
const KINDS = ["news", "chat", "big", "quote", "compare", "list"]; // scene kinds that are one text each (steps group)
const ROLES = ["card", "pill", "step", ...KINDS];

// Seconds: the streak wipes in this long before a scene's first step (lead) and crosses the screen in 0.8 s, the
// scene crossfading over 0.5 s centred on it (Saagii, 15 Nov: "make it more smoother"; the preview's 0.64 s and
// 0.16 s cut were harsh); step cards rise in 0.5 s, at least 0.3 s apart. The card rises in 0.48 s, a pill in
// 0.32 s, and a card or pill fades out over its last 0.32 s (the preview's 8 s loop: 6%, 4% and 4% of it).
export const T = { lead: 0.4, streak: 0.8, fade: 0.5, stepIn: 0.5, stagger: 0.3, cardIn: 0.48, rise: 0.32, out: 0.32, read: 1,
  // news, from its start: the panel rises under the wipe (from 0.5 s before, 0.5 s, so the backdrop is never empty),
  // the badge pops as the scene is fully in (0.15 s before), the headline's words from the start every 0.08 s (0.4 s
  // each), so the panel is never empty either; the line 0.1 s before the last word lands, a sweep of light 0.2 s
  // before it is all in
  news: { panel: -0.5, panelIn: 0.5, badge: -0.15, badgeIn: 0.4, words: 0, gap: 0.08, wordIn: 0.4, sheen: 0.8 },
  // chat, from its start: the window rises under the wipe (as the news panel), the message types from 0.2 s at 24
  // letters a second, a typing bubble 0.15 s after, gone (0.15 s fade) before the reply rises (0.45 s) 0.65 s after
  // the message is typed
  chat: { window: -0.5, windowIn: 0.5, type: 0.2, cps: 24, dots: 0.15, dotsOut: 0.15, reply: 0.65, replyIn: 0.45 },
  // big: the panel rises under the wipe, the word or number blurs in as the scene is fully in (0.15 s before the start,
  // 0.6 s; one of 10 or more counts up over 0.8 s), its line 0.35 s in: the glass is never empty
  big: { panel: -0.5, panelIn: 0.5, text: -0.15, textIn: 0.6, count: 0.8, line: 0.35, lineIn: 0.4 },
  // quote: a quotation mark as the scene is fully in, the words from the start every 0.1 s (0.45 s each)
  quote: { panel: -0.5, panelIn: 0.5, mark: -0.15, gap: 0.1, wordIn: 0.45 },
  // compare: the before card rises under the wipe, its words as the scene is fully in, the arrow draws 0.3 s in
  // (0.5 s), the after card lands 0.7 s in (0.5 s)
  compare: { panel: -0.5, panelIn: 0.5, text: -0.15, textIn: 0.35, arrow: 0.3, arrowIn: 0.5, after: 0.7, afterIn: 0.5 },
  // list: the first item rises as the scene is fully in (0.15 s before the start), the next every 0.5 s (0.4 s each),
  // each ticking 0.2 s after it rises (0.3 s)
  list: { panel: -0.5, panelIn: 0.5, items: -0.15, gap: 0.5, itemIn: 0.4, tick: 0.2, tickIn: 0.3 } };
const MIN_TEXT = 1, MIN_STEP = 1, MIN_GAP = 1, FIRST_STEP = 0.8, MAX_STEPS = 3, EPS = 1e-6;
const AT0 = 1 / 60; // a card from frame 0 is up at once (look.js): it doesn't rise, so no shimmer

const isNum = (n) => typeof n === "number" && Number.isFinite(n);
const frame = (t) => (t === Infinity ? t : Math.round(t * 30) / 30); // the frame look.js shows it on
const s2 = (t) => t.toFixed(2);
const r3 = (n) => Math.round(n * 1000) / 1000;
const clamp = (x, a, b) => Math.min(Math.max(x, a), b);
const textOf = (t) => (typeof t.text === "string" || isNum(t.text) ? String(t.text) : "");
const quote = (t) => `"${textOf(t).trim().replace(/\s*\n\s*/g, " / ")}"`;

// The rows of a card, pill or step text; refuses an empty or too long row and letters its font can't draw.
function rows(t) {
  const text = textOf(t);
  if (!text.trim()) throw new Error(`a "${t.role}" text is empty`);
  const list = text.split("\n").map((r) => r.trim());
  if (list.some((r) => !r)) throw new Error(`${quote(t)} has an empty row: remove the extra \\n`);
  if (list.length > ROWS[t.role])
    throw new Error(ROWS[t.role] === 1 ? `${quote(t)}: a ${t.role} is one row: remove the \\n`
      : `${quote(t)} has ${list.length} rows: a card title takes ${ROWS.card} rows at most`);
  for (const r of list)
    if ([...r].length > ROW[t.role])
      throw new Error(t.role === "card"
        ? `the card title row "${r}" is too long (${ROW.card} characters at most): shorten it, or split the title into 2 rows with \\n`
        : `"${r}" is too long for a ${t.role} (${ROW[t.role]} characters at most): shorten it`);
  const [name, file] = t.role === "card" ? SERIF : INTER;
  const bad = missing(list.join(" "), file);
  if (bad.length) throw new Error(`${quote(t)} uses ${bad.join(" ")}, which ${name} can't draw`);
  return list;
}

// One field of a scene (a news headline, badge or line, a chat message or reply): its rows, each refused when empty,
// too long or using letters its font can't draw.
function field(value, label, max, most, [name, file], empty = `${label} is empty`) {
  const text = typeof value === "string" || isNum(value) ? String(value) : "";
  if (!text.trim()) throw new Error(empty);
  const list = text.split("\n").map((r) => r.trim()), shown = list.join(" / ");
  if (list.some((r) => !r)) throw new Error(`${label} "${shown}" has an empty row: remove the extra \\n`);
  if (list.length > most)
    throw new Error(most === 1 ? `${label} "${shown}" is one row: remove the \\n` : `${label} "${shown}" has ${list.length} rows: ${most} at most`);
  for (const r of list)
    if ([...r].length > max)
      throw new Error(most === 1 ? `${label} "${r}" is too long (${max} characters at most): shorten it`
        : `${label} row "${r}" is too long (${max} characters at most): shorten it, or split it into 2 rows with \\n`);
  const bad = missing(list.join(" "), file);
  if (bad.length) throw new Error(`${label} "${shown}" uses ${bad.join(" ")}, which ${name} can't draw`);
  return list;
}

function scene(t) {
  if (!textOf(t).trim()) throw new Error(`a "${t.role}" text is empty`);
  const opt = (v, label, max, font) => v !== undefined && field(v, label, max, 1, font, `${label} is empty: remove it or give it words`);
  if (t.role === "news") {
    field(t.text, "the news headline", ROW.news, 2, SERIF);
    opt(t.badge, "the news badge", ROW.badge, INTER);
    opt(t.line, "the news line", ROW.line, INTER);
  } else if (t.role === "chat") {
    field(t.text, "the chat message", ROW.message, 2, INTER);
    if (t.reply === undefined) throw new Error(`the chat ${quote(t)} needs a "reply"`);
    field(t.reply, "the chat reply", ROW.reply, 2, INTER, "the chat reply is empty");
    opt(t.name, "the chat name", ROW.name, INTER);
  } else if (t.role === "big") {
    field(t.text, "the big text", ROW.big, 1, INTER);
    opt(t.line, "the big line", ROW.bigLine, INTER);
  } else if (t.role === "quote") field(t.text, "the quote", ROW.quote, 3, SERIF);
  else if (t.role === "compare") {
    field(t.text, "the compare before", ROW.before, 2, INTER);
    if (t.after === undefined) throw new Error(`the compare ${quote(t)} needs an "after"`);
    field(t.after, "the compare after", ROW.after, 2, SERIF, "the compare after is empty");
  } else {
    const items = textOf(t).trim().split("\n").map((r) => r.trim());
    if (items.length < 2) throw new Error("a list takes 2 to 4 items, one per row: split them with \\n");
    if (items.length > 4) throw new Error(`the list "${items.join(" / ")}" has ${items.length} rows: 4 at most`);
    for (const r of items) // an item never wraps: a second row would read as another item
      if ([...r].length > ROW.item) throw new Error(`the list item "${r}" is too long (${ROW.item} characters at most): shorten it`);
    field(t.text, "the list", ROW.item, 4, INTER);
  }
}

export function validate(plan) {
  const list = plan.texts ?? [];
  if (!Array.isArray(list)) throw new Error('"texts" must be a list');
  for (const t of list) {
    if (!t || typeof t !== "object") throw new Error('each text must be {"role": …, "text": …, "start": …}');
    if (t.role === "caption")
      throw new Error('captions now come from what the speaker says (transcript.json): remove the "caption" texts ' +
        'from plan.json, and mark the word to stress with "star": true in transcript.json');
    if (!ROLES.includes(t.role))
      throw new Error(`text role "${t.role}" is not used by this look. Use "card", "pill", "step", "news", "chat", "big", "quote", "compare" or "list".`);
    if (KINDS.includes(t.role)) scene(t);
    else rows(t);
  }
  if (plan.captions !== undefined && typeof plan.captions !== "boolean") throw new Error('"captions" must be true or false');
  schedule(plan, Infinity);
}

function times(t) {
  if (!(isNum(t.start) && t.start >= 0)) throw new Error(`${quote(t)}: "start" must be seconds, 0 or more`);
  if (t.end !== undefined && !(isNum(t.end) && t.end > t.start)) throw new Error(`${quote(t)} must end after it starts`);
}

// The cards, pills and step scenes on the frame grid look.js shows them on. One card and one pill at a time (a later
// one or a step scene ends the one before, and none starts while a scene or its streak back covers the speaker),
// each 1 s at least. Steps that overlap or touch share a scene of up to 3 cards; the streak
// wipes in 0.4 s before its first step (0.8 s in at the earliest: frame 0 is the speaker) and out when its steps end,
// unless that is inside the last streak's half before the end (then it stays). Each step shows 1 s at least and the
// speaker 1 s at least between two scenes, so two streaks never overlap. dur is Infinity before prep (validate).
export function schedule(plan, dur = Infinity) {
  if (!(dur === Infinity || (isNum(dur) && dur > 0))) throw new Error("the video's length must be seconds");
  const D = frame(dur), list = Array.isArray(plan.texts) ? plan.texts : [];
  for (const t of list) if (t && ROLES.includes(t.role)) times(t);
  const after = (t, start) => {
    if (start >= D) throw new Error(`${quote(t)} starts at ${s2(t.start)} s, after the video ends (${s2(dur)} s)`);
  };
  // steps that overlap or touch share a scene; a news or chat text is a scene of its own
  const scenes = [];
  for (const t of list.filter((x) => x?.role === "step").sort((a, b) => a.start - b.start)) {
    const start = frame(t.start), end = Math.min(frame(t.end ?? Infinity), D);
    after(t, start);
    const sc = scenes.at(-1), item = { text: textOf(t).trim(), start, src: t };
    if (sc && start < sc.end + EPS) {
      item.start = Math.max(start, frame(sc.steps.at(-1).start + T.stagger)); // never two cards rising together
      sc.steps.push(item);
      sc.end = Math.max(sc.end, end);
    } else scenes.push({ kind: "steps", start: frame(start - T.lead), end, at: start, src: t, steps: [item] });
  }
  for (const t of list.filter((x) => KINDS.includes(x?.role))) {
    const at = frame(t.start);
    after(t, at);
    scenes.push({ kind: t.role, start: frame(at - T.lead), end: Math.min(frame(t.end ?? Infinity), D), at, src: t });
  }
  scenes.sort((x, y) => x.start - y.start);
  const named = (sc) => `the ${sc.kind === "steps" ? "step" : sc.kind} scene`;
  scenes.forEach((sc, i) => {
    const prev = scenes[i - 1];
    if (prev && sc.start < prev.end - EPS)
      throw new Error(`${named(sc)} (${s2(sc.start)}–${s2(sc.end)} s) starts before ${named(prev)} ends (${s2(prev.end)} s): ` +
        "one scene at a time");
    if (i === 0 && sc.at < FIRST_STEP - EPS)
      throw new Error(`${quote(sc.src)} starts at ${s2(sc.at)} s: start ${sc.kind === "steps" ? "the first step" : named(sc)} at ` +
        `${FIRST_STEP} s or later (the streak wipes in 0.4 s before it, and the first frame, the thumbnail, shows the speaker)`);
    sc.stays = sc.end > D - T.streak / 2 - EPS;
    if (sc.stays) sc.end = D;
    if (sc.kind === "steps") {
      if (sc.steps.length > MAX_STEPS)
        throw new Error(`${sc.steps.length} steps overlap at ${s2(sc.at)} s: a step scene shows ${MAX_STEPS} numbered cards ` +
          "at most. End the first ones before the next starts (1 s or more of the speaker between), so it opens a new scene");
      for (const x of sc.steps)
        if (sc.end - x.start < MIN_STEP - EPS)
          throw new Error(`${quote(x.src)} shows for ${s2(sc.end - x.start)} s: give each step ${MIN_STEP} s or more ` +
            "(start it earlier or end the steps later)");
    } else built(sc, TIMES[sc.kind](sc));
    if (prev && sc.start - prev.end < MIN_GAP - EPS)
      throw new Error(`the speaker shows for only ${s2(sc.start - prev.end)} s (${s2(prev.end)}–${s2(sc.start)} s) between two ` +
        `scenes: leave ${MIN_GAP} s or more (the streak wipes in 0.4 s before a scene's first step), ` +
        "or let the steps overlap so they share one scene");
  });
  // a step scene covers the speaker: a card or pill still up when one wipes in ends there, and none starts under it
  // or before its streak back has crossed (half a streak after the scene), so nothing rises under the fading light
  const one = (role) => {
    const order = list.filter((t) => t?.role === role).sort((a, b) => a.start - b.start);
    return order.map((t, i) => {
      const start = frame(t.start), next = order[i + 1];
      after(t, start);
      const under = scenes.find((sc) => start >= sc.start - EPS && start < sc.end + T.streak / 2 - EPS);
      if (under) {
        const clear = under.end + T.streak / 2;
        throw new Error(`${quote(t)} starts at ${s2(start)} s, while ${named(under)} covers the speaker or the streak back ` +
          `crosses (${s2(under.start)}–${s2(clear)} s): start it before the scene or at ${s2(clear)} s or later`);
      }
      const scene = scenes.find((sc) => sc.start > start), nextAt = next ? frame(next.start) : Infinity;
      const end = Math.min(frame(t.end ?? Infinity), nextAt, scene?.start ?? Infinity, D);
      if (end - start < MIN_TEXT - EPS) {
        const by = end === scene?.start ? `, or ${named(scene)}'s start (${s2(scene.start)} s)`
          : end === nextAt ? `, or the next ${role}'s start` : "";
        throw new Error(`${quote(t)} shows for ${s2(end - start)} s: a ${role} needs ${MIN_TEXT} s or more. ` +
          `Move its start or end${by}.`);
      }
      return { text: textOf(t).trim(), start, end, stays: end >= D - EPS };
    });
  };
  const cards = one("card").map((c) => ({ ...c, rows: c.text.split("\n").map((r) => r.trim()) }));
  const pills = one("pill");
  return {
    cards, pills,
    scenes: scenes.map(({ src, at, ...sc }) => (sc.steps ? { ...sc, steps: sc.steps.map(({ src: _, ...x }) => x) } : sc)),
  };
}

// A news scene: its headline's words (per row), badge and line, and when each part lands.
function newsTimes(sc) {
  const N = T.news, t = sc.src, at = sc.at;
  const rows = String(t.text).split("\n").map((r) => r.trim().split(/\s+/));
  const n = rows.flat().length, wordsDone = at + N.words + (n - 1) * N.gap + N.wordIn;
  const line = t.line === undefined ? null : String(t.line).trim(), lineAt = wordsDone - 0.1;
  const done = line ? lineAt + N.wordIn : wordsDone;
  sc.news = {
    rows, badge: t.badge === undefined ? null : String(t.badge).trim(), line,
    t: { panel: r3(at + N.panel), badge: r3(at + N.badge), words: rows.flat().map((_, k) => r3(at + N.words + k * N.gap)),
      line: line ? r3(lineAt) : null, built: r3(done), sheen: r3(done - 0.2) },
  };
  return sc.news.t;
}

// A chat scene: the message (typed letter by letter, the \n not counted) and the reply, and when each part lands.
function chatTimes(sc) {
  const C = T.chat, t = sc.src, at = sc.at, rows = (v) => String(v).split("\n").map((r) => r.trim());
  const message = rows(t.text), letters = [...message.join("")].length, type = at + C.type, typed = type + letters / C.cps;
  sc.chat = {
    message, reply: rows(t.reply), name: t.name === undefined ? null : String(t.name).trim(),
    t: { window: r3(at + C.window), type: r3(type), typed: r3(typed), dots: r3(typed + C.dots),
      dotsOut: r3(typed + C.reply - C.dotsOut), reply: r3(typed + C.reply), built: r3(typed + C.reply + C.replyIn), cps: C.cps },
  };
  return sc.chat.t;
}

// Refuses a scene too short for its parts to land plus 1 s to read. [t, how it builds, how to shorten it]
function built(sc, [t, how, fix = ""]) {
  const need = r3(t.built - sc.at + T.read), has = sc.end - sc.at;
  if (has < need - EPS)
    throw new Error(`the ${sc.kind} scene at ${s2(sc.at)} s shows for ${s2(has)} s but needs ${s2(need)} s (${how}, then ` +
      `${T.read} s to read): end it later${fix}`);
}

// A big word or number (and its line), when each lands. A number of 10 or more (a prefix and suffix kept) counts up;
// one written with a leading zero ("0100") or a year (1900-2099) is shown as written, since counting would change it
// or mean nothing. The count's last frame is the text itself.
const counts = (n) => n.length > 0 && n[0] !== "0" && Number(n) >= 10 && !(n.length === 4 && Number(n) >= 1900 && Number(n) <= 2099);
function bigTimes(sc) {
  const B = T.big, t = sc.src, at = sc.at, text = String(t.text).trim(), line = t.line === undefined ? null : String(t.line).trim();
  const m = text.match(/^(\D*)(\d+)(\D*)$/), count = m && counts(m[2]) ? { from: 0, to: Number(m[2]), before: m[1], after: m[3] } : null;
  const done = r3(Math.max(B.text + B.textIn, count ? B.text + B.count : 0, line ? B.line + B.lineIn : 0));
  sc.big = { text, line, count, t: { panel: r3(at + B.panel), text: r3(at + B.text), line: line ? r3(at + B.line) : null,
    built: r3(at + done) } };
  return [sc.big.t, `it lands in ${s2(done)} s`];
}

// A quote's words (per row), when each writes in.
function quoteTimes(sc) {
  const Q = T.quote, at = sc.at, rows = String(sc.src.text).split("\n").map((r) => r.trim().split(/\s+/));
  const words = rows.flat().map((_, k) => r3(at + k * Q.gap)), built = r3(words.at(-1) + Q.wordIn);
  sc.quote = { rows, t: { panel: r3(at + Q.panel), mark: r3(at + Q.mark), words, built } };
  return [sc.quote.t, `its words build for ${s2(r3(built - at))} s`, ", or shorten the quote"];
}

// A compare: the before, the arrow, the after.
function compareTimes(sc) {
  const C = T.compare, at = sc.at, rows = (v) => String(v).split("\n").map((r) => r.trim());
  sc.compare = { before: rows(sc.src.text), after: rows(sc.src.after),
    t: { panel: r3(at + C.panel), text: r3(at + C.text), arrow: r3(at + C.arrow), after: r3(at + C.after),
      built: r3(at + C.after + C.afterIn) } };
  return [sc.compare.t, `the after lands ${s2(C.after + C.afterIn)} s in`];
}

// A list's items, when each rises and ticks.
function listTimes(sc) {
  const L = T.list, at = sc.at, items = String(sc.src.text).split("\n").map((r) => r.trim());
  const rise = items.map((_, k) => r3(at + L.items + k * L.gap)), ticks = rise.map((x) => r3(x + L.tick));
  const built = r3(ticks.at(-1) + L.tickIn);
  sc.list = { items, t: { panel: r3(at + L.panel), items: rise, ticks, built } };
  return [sc.list.t, `its items tick on for ${s2(r3(built - at))} s`, ", or use fewer items"];
}

const TIMES = {
  news: (sc) => { const t = newsTimes(sc); return [t, `its words build for ${s2(r3(t.built - sc.at))} s`, ", or shorten the headline"]; },
  chat: (sc) => { const t = chatTimes(sc);
    return [t, `the message types for ${s2(r3(t.typed - t.type))} s and the reply lands ${s2(r3(t.built - sc.at))} s in`, ", or shorten the message"]; },
  big: bigTimes, quote: quoteTimes, compare: compareTimes, list: listTimes,
};

// Per clip, after the crop: the violet grade. It runs in prep, which bakes it into the footage (and so into the
// cut-out), so it records the grade in the work folder (goat.mjs's .work-<NAME>) for prepare to check.
export async function clipFilter(clip, ctx) {
  const work = join(ctx.planDir, `.work-${NAME}`);
  mkdirSync(work, { recursive: true });
  writeFileSync(join(work, "grade.txt"), GRADE);
  return GRADE;
}

// Captions (centre capY, about 90 px tall) sit under the usual chin, the pill (54 px) above them with 14 px between:
// 150 px under the chin, or 95 with no pill. The usual chin is the 75th percentile of the sampled ones (as in
// goat-word-behind), so one stray frame (a hand by the face, a bad mask) can't drop the captions for the whole video.
// Never above the lower third (1185, where the preview and v1 put them, inside the safe box) nor below 1420. When that
// leaves them a little past the safe box (bottom > 1248), they move up to 1203 if the pill, or with no pill the
// captions, still start 30 px or more under the chin; otherwise prepare() warns. They keep that height in the scenes
// too, so a caption on screen never moves as a scene comes or goes. A "head" taller than 1.6 widths is the cut-out
// taking in a chair or a wall (the mask never narrows into a neck).
const CAP = { min: 1185, max: 1420, half: 45, pill: 86, pillHalf: 27, gap: 30 };
export const trusted = (h) => Boolean(h) && h.chin - h.top <= 1.6 * h.width;
export function layoutFor(heads, pill) {
  const chins = heads.filter(trusted).map((h) => h.chin).sort((a, b) => a - b);
  let capY = CAP.min;
  if (chins.length) {
    const chin = chins[Math.ceil(0.75 * chins.length) - 1], above = pill ? CAP.pill + CAP.pillHalf : CAP.half; // stack top
    capY = Math.round(clamp(chin + (pill ? 150 : 95), CAP.min, CAP.max));
    const inside = 1248 - CAP.half;
    if (capY > inside && chin + CAP.gap + above <= inside) capY = inside;
  }
  return { capY, pillY: capY - CAP.pill };
}

// The captions or pill whose bottom passes the safe box (y 1248), where the app's own text can cover them.
export const offSafe = ({ capY, pillY }, { captions, pill }) =>
  [captions && capY + CAP.half > 1248 && "the captions", pill && pillY + CAP.pillHalf > 1248 && "the pill"].filter(Boolean);

// The glass card: x 516–960 from y 280, 116 px plus 46.2 a title row tall (v1's spot, the preview's top right moved
// into the safe box). True when it sits on the head (between its top and chin).
const CARD = { x0: 516, x1: 960, top: 280 };
export function onHead(head, titleRows) {
  if (!head) return false;
  const bottom = CARD.top + 116 + 46.2 * titleRows;
  return head.top < bottom && head.chin > CARD.top && head.cx + head.width / 2 > CARD.x0 && head.cx - head.width / 2 < CARD.x1;
}

// When to read the head: frame 0 (the speaker always opens the video, so there is always one read) and every 0.5 s
// the speaker shows (wider apart on a long video: 40 reads at most), never under a scene or its streaks, spread over
// the whole video (look 13 adds 8 spread reads to its per-word ones; these already are), so the usual chin is the
// speaker's, not one moment's.
export function sampleTimes(scenes, dur) {
  if (!(isNum(dur) && dur > 0)) throw new Error("the video's length must be seconds");
  const step = Math.max(0.5, dur / 40), out = [0];
  for (let t = step / 2; t < dur; t += step)
    if (!scenes.some((sc) => t >= sc.start - T.streak / 2 && t < sc.end + T.streak / 2)) out.push(r3(t));
  return out;
}

export async function prepare(ctx) {
  const { plan, work, run, dur } = ctx;
  const stamp = join(work, "grade.txt"), was = existsSync(stamp) ? readFileSync(stamp, "utf8") : null;
  if (was !== GRADE) // the grade is baked in at prep
    throw new Error(was ? 'the footage was graded by another version of this look: run "prep" again'
      : `the footage's grade wasn't recorded (prepared by an older version): run "prep" again`);
  const s = schedule(plan, dur);
  for (const c of ctx.captions ?? []) {
    if (c.star === undefined) continue;
    const word = c.text.split(" ")[c.star] ?? "", bad = missing(word, SERIF[1]);
    if (bad.length) throw new Error(`the starred word "${word}" uses ${bad.join(" ")}, which ${SERIF[0]} can't draw: ` +
      "star another word in transcript.json");
  }

  const subject = await cutOut(ctx);
  const at = (t) => headAt(run, subject, clamp(t, 0, dur - 0.05));
  const shown = { captions: (ctx.captions ?? []).length > 0, pill: s.pills.length > 0 };
  const heads = [];
  if (shown.captions || shown.pill) for (const t of sampleTimes(s.scenes, dur)) heads.push(await at(t));
  const layout = layoutFor(heads, shown.pill);
  const none = noHeadNote(heads, trusted, [shown.captions && "the captions", shown.pill && "the pill"].filter(Boolean).join(" and "));
  if (none) console.warn(none);
  const low = offSafe(layout, shown);
  if (low.length)
    console.warn(`[goat] note: ${low.join(" and ")} sit below the safe area, where the app's own text can cover them: ` +
      "the face fills the screen. Film from the chest up, with the chin about halfway down the screen.");
  for (const c of s.cards)
    if (onHead(await at(c.start + 0.3), c.rows.length))
      console.warn(`[goat] note: the glass card "${c.rows.join(" / ")}" at ${s2(c.start)} s sits on the speaker's head. ` +
        "Film with more room above the head, or keep the head left of the middle.");
  return { ...s, ...layout, T };
}

// v1's events at about 30% of its levels (Saagii, 15 Nov); members raise them with "sfx": {"volume": …}. A swish
// with each streak (0.3 s before its middle), a shimmer as the glass card rises (not for one up from frame 0), a
// softer one as each step card rises. The newer scenes at the same soft levels: a shimmer as a news badge or a big
// word lands, one typing sound as long as a chat message types, a notify as its reply comes, a whoosh as a compare's
// arrow draws, a tick as each list item ticks; a quote stays quiet. None starts within 0.5 s of the last
// one kept, or while the typing sound plays.
export function sfx(plan, ctx) {
  const { cards, scenes } = schedule(plan, ctx.dur);
  const ev = [];
  for (const c of cards) if (c.start >= AT0) ev.push({ sound: "shimmer", at: r3(c.start), volume: 0.15 });
  for (const sc of scenes) {
    ev.push({ sound: "swish", at: r3(sc.start - 0.3), volume: 0.21 });
    for (const x of sc.steps ?? []) ev.push({ sound: "shimmer", at: r3(x.start), volume: 0.09 });
    if (sc.news?.badge) ev.push({ sound: "shimmer", at: sc.news.t.badge, volume: 0.15 });
    if (sc.chat) {
      const t = sc.chat.t;
      ev.push({ sound: "type", at: t.type, dur: r3(t.typed - t.type), volume: 0.2 }, { sound: "notify", at: t.reply, volume: 0.15 });
    }
    if (sc.big) ev.push({ sound: "shimmer", at: sc.big.t.text, volume: 0.15 });
    if (sc.compare) ev.push({ sound: "whoosh", at: sc.compare.t.arrow, volume: 0.15 });
    for (const at of sc.list?.t.ticks ?? []) ev.push({ sound: "tick", at, volume: 0.15 });
    if (!sc.stays) ev.push({ sound: "swish", at: r3(sc.end - 0.3), volume: 0.21 });
  }
  const out = [];
  for (const e of ev.sort((a, b) => a.at - b.at)) {
    const p = out.at(-1);
    if (!p || e.at >= p.at + Math.max(0.5, p.dur ?? 0) - 1e-9) out.push(e);
  }
  return out;
}
