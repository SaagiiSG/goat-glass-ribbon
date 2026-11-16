// 14 Glass Ribbon. Reads window.PLAN (goat.mjs writes it; look.mjs works out the cards, pills and step scenes on the
// frame grid and the caption spot under the face) and builds one paused GSAP timeline.
const P = window.PLAN, T = P.T, D = P.dur;
const $ = (s) => document.querySelector(s);
const el = (tag, cls, parent, text) => {
  const e = parent.appendChild(document.createElement(tag));
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
const tl = gsap.timeline({ paused: true });
const FIRST = 1 / 60; // a card or caption from frame 0 is there on frame 0, without coming in

// The ribbon floats 30 px up and back every 8 s (v1's; the preview's 6 px is at phone size). Each orb bobs 40 px over
// 16 s (the preview's 8 s each way, started 0, 3 and 5 s in) and sways 12 px sideways on its own seeded period, so
// nothing moves in step. Each motion is one tween over the whole video with the wave as its ease.
const wave = (period, phase) => (p) => (1 - Math.cos((2 * Math.PI * (p * D + phase)) / period)) / 2;
const sway = (period, phase) => (p) => Math.sin((2 * Math.PI * (p * D + phase)) / period);
tl.fromTo("#ribbon", { y: 0 }, { y: -30, duration: D, ease: wave(8, 0) }, 0);
document.querySelectorAll(".orb").forEach((o, i) => {
  const r = GOAT.rng(1400 + i), period = 6 + 3 * r();
  tl.fromTo(o, { y: 0 }, { y: -40, duration: D, ease: wave(16, [0, 3, 5][i]) }, 0);
  tl.fromTo(o, { x: 0 }, { x: 12, duration: D, ease: sway(period, r() * period), immediateRender: false }, 0);
});

// The glass card rises 30 px and grows from 95% in 0.48 s; it fades over its last 0.32 s (the preview's grglass).
const titles = P.cards.map((c) => {
  const e = el("div", "glass card", $("#cards")), b = el("b", "", e);
  for (const r of c.rows) el("span", "", b, r);
  el("i", "", e).style.width = "85%";
  el("i", "", e).style.width = "55%";
  if (c.start < FIRST) gsap.set(e, { opacity: 1 });
  else tl.fromTo(e, { opacity: 0, y: 30, scale: 0.95 },
    { opacity: 1, y: 0, scale: 1, duration: T.cardIn, ease: "power2.out", immediateRender: false }, c.start);
  if (!c.stays) tl.fromTo(e, { opacity: 1 }, { opacity: 0, duration: T.out, ease: "power1.in", immediateRender: false }, c.end - T.out);
  return b;
});

// The pill rises 20 px in 0.32 s over the captions and fades over its last 0.32 s (the preview's grcap).
const pills = P.pills.map((p) => {
  const row = el("div", "pill-row", $("#pills"));
  el("span", "pill", row, p.text);
  if (p.start < FIRST) gsap.set(row, { opacity: 1 });
  else tl.fromTo(row, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: T.rise, ease: "power2.out", immediateRender: false }, p.start);
  if (!p.stays) tl.fromTo(row, { opacity: 1 }, { opacity: 0, duration: T.out, ease: "power1.in", immediateRender: false }, p.end - T.out);
  return row;
});

// A scene: a soft violet streak sweeps across at an even speed (0.8 s from off screen to off screen, about 0.6 s in
// view, its middle at the switch) while the backdrop crossfades in over 0.5 s, eased, centred on it; the same way
// back. On the backdrop: the preview's glowing line, two orbs drifting, and what acts out the speech. Captions keep
// their height throughout.
gsap.set("#streak", { xPercent: -100 });
const streak = (at) => tl.fromTo("#streak", { xPercent: -100 },
  { xPercent: 100, duration: T.streak, ease: "none", immediateRender: false }, at - T.streak / 2);
const fade = (e, from, at) =>
  tl.fromTo(e, { opacity: from }, { opacity: 1 - from, duration: T.fade, ease: "sine.inOut", immediateRender: false }, at - T.fade / 2);
const ease = (e, from, to, at, duration, how = "power2.out") =>
  tl.fromTo(e, from, { ...to, duration, ease: how, immediateRender: false }, at);
const labels = [], headlines = [], bigs = [], quotes = [], afters = [];
const RISE = [{ opacity: 0, y: 40, scale: 0.97 }, { opacity: 1, y: 0, scale: 1 }]; // a glass panel rising
const BLUR = [{ opacity: 0, y: 26, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)" }]; // a word rising out of a blur
const words = (parent, rows, times, dur) => {
  let k = 0;
  for (const row of rows) {
    const r = el("div", "", parent);
    row.forEach((w, j) => {
      if (j) r.append(" ");
      ease(el("span", "word", r, w), ...BLUR, times[k++], dur);
    });
  }
};

// steps: numbered glass cards rise 30 px in 0.5 s along the line, each at its step's start (the preview's grg1-3)
function steps(s, sc) {
  sc.steps.forEach((x, n) => {
    const g = el("div", `glass step s${n + 1}`, s);
    el("b", "", g, String(n + 1).padStart(2, "0"));
    labels.push(el("span", "", g, x.text));
    ease(g, { opacity: 0, y: 30 }, { opacity: 1, y: 0 }, x.start, T.stepIn);
  });
}

// news: a big glass panel rises under the wipe; the badge lands softly, the headline builds word by word (each rising out of a
// blur), the line follows, then a soft sweep of light crosses the glass
function news(s, { rows, badge, line, t }) {
  const N = T.news, p = el("div", "glass news", s);
  ease(p, ...RISE, t.panel, N.panelIn);
  if (badge) ease(el("div", "badge", p, badge), { opacity: 0, scale: 0.8, y: 10 }, { opacity: 1, scale: 1, y: 0 }, t.badge, N.badgeIn, "back.out(1.4)");
  const h = el("div", "headline", p);
  words(h, rows, t.words, N.wordIn);
  headlines.push(h);
  if (line) ease(el("div", "nline", p, line), { opacity: 0, y: 14 }, { opacity: 1, y: 0 }, t.line, N.wordIn);
  const sheen = el("div", "sheen", p);
  gsap.set(sheen, { xPercent: -100 });
  ease(sheen, { xPercent: -100 }, { xPercent: 100 }, t.sheen, N.sheen, "sine.inOut");
}

// chat: a glass chat app rises under the wipe (back arrow, avatar with an online dot, the name from the speech or two
// soft lines, a menu); the speaker's question types itself into a violet bubble, three dots breathe in a glass
// bubble and fade, then the bigger reply rises in their place
function chat(s, { message, reply, name, t }) {
  const C = T.chat, w = el("div", "glass chat", s);
  w.innerHTML = '<div class="chat-head"><span class="chev"></span><span class="avatar"></span><span class="who"></span><span class="kebab"></span></div>';
  const who = w.querySelector(".who");
  if (name) el("b", "", who, name);
  el("i", "", who);
  if (!name) el("i", "", who);
  ease(w, { opacity: 0, y: 40, scale: 0.97 }, { opacity: 1, y: 0, scale: 1 }, t.window, C.windowIn);
  const msgs = el("div", "msgs", w), me = el("div", "bubble me", msgs);
  ease(me, { opacity: 0, y: 12 }, { opacity: 1, y: 0 }, t.type - 0.15, 0.25);
  let k = 0;
  message.forEach((row) => {
    const r = el("div", "", me);
    for (const ch of row) {
      const letter = el("span", "letter", r);
      letter.textContent = ch; // not el()'s text: a space must stay a space
      tl.set(letter, { opacity: 1 }, t.type + k++ / t.cps);
    }
  });
  const slot = el("div", "slot", msgs), bot = el("div", "bubble bot", slot), dots = el("div", "bubble bot dots", slot);
  reply.forEach((row) => el("div", "", bot, row));
  const len = t.dotsOut + C.dotsOut - t.dots;
  for (let j = 0; j < 3; j++)
    ease(el("span", "", dots), { opacity: 0.35 }, { opacity: 1 }, t.dots, len, (p) => 0.5 - 0.5 * Math.cos(2 * Math.PI * (p * len / 0.6 - j / 3)));
  ease(dots, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }, t.dots, 0.2);
  ease(dots, { opacity: 1 }, { opacity: 0 }, t.dotsOut, C.dotsOut, "power1.in"); // gone before the reply shows
  ease(bot, { opacity: 0, y: 20 }, { opacity: 1, y: 0 }, t.reply, C.replyIn);
}

// big: one word or number on a glass panel, blurring in out of a soft violet glow; a number of 10 or more counts up
// (eased, a frame at a time) as it lands; its line rises under it
function big(s, { text, line, count, t }) {
  const B = T.big, p = el("div", "glass panel bigp", s);
  ease(p, ...RISE, t.panel, B.panelIn);
  const b = el("div", "bigword", p, text); // the final text: layout() sizes it
  ease(b, { opacity: 0, scale: 0.9, filter: "blur(18px)" }, { opacity: 1, scale: 1, filter: "blur(0px)" }, t.text, B.textIn, "power3.out");
  if (count) {
    const n = Math.round(B.count * 30), show = (v) => `${count.before}${v}${count.after}`;
    tl.set(b, { textContent: show(count.from) }, t.text);
    for (let k = 1; k < n; k++) tl.set(b, { textContent: show(Math.round(count.to * (1 - (1 - k / n) ** 3))) }, t.text + k / 30);
    tl.set(b, { textContent: text }, t.text + n / 30); // the last frame is the approved text itself
  }
  if (line) ease(el("div", "bigline", p, line), { opacity: 0, y: 14 }, { opacity: 1, y: 0 }, t.line, B.lineIn);
  bigs.push(b);
}

// quote: a big violet quotation mark, then their words write in one by one in Cormorant italic on a glass panel
function quote(s, { rows, t }) {
  const Q = T.quote, p = el("div", "glass panel quotep", s);
  ease(p, ...RISE, t.panel, Q.panelIn);
  ease(el("div", "qmark", p, "\u201C"), { opacity: 0, y: 20 }, { opacity: 1, y: 0 }, t.mark, 0.4);
  const h = el("div", "quote", p);
  words(h, rows, t.words, Q.wordIn);
  quotes.push(h);
}

// compare: the before card (dimmer, Inter), a glowing arrow drawing down, then the after card landing (Cormorant)
function compare(s, { before, after, t }) {
  const C = T.compare, box = el("div", "compare", s);
  const a = el("div", "glass cmp before", box), at = el("div", "", a);
  for (const r of before) el("div", "", at, r);
  ease(a, ...RISE, t.panel, C.panelIn);
  ease(at, { opacity: 0 }, { opacity: 1 }, t.text, C.textIn, "power1.out");
  const arrow = el("div", "arrow", box);
  arrow.innerHTML = '<svg viewBox="0 0 80 120" aria-hidden="true"><path d="M40 8 V104 M16 80 L40 106 L64 80" stroke-dasharray="170" stroke-dashoffset="170" /></svg>';
  ease(arrow.querySelector("path"), { attr: { "stroke-dashoffset": 170 } }, { attr: { "stroke-dashoffset": 0 } }, t.arrow, C.arrowIn, "power2.inOut");
  const b = el("div", "glass cmp after", box), bt = el("div", "", b); // bt: fitted in layout(), 80 px down to 60
  for (const r of after) el("div", "", bt, r);
  afters.push(bt);
  ease(b, { opacity: 0, y: 30, scale: 0.96 }, { opacity: 1, y: 0, scale: 1 }, t.after, C.afterIn);
}

// list: each item slides in with an empty glass ring, then the ring fills violet and a tick draws in it
function list(s, { items, t }) {
  const L = T.list, p = el("div", "glass panel listp", s);
  ease(p, ...RISE, t.panel, L.panelIn);
  items.forEach((it, k) => {
    const row = el("div", "item", p), ring = el("span", "ring", row);
    ring.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M13 25 L21 33 L36 16" stroke-dasharray="40" stroke-dashoffset="40" /></svg>';
    el("span", "", row, it);
    ease(row, { opacity: 0, x: -24 }, { opacity: 1, x: 0 }, t.items[k], L.itemIn);
    ease(ring, { backgroundColor: "rgba(255, 255, 255, 0.06)" }, { backgroundColor: "rgba(139, 92, 246, 0.95)" }, t.ticks[k], L.tickIn);
    ease(ring.querySelector("path"), { attr: { "stroke-dashoffset": 40 } }, { attr: { "stroke-dashoffset": 0 } }, t.ticks[k], L.tickIn);
  });
}

const KINDS = { news: (s, sc) => news(s, sc.news), chat: (s, sc) => chat(s, sc.chat), big: (s, sc) => big(s, sc.big),
  quote: (s, sc) => quote(s, sc.quote), compare: (s, sc) => compare(s, sc.compare), list: (s, sc) => list(s, sc.list), steps };

P.scenes.forEach((sc, i) => {
  const s = el("div", "scene", $("#scenes"));
  // .p2's line: #C084FC, 8 px, with a 10 px #A855F7 glow under it; two orbs from the speaker's side drift here too
  s.innerHTML = `<svg viewBox="0 0 1080 1920" aria-hidden="true"><defs><filter id="glow-${i}" x="-10%" y="-10%" width="120%"
    height="120%"><feGaussianBlur stdDeviation="5" /></filter></defs><path d="M-40 1300 C 260 1180, 380 900, 600 760 S 900 520,
    1120 470" fill="none" stroke="#A855F7" stroke-width="10" filter="url(#glow-${i})" /><path d="M-40 1300 C 260 1180, 380 900,
    600 760 S 900 520, 1120 470" fill="none" stroke="#C084FC" stroke-width="8" /></svg>
    <span class="orb" style="left: 70px; top: 330px; width: 150px; height: 150px"></span>
    <span class="orb" style="left: 850px; top: 1090px; width: 120px; height: 120px"></span>`;
  s.querySelectorAll(".orb").forEach((o, j) =>
    tl.fromTo(o, { y: 0 }, { y: -40, duration: D, ease: wave(9 + 3 * j, 2 * j), immediateRender: false }, 0));
  KINDS[sc.kind](s, sc);
  streak(sc.start);
  fade(s, 0, sc.start);
  if (sc.stays) return;
  streak(sc.end);
  fade(s, 1, sc.end);
});

// Captions: plain white, the starred word in big Cormorant italic, a hard swap, no animation
const caps = P.captions.map((c) => {
  const e = el("div", "cap", $("#caps")), line = el("span", "", e);
  c.text.split(" ").forEach((w, i) => {
    if (i) line.append(" ");
    if (i === c.star) el("em", "", line, w);
    else line.append(w);
  });
  if (c.start < FIRST) gsap.set(e, { opacity: 1 });
  else tl.set(e, { opacity: 1 }, c.start);
  tl.set(e, { opacity: 0 }, c.end);
  return e;
});

tl.set({}, {}, D);
window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;

// Sizes need the real fonts; the renderer waits for document.fonts.ready before the first frame. Each shrinks to its
// width down to the floor look.mjs's row limits are measured at: card title 388 px from 44 to 28, step 423 px from 32
// to 28, news headline 748 px from 104 to 56, big word 748 px from 220 to 100, quote 748 px from 84 to 56, a compare's
// after 748 px from 80 to 60, captions 840 px (the safe box) from 54.
function layout() {
  titles.forEach((b) => GOAT.fit(b, 388, 44, 28));
  labels.forEach((l) => GOAT.fit(l, 423, 32, 28));
  headlines.forEach((h) => GOAT.fit(h, 748, 104, 56));
  bigs.forEach((b) => GOAT.fit(b, 748, 220, 100));
  quotes.forEach((q) => GOAT.fit(q, 748, 84, 56));
  afters.forEach((a) => GOAT.fit(a, 748, 80, 60));
  caps.forEach((e) => {
    GOAT.fit(e.firstChild, 840, 54);
    e.style.top = `${P.capY - e.offsetHeight / 2}px`;
  });
  pills.forEach((r) => { r.style.top = `${P.pillY - r.offsetHeight / 2}px`; });
}
layout();
document.fonts.ready.then(layout);
