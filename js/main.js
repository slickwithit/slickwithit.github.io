/* =========================================================
   Portfolio 2026 · interactions & motion
   (shared by index.html and case-study.html — every block checks its elements exist)
   ========================================================= */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- torn paper edges ---------- */
// small seeded random so the tear looks the same on every load
function seeded(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// data-tear="top" | "bottom" | "" (both edges)
// a real tear is a slow wobble + fine fibre jitter + the odd deeper bite, and the paper's white core shows past the
// printed surface. so each edge has two lines: the element is clipped to the outer (fibre) line, and its ::before,
// which carries the actual paper / ink, is clipped to the inner line via --tear-inner
function tear(el, seed = 7) {
  const rand = seeded(seed);
  const edge = el.dataset.tear;
  const edgeLine = () => {
    const ph1 = rand() * 6.28, ph2 = rand() * 6.28;
    const f1 = 1.5 + rand() * 2, f2 = 6 + rand() * 5;
    const depth = (x) => {
      let d = 20 + 9 * Math.sin((x / 100) * f1 * 6.28 + ph1) + 4 * Math.sin((x / 100) * f2 * 6.28 + ph2) + rand() * 3;
      if (rand() < 0.05) d += 3 + rand() * 8;
      const fibre = 2 + rand() * 4 + (rand() < 0.1 ? 3 + rand() * 3 : 0);
      return [x, d, Math.max(0, d - fibre)];
    };
    const pts = [];
    for (let x = 0; x < 100; x += 0.3 + rand() * 0.6) pts.push(depth(x));
    pts.push(depth(100));
    return pts;
  };
  const top = edge !== "bottom" ? edgeLine() : null;
  const bottom = edge !== "top" ? edgeLine() : null;
  const poly = (k) => {
    const t = top ? top.map((p) => `${p[0].toFixed(2)}% ${p[k].toFixed(1)}px`) : ["0% 0px", "100% 0px"];
    const b = bottom ? bottom.map((p) => `${p[0].toFixed(2)}% calc(100% - ${p[k].toFixed(1)}px)`).reverse() : ["100% 100%", "0% 100%"];
    return `polygon(${[...t, ...b].join(",")})`;
  };
  el.style.clipPath = poly(2);
  el.style.setProperty("--tear-inner", poly(1));
}
$$("[data-tear]").forEach((el, i) => tear(el, 11 + i * 3));

/* ---------- filter chips: show/hide work by area ---------- */
$$(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    $$(".chip").forEach((c) => c.classList.remove("is-on"));
    chip.classList.add("is-on");
    const area = chip.textContent.trim().toLowerCase();
    $$(".sheet").forEach((s) => {
      s.hidden = area !== "all" && s.dataset.area !== area;
    });
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
});

/* ---------- certifications: top 3 show, "+ 5 more" opens the rest ---------- */
const certsMore = $(".certs-more");
if (certsMore) {
  const extras = $$(".cert-extra");
  certsMore.addEventListener("click", () => {
    const open = certsMore.getAttribute("aria-expanded") !== "true";
    extras.forEach((li) => { li.hidden = !open; });
    certsMore.setAttribute("aria-expanded", open);
    certsMore.textContent = open ? "show less" : `+ ${extras.length} more`;
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
}

/* ---------- feature clips: loop silently while on screen, pause when scrolled away ---------- */
const clips = $$("video[data-inview]");
if (clips.length && "IntersectionObserver" in window) {
  if (reduceMotion) clips.forEach((v) => (v.controls = true));
  else {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause())), { threshold: 0.4 });
    clips.forEach((v) => io.observe(v));
  }
}

/* ---------- poster lightbox ---------- */
const lightbox = $(".lightbox");
if (lightbox) {
  const box = $(".lightbox-imgs", lightbox);
  $$("[data-full]").forEach((btn) => {
    btn.addEventListener("click", () => {
      // data-full="a.jpg|b.jpg" shows both (front + back); data-layout="stack" puts wide designs one above the other
      const srcs = btn.dataset.full.split("|");
      box.replaceChildren(...srcs.map((src) => Object.assign(new Image(), { src, alt: $("img", btn)?.alt || "" })));
      box.dataset.layout = srcs.length > 1 ? btn.dataset.layout || "row" : "";
      $(".lightbox-concept", lightbox).textContent = btn.dataset.concept || "";
      lightbox.classList.toggle("has-concept", !!btn.dataset.concept);
      lightbox.showModal();
    });
  });
  lightbox.addEventListener("click", () => lightbox.close());
}

/* ---------- the cat: a note that types itself, and a reaction on every click ---------- */
const catBtn = $(".cat-o");
if (catBtn) {
  const cat = $(".cat", catBtn);
  const out = $(".cat-msg-text", catBtn);
  const firstLine = "hiya! click me, i don't bite (much)";
  const lines = [
    "ok you found the secret ✦",
    "pet me again, i dare you",
    "10/10 would hire her",
    "so... you hired her already?",
    "ok but have you hired her yet",
    "hire her already, i'm hungry",
    "i'm the brand mascot now",
    "psst... the work is below ↓",
    "yes, the tongue is on purpose",
    "that tickles",
    "brb, blinking",
    "she's lowkey great at this",
  ];
  let timer = null;
  let last = -1;
  const type = (text) => {
    clearInterval(timer);
    out.textContent = "";
    if (reduceMotion) { out.textContent = text; return; }
    let i = 0;
    timer = setInterval(() => {
      out.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(timer);
    }, 50);
  };
  // restart the blink + tongue loops together so they stay in sync after a reaction
  const resync = () => {
    $$(".lid, .cat-tongue", cat).forEach((el) => {
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animation = "";
    });
  };
  const react = () => {
    const moves = ["wink", "lick", "happy", "jump"];
    const move = moves[Math.floor(Math.random() * moves.length)];
    cat.classList.remove("is-reacting", "is-wink", "is-lick", "is-happy");
    void cat.offsetWidth;
    if (move === "jump" && window.gsap && !reduceMotion) {
      gsap.timeline()
        .to(cat, { yPercent: -20, scaleX: 0.94, scaleY: 1.06, duration: 0.22, ease: "power2.out" })
        .to(cat, { yPercent: 0, scaleX: 1.08, scaleY: 0.92, duration: 0.2, ease: "power2.in" })
        .to(cat, { scaleX: 1, scaleY: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" });
      return;
    }
    cat.classList.add("is-reacting", `is-${move}`);
    setTimeout(() => {
      cat.classList.remove("is-reacting", `is-${move}`);
      resync();
    }, 950);
  };
  // a little nudge every few seconds until someone pets the cat for the first time
  let nudge = null;
  if (window.gsap && !reduceMotion) {
    nudge = gsap.timeline({ repeat: -1, repeatDelay: 3.5, delay: 3.5 })
      .to(cat, { rotate: -10, duration: 0.12, ease: "power1.out" })
      .to(cat, { rotate: 9, duration: 0.12 })
      .to(cat, { rotate: -6, duration: 0.1 })
      .to(cat, { rotate: 0, duration: 0.3, ease: "elastic.out(1, 0.4)" });
  }
  const onPet = () => {
    if (nudge) { nudge.kill(); nudge = null; gsap.set(cat, { rotate: 0 }); }
    let n;
    do { n = Math.floor(Math.random() * lines.length); } while (n === last);
    last = n;
    type(lines[n]);
    react();
  };
  catBtn.addEventListener("click", (e) => { if (!e.target.closest(".cat-msg")) onPet(); });
  catBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPet(); }
  });
  // the first note shows up on its own once the title has landed
  setTimeout(() => {
    type(firstLine);
    $(".cat-msg", catBtn).style.opacity = 1;
    if (window.gsap && !reduceMotion) {
      gsap.fromTo(".cat-msg", { opacity: 0, y: 10, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(2)" });
      gsap.fromTo(".cat-msg-arrow path", { strokeDasharray: 160, strokeDashoffset: 160 }, { strokeDashoffset: 0, duration: 0.6, ease: "power2.out" });
    }
  }, reduceMotion ? 0 : 1700);
}

/* ---------- growth chart: built from the numbers on the figure, so new months are a one-line change ---------- */
function drawGrowthChart(fig) {
  const months = fig.dataset.months.split(",");
  const views = fig.dataset.views.split(",").map(Number);
  const follows = fig.dataset.follows.split(",").map(Number);
  const max = +fig.dataset.max;
  const area = $(".chart-area", fig);
  const line = $(".chart-line", fig);
  const pts = $(".chart-points", fig);
  const tip = $(".chart-tip", fig);
  const cross = $(".chart-cross", fig);
  const fmt = (v) => (v >= 1e6 ? (v / 1e6).toFixed(2) + "M" : v >= 1e4 ? Math.round(v / 1e3) + "K" : v >= 1e3 ? (v / 1e3).toFixed(1) + "K" : String(v));
  // dots sit in the middle of equal columns, so the first and last never touch the edge
  const xAt = (i) => ((i + 0.5) / months.length) * 100;
  const yAt = (v) => 100 - (v / max) * 100;
  const peak = views.indexOf(Math.max(...views));
  const labelled = new Set([0, peak, views.length - 1]); // direct labels: where it started, the peak, where it is now
  line.setAttribute("d", views.map((v, i) => (i ? "L" : "M") + xAt(i).toFixed(2) + " " + yAt(v).toFixed(2)).join(" "));
  $(".chart-note", fig).style.right = 100 - xAt(peak) + 3 + "%";

  const rows = $("tbody", fig);
  const axis = $(".chart-x", fig);
  months.forEach((m, i) => {
    const pt = document.createElement("span");
    pt.className = "chart-pt";
    pt.tabIndex = 0;
    pt.style.left = xAt(i) + "%";
    pt.setAttribute("aria-label", `${m} 2026: ${fmt(views[i])} views, ${fmt(follows[i])} new follows`);
    const dot = document.createElement("i");
    dot.className = "chart-dot";
    dot.style.top = yAt(views[i]) + "%";
    pt.append(dot);
    if (labelled.has(i)) {
      const val = document.createElement("span");
      val.className = "chart-val";
      val.style.top = yAt(views[i]) + "%";
      val.textContent = fmt(views[i]);
      pt.append(val);
    }
    const show = () => {
      area.classList.add("is-hover");
      cross.style.left = xAt(i) + "%";
      $("b", tip).textContent = fmt(views[i]) + " views";
      $("span", tip).textContent = `${m.toLowerCase()} 2026 · +${fmt(follows[i])} followers`;
      // keep the readout inside the chart: right of the line if it fits, else left of it, else pinned to the edge
      const W = area.clientWidth, x = (xAt(i) / 100) * W, tw = tip.offsetWidth;
      tip.style.left = Math.max(0, x + 14 + tw <= W ? x + 14 : x - 14 - tw) + "px";
      tip.style.top = "2%";
    };
    const hide = () => area.classList.remove("is-hover");
    pt.addEventListener("pointerenter", show);
    pt.addEventListener("pointerleave", hide);
    pt.addEventListener("focus", show);
    pt.addEventListener("blur", hide);
    pts.append(pt);

    const tick = document.createElement("span");
    tick.style.left = xAt(i) + "%";
    tick.textContent = m;
    axis.append(tick);
    const tr = document.createElement("tr");
    [m + " 2026", views[i].toLocaleString("en-IN"), follows[i].toLocaleString("en-IN")].forEach((c) => {
      const td = document.createElement("td");
      td.textContent = c;
      tr.append(td);
    });
    rows.append(tr);
  });

  if (reduceMotion || typeof gsap === "undefined") return;
  // the chart stretches to fit (non-scaling stroke), so measure the dash in screen pixels
  const w = area.clientWidth / 100, h = area.clientHeight / 100;
  const len = views.reduce((sum, v, i) => (i ? sum + Math.hypot((xAt(i) - xAt(i - 1)) * w, (yAt(v) - yAt(views[i - 1])) * h) : 0), 0) * 1.1;
  const st = { trigger: fig, start: "top 75%" };
  gsap.fromTo(line, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 2, ease: "power2.inOut", scrollTrigger: st });
  gsap.from($$(".chart-dot", fig), { scale: 0, duration: 0.4, ease: "back.out(3)", stagger: 0.2, delay: 0.3, clearProps: "transform", scrollTrigger: st });
  gsap.from($$(".chart-val", fig), { opacity: 0, duration: 0.5, stagger: 0.3, delay: 1, scrollTrigger: st });
  gsap.from($(".chart-note", fig), { opacity: 0, x: -20, duration: 0.8, delay: 2, scrollTrigger: st });
}

/* ---------- hover the photo → the next thought types itself into a note ---------- */
const photo = $(".hello-photo");
if (photo) {
  const out = $(".photo-msg-text", photo);
  const thoughts = [
    "pondering. always.",
    "2b is 2do",
    "stay silly",
    "wassup",
    "idk, vibes",
  ];
  let n = -1;
  let timer = null;
  const think = () => {
    n = (n + 1) % thoughts.length;
    const text = thoughts[n];
    clearInterval(timer);
    out.textContent = "";
    photo.classList.add("is-thinking");
    if (reduceMotion) { out.textContent = text; return; }
    let i = 0;
    timer = setInterval(() => {
      out.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(timer);
    }, 50);
  };
  const stop = () => { clearInterval(timer); photo.classList.remove("is-thinking"); };
  // the note rides along with the cursor
  const msg = $(".photo-msg", photo);
  const place = (e) => {
    const r = photo.getBoundingClientRect();
    // keep the note on screen: never further right than ~200px from the photo's right edge
    const x = Math.max(0, Math.min(e.clientX - r.left + 16, r.width - 200));
    msg.style.transform = `translate(${x}px, ${e.clientY - r.top + 18}px)`;
  };
  // mouse: hover in → she looks up + a thought types; hover out → back
  photo.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { place(e); think(); } });
  photo.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") place(e); });
  photo.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") stop(); });
  // touch (phones, tablets): each tap toggles: tap → look up + thought, tap again → back
  photo.addEventListener("pointerup", (e) => {
    if (e.pointerType === "mouse") return;
    if (photo.classList.contains("is-thinking")) stop();
    else { place(e); think(); }
  });
  // keyboard: tabbing onto the photo works like a hover
  photo.addEventListener("focus", () => { if (photo.matches(":focus-visible")) { msg.style.transform = "translate(8%, 102%)"; think(); } });
  photo.addEventListener("blur", stop);
}

/* ---------- split headline into letters ---------- */
$$("[data-split]").forEach((el) => {
  el.innerHTML = [...el.textContent].map((ch) => `<span class="char">${ch}</span>`).join("");
});

/* ---------- motion ---------- */
if (window.gsap && !reduceMotion) {
  gsap.registerPlugin(ScrollTrigger);

  // smooth scroll, synced with ScrollTrigger
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    // in-page links glide instead of jumping
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const target = a.getAttribute("href") === "#top" ? 0 : $(a.getAttribute("href"));
        if (target === null) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -80, duration: 1.4 });
      });
    });
  }

  /* home: title + hello intro */
  if ($(".sheet-top")) {
    const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
    intro
      .from(".site-header > *", { y: -30, opacity: 0, duration: 0.9, stagger: 0.08, clearProps: "transform,opacity" })
      .from(".title-meta span", { y: 14, opacity: 0, duration: 0.8, stagger: 0.1 }, "<0.1")
      .from(".hero-title .char", { yPercent: 110, rotate: 6, opacity: 0, duration: 1.2, stagger: 0.05 }, "<")
      .from(".cat-o .cat-art", { scale: 0, rotate: -40, duration: 1, ease: "back.out(2.2)" }, "<0.35")
      .from(".hello-photo .photo-frames", { y: 40, opacity: 0, duration: 1 }, "<0.2")
      .from(".selection", { scale: 0.9, opacity: 0, duration: 0.6, ease: "back.out(2)" }, "<0.3")
      .from(".selection .h", { scale: 0, duration: 0.35, stagger: 0.04, ease: "back.out(3)" }, "<0.15")
      .from(".hello-text > *, .hello-side > *", { y: 24, opacity: 0, duration: 0.7, stagger: 0.04 }, "<");

    // the black band: the portrait starts tucked behind the lower torn paper and pops up out of it (no overshoot past its spot)
    gsap.fromTo(".band-portrait", { yPercent: 100 }, {
      yPercent: 0, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: ".band-section", start: "top 65%", toggleActions: "play none none reverse" },
    });
    /* scroll handoff: PORTFOLIO steps back, HELLO grows into place */
    gsap.to(".title-block", {
      scale: 0.82, opacity: 0.35, yPercent: -12, ease: "none",
      scrollTrigger: { trigger: ".sheet-top", start: "top top", end: "+=520", scrub: true },
    });
    gsap.fromTo(".hello-title", { scale: 0.72 }, {
      scale: 1, ease: "none", transformOrigin: "0% 100%",
      scrollTrigger: { trigger: ".hello", start: "top bottom", end: "top 30%", scrub: true },
    });
  } else {
    gsap.from(".site-header > *", { y: -30, opacity: 0, duration: 0.9, stagger: 0.08, ease: "expo.out", clearProps: "transform,opacity" });
  }

  /* tickers: endless loop that speeds up + flips direction with scroll */
  $$(".ticker").forEach((ticker) => {
    const track = $(".ticker-track", ticker);
    ticker.append(track.cloneNode(true), track.cloneNode(true));
    const loop = gsap.to($$(".ticker-track", ticker), { xPercent: -100, duration: 22, ease: "none", repeat: -1 });
    loop.totalTime(22 * 500); // head start so reversing (scrolling up) never hits the start
    if (!lenis) return;
    let dir = 1;
    lenis.on("scroll", ({ velocity, direction }) => {
      if (direction) dir = direction;
      const speed = gsap.utils.clamp(1, 6, 1 + Math.abs(velocity) * 0.25);
      gsap.to(loop, { timeScale: speed * dir, duration: 0.2, overwrite: true });
      gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.25 });
    });
  });

  /* section titles + notes: arrive as you reach them */
  $$(".section-title, .tape-title").forEach((title) => {
    gsap.fromTo(title, { scale: 0.72, opacity: 0.2 }, {
      scale: 1, opacity: 1, ease: "none",
      scrollTrigger: { trigger: title, start: "top bottom", end: "top 35%", scrub: true },
    });
  });
  $$(".section-note, .filters").forEach((el) => {
    gsap.from(el, { scrollTrigger: { trigger: el, start: "top 88%" }, y: 20, opacity: 0, duration: 0.7, ease: "expo.out", delay: 0.15 });
  });

  /* work polaroids drop in */
  if ($(".sheets")) {
    gsap.from(".sheet", {
      scrollTrigger: { trigger: ".sheets", start: "top 85%" },
      y: 120, rotate: (i) => (i % 2 ? 10 : -10), opacity: 0, duration: 1.1, stagger: 0.12, ease: "expo.out",
    });
  }

  /* poster wall: posters fly in from a messy pile and settle on the wall */
  if ($(".pins")) {
    gsap.from(".pins .pin", {
      scrollTrigger: { trigger: ".pins", start: "top 80%" },
      x: (i) => (i % 3 - 1) * -160,
      y: 220,
      rotate: (i) => [-24, 18, -12, 22, -18, 14][i % 6],
      scale: 0.8,
      opacity: 0,
      duration: 1.3,
      stagger: 0.1,
      ease: "expo.out",
    });
  }

  /* by the numbers: notes slap on, numbers count up, the growth line draws itself */
  if ($(".numbers")) {
    gsap.from(".stat-note", {
      scrollTrigger: { trigger: ".stat-board", start: "top 85%" },
      y: 80, rotate: (i) => [-14, 10, -8, 12][i % 4], scale: 1.15, opacity: 0, duration: 0.9, stagger: 0.1, ease: "back.out(1.8)",
    });
    // count-up only runs once a real number is filled into data-count
    $$(".stat-num[data-count]").forEach((el) => {
      const end = parseFloat(el.dataset.count);
      if (Number.isNaN(end)) return;
      const decimals = (el.dataset.count.split(".")[1] || "").length;
      const pre = el.dataset.prefix || "";
      const suf = el.dataset.suffix || "";
      const n = { v: 0 };
      gsap.to(n, {
        v: end, duration: 1.8, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%" },
        onUpdate: () => { el.textContent = pre + n.v.toFixed(decimals) + suf; },
      });
    });
    const chart = $(".growth-chart[data-views]");
    if (chart) drawGrowthChart(chart);
  }

  /* contact + case study blocks */
  $$("[data-reveal]").forEach((el) => {
    gsap.from(el, { scrollTrigger: { trigger: el, start: "top 85%" }, y: 60, rotate: el.dataset.reveal === "tilt" ? -6 : 0, opacity: 0, duration: 1, ease: "expo.out" });
  });
  $$("[data-reveal-stagger]").forEach((wrap) => {
    gsap.from(wrap.children, { scrollTrigger: { trigger: wrap, start: "top 85%" }, y: 30, opacity: 0, duration: 0.7, stagger: 0.08, ease: "expo.out" });
  });
  $$(".page-write").forEach((el) => {
    gsap.fromTo(el, { clipPath: "inset(-20% 100% -20% 0)" },
      { clipPath: "inset(-20% 0% -20% 0)", duration: 1.1, ease: "power2.inOut", scrollTrigger: { trigger: el, start: "top 85%" } });
  });

  /* cards tilt toward the cursor */
  $$(".sheet, .pin").forEach((card) => {
    const base = parseFloat(getComputedStyle(card).getPropertyValue("--r")) || 0;
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, { rotateY: px * 10, rotateX: -py * 10, rotate: 0, y: -8, transformPerspective: 900, duration: 0.5, ease: "power3.out" });
    });
    card.addEventListener("mouseleave", () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, rotate: base, y: 0, duration: 0.8, ease: "elastic.out(1, 0.5)" });
    });
  });
}
