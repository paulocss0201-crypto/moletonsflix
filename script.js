/* ============ MOLETONS FLIX ============ */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  /* ---------------------------------------------------------------
   * Fotos dos moletons (recortadas, fundo transparente) em /img
   * ------------------------------------------------------------- */
  const IMG = {
    preto: "img/preto.webp",
    cinza: "img/cinza.webp",
    offwhite: "img/offwhite.webp",
    marinho: "img/marinho.webp",
    grafite: "img/grafite.webp",
  };
  const pic = (key, alt = "", eager = false) =>
    `<img src="${IMG[key]}" alt="${alt}" ${eager ? "" : 'loading="lazy"'} decoding="async" draggable="false" />`;

  /* ---------------------------------------------------------------
   * Composições editoriais "de estúdio"
   * ------------------------------------------------------------- */
  const BACKDROPS = {
    "studio-light": ["#ededea", "#d4d4cf", "#111"],
    "studio-white": ["#fbfbfa", "#e4e4e1", "#111"],
    "studio-dark": ["#2a2a2a", "#0b0b0b", "#fff"],
    "studio-gray": ["#d8d9db", "#b6b8bb", "#111"],
  };

  function studioPhoto(el) {
    if (el.dataset.model) {
      // foto de modelo: fundo branco da foto vira o tom do quadro (multiply)
      el.classList.add("is-model");
      el.style.background = el.dataset.tone || "#efefed";
      el.innerHTML = `
        ${el.dataset.word ? `<span class="photo-word" style="color:#111">${el.dataset.word}</span>` : ""}
        <img class="model-img" src="img/modelo-${el.dataset.model}.webp" alt="Modelo vestindo moletom oversize ${el.dataset.model}" loading="lazy" decoding="async" />`;
      return;
    }
    const [c1, c2, ink] = BACKDROPS[el.dataset.bg] || BACKDROPS["studio-light"];
    const tall = el.classList.contains("tall");
    const keys = [el.dataset.img, el.dataset.duo].filter(Boolean);
    el.style.background = `radial-gradient(ellipse at 50% 38%, ${c1}, ${c2} 75%)`;
    el.innerHTML = `
      <span class="photo-word" style="color:${ink}">${tall ? "FLIX" : "OVERSIZE"}</span>
      <span class="photo-shadow"></span>
      <div class="photo-pieces${keys.length > 1 ? " duo" : ""}">${keys.map((k) => pic(k, "Moletom oversize " + k)).join("")}</div>`;
  }
  $$(".photo").forEach(studioPhoto);

  /* ---------------------------------------------------------------
   * Hero 3D carousel
   * ------------------------------------------------------------- */
  const RING_COLORS = ["preto", "cinza", "offwhite", "marinho", "grafite", "preto", "cinza", "offwhite", "marinho", "grafite"];
  const ring = $("#ring");
  const hero = $("#hero");
  const heroText = $(".hero-text");
  const heroFoot = $(".hero-foot");
  const floorShadow = $(".floor-shadow");
  const heroAfter = $("#heroAfter");
  const N = RING_COLORS.length;
  const cards = RING_COLORS.map((key) => {
    const d = document.createElement("div");
    d.className = "ring-card";
    d.innerHTML = pic(key, "", true);
    ring.appendChild(d);
    return d;
  });

  let radius = 0;
  function layoutRing() {
    const vw = window.innerWidth;
    const cardW = Math.max(130, Math.min(vw * (vw < 640 ? 0.32 : 0.16), 250));
    ring.style.setProperty("--card-w", cardW + "px");
    radius = (cardW / (2 * Math.tan(Math.PI / N))) * (vw < 640 ? 1.0 : 1.1);
    cards.forEach((c, i) => {
      c.style.transform = `rotateY(${(360 / N) * i}deg) translateZ(${radius}px)`;
    });
  }
  layoutRing();

  let angle = 0;
  let scrollBoost = 0;
  let lastY = window.scrollY;
  let heroP = 0;

  function heroProgress() {
    const max = hero.offsetHeight - window.innerHeight;
    return Math.min(1, Math.max(0, window.scrollY / Math.max(1, max)));
  }

  function renderRing() {
    const p = heroP;
    const e = p * p * (3 - 2 * p); // smoothstep
    const vh = window.innerHeight;
    const ty = vh * 0.04 + e * vh * 0.2;            // desce com o scroll
    const tilt = -8 - e * 18;                        // inclina para mostrar o "topo" do anel
    const scale = 1 - e * 0.12;
    ring.style.transform = `translateY(${ty}px) scale(${scale}) rotateX(${tilt}deg) rotateY(${angle}deg)`;

    // profundidade: cartões de trás ficam mais apagados
    cards.forEach((c, i) => {
      const a = ((((360 / N) * i + angle) % 360) + 360) % 360;
      const cos = Math.cos((a * Math.PI) / 180); // 1 = frente
      c.style.opacity = (0.28 + 0.72 * ((cos + 1) / 2)).toFixed(3);
    });

    heroText.style.transform = `translateY(${-e * 140}px)`;
    heroText.style.opacity = Math.max(0, 1 - e * 1.8).toFixed(3);
    heroFoot.style.opacity = Math.max(0, 1 - p * 3).toFixed(3);
    heroFoot.style.transform = `translateY(${p * 60}px)`;
    const a2 = Math.min(1, Math.max(0, (p - 0.45) / 0.4));
    heroAfter.style.opacity = a2.toFixed(3);
    heroAfter.style.transform = `translateY(${(1 - a2) * 50}px)`;
    floorShadow.style.transform = `translateY(${e * vh * 0.1}px) scale(${1 - e * 0.3})`;
    floorShadow.style.opacity = (1 - e * 0.5).toFixed(3);
  }

  /* ---------------------------------------------------------------
   * Scroll-linked effects
   * ------------------------------------------------------------- */
  const nav = $("#nav");
  const parallaxEls = $$(".parallax");
  const statement = $("#statement");
  statement.innerHTML = statement.textContent
    .trim()
    .split(/\s+/)
    .map((w) => `<span class="w">${w}</span>`)
    .join(" ");
  const words = $$(".w", statement);

  function onScrollFrame() {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const dy = y - lastY;
    lastY = y;

    // nav
    nav.classList.toggle("scrolled", y > 40);
    if (!document.body.classList.contains("menu-open")) {
      nav.classList.toggle("hidden", dy > 4 && y > vh * 1.2);
      if (dy < -4) nav.classList.remove("hidden");
    }

    // velocidade do carrossel acompanha o scroll
    scrollBoost += dy * 0.06;

    heroP = heroProgress();

    // parallax das fotos grandes
    parallaxEls.forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const center = r.top + r.height / 2 - vh / 2;
      const lim = r.height * 0.1;
      const t = Math.max(-lim, Math.min(lim, -center * parseFloat(el.dataset.speed || 0.1)));
      el.style.transform = `translate3d(0, ${t.toFixed(1)}px, 0)`;
    });

    // texto que "acende" palavra por palavra
    const sr = statement.getBoundingClientRect();
    const sp = Math.min(1, Math.max(0, (vh * 0.85 - sr.top) / (sr.height + vh * 0.35)));
    const lit = Math.floor(sp * words.length);
    words.forEach((w, i) => w.classList.toggle("on", i < lit));
  }

  function tick() {
    if (!reduceMotion) {
      angle -= 0.12 + scrollBoost;
      scrollBoost *= 0.9;
    }
    renderRing();
    requestAnimationFrame(tick);
  }

  window.addEventListener("scroll", onScrollFrame, { passive: true });
  window.addEventListener("resize", () => { layoutRing(); onScrollFrame(); });
  onScrollFrame();
  requestAnimationFrame(tick);

  // arrastar o carrossel com mouse / dedo
  (() => {
    const scene = $("#scene");
    let dragging = false, startX = 0;
    scene.addEventListener("pointerdown", (e) => { dragging = true; startX = e.clientX; });
    window.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      scrollBoost -= (e.clientX - startX) * 0.02;
      startX = e.clientX;
    });
    window.addEventListener("pointerup", () => (dragging = false));
  })();

  /* ---------------------------------------------------------------
   * Reveal on scroll
   * ------------------------------------------------------------- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    }),
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  const observeReveals = () => $$(".reveal:not(.in)").forEach((el) => io.observe(el));

  /* ---------------------------------------------------------------
   * Products
   * ------------------------------------------------------------- */
  const PRODUCTS = [
    { id: "preto", name: "Moletom Canguru Oversize", color: "Preto", hex: "#141414", price: 219.9, group: "escuro", badge: "Mais vendido" },
    { id: "cinza", name: "Moletom Canguru Oversize", color: "Cinza mescla", hex: "#a7a9ac", price: 219.9, group: "claro" },
    { id: "offwhite", name: "Moletom Canguru Oversize", color: "Off-white", hex: "#f2efe8", price: 219.9, group: "claro" },
    { id: "marinho", name: "Moletom Canguru Oversize", color: "Azul marinho", hex: "#1f2a44", price: 229.9, group: "escuro", badge: "Novo" },
    { id: "grafite", name: "Moletom Canguru Oversize", color: "Grafite", hex: "#4a4b4e", price: 219.9, group: "escuro" },
  ];
  const SIZES = ["P", "M", "G", "GG"];
  const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

  $("#products").innerHTML = PRODUCTS.map((p, i) => `
    <article class="product reveal" data-group="${p.group}" style="transition-delay:${(i % 3) * 0.08}s">
      <div class="product-media">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ""}
        ${pic(p.id, `${p.name} ${p.color}`)}
        <div class="quick">
          ${SIZES.map((s) => `<button data-add="${p.id}" data-size="${s}" aria-label="Adicionar tamanho ${s}">${s}</button>`).join("")}
        </div>
      </div>
      <div class="product-info">
        <div>
          <h3>${p.name}</h3>
          <p><span class="swatch" style="background:${p.hex}"></span>${p.color}</p>
        </div>
        <span class="price">${brl(p.price)}</span>
      </div>
    </article>`).join("") + `
    <a href="#loja" class="product promo reveal" data-group="all" id="promoTile">
      <span class="eyebrow">Combine</span>
      <strong>Leve<br />dois.</strong>
      <p>Frete grátis acima de R$ 299 em qualquer combinação de cores. Troca grátis em 30 dias.</p>
      <span class="promo-link">Abrir sacola →</span>
    </a>`;
  observeReveals();

  $("#filters").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    $$("#filters button").forEach((x) => x.classList.toggle("active", x === b));
    const f = b.dataset.filter;
    $$(".product").forEach((el) => el.classList.toggle("hide", f !== "all" && el.dataset.group !== f && el.dataset.group !== "all"));
  });

  /* ---------------------------------------------------------------
   * Cart
   * ------------------------------------------------------------- */
  const store = {
    get() { try { return JSON.parse(localStorage.getItem("mf-cart")) || []; } catch { return []; } },
    set(v) { try { localStorage.setItem("mf-cart", JSON.stringify(v)); } catch {} },
  };
  let cart = store.get().filter((it) => byId[it.id]);

  const toastEl = $("#toast");
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  function renderCart() {
    const count = cart.reduce((s, it) => s + it.qty, 0);
    const total = cart.reduce((s, it) => s + it.qty * byId[it.id].price, 0);
    const countEl = $("#cartCount");
    countEl.textContent = count;
    countEl.classList.add("bump");
    setTimeout(() => countEl.classList.remove("bump"), 250);
    $("#cartTotal").textContent = brl(total);
    const missing = 299 - total;
    $("#shipNote").textContent = total === 0 ? "Frete grátis acima de R$ 299." :
      missing > 0 ? `Faltam ${brl(missing)} para frete grátis.` : "Você ganhou frete grátis.";
    $("#drawerItems").innerHTML = cart.length ? cart.map((it, i) => {
      const p = byId[it.id];
      return `<div class="cart-item">
        <div class="thumb">${pic(it.id, p.color)}</div>
        <div>
          <strong>${p.color}</strong>
          <p>Oversize · Tam. ${it.size} · ${brl(p.price)}</p>
          <div class="qty"><button data-q="${i}" data-d="-1" aria-label="Diminuir">−</button>${it.qty}<button data-q="${i}" data-d="1" aria-label="Aumentar">+</button></div>
        </div>
        <button class="remove" data-rm="${i}">Remover</button>
      </div>`;
    }).join("") : `<p class="drawer-empty">Sua sacola está vazia.</p>`;
    store.set(cart);
  }

  function add(id, size) {
    const found = cart.find((it) => it.id === id && it.size === size);
    if (found) found.qty++;
    else cart.push({ id, size, qty: 1 });
    renderCart();
    toast(`${byId[id].color} · ${size} adicionado à sacola`);
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-add]");
    if (a) return add(a.dataset.add, a.dataset.size);
    const q = e.target.closest("[data-q]");
    if (q) {
      const it = cart[+q.dataset.q];
      it.qty += +q.dataset.d;
      if (it.qty <= 0) cart.splice(+q.dataset.q, 1);
      return renderCart();
    }
    const rm = e.target.closest("[data-rm]");
    if (rm) { cart.splice(+rm.dataset.rm, 1); return renderCart(); }
  });

  const openCart = () => document.body.classList.add("cart-open");
  const closeCart = () => document.body.classList.remove("cart-open");
  $("#cartOpen").addEventListener("click", openCart);
  $("#promoTile").addEventListener("click", (e) => { e.preventDefault(); openCart(); });
  $("#cartClose").addEventListener("click", closeCart);
  $("#overlay").addEventListener("click", closeCart);
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeCart());
  $("#checkout").addEventListener("click", () => {
    if (!cart.length) return toast("Sua sacola está vazia");
    toast("Checkout: conecte aqui seu meio de pagamento");
  });
  renderCart();

  /* ---------------------------------------------------------------
   * Menu mobile + newsletter
   * ------------------------------------------------------------- */
  $("#menuBtn").addEventListener("click", () => document.body.classList.toggle("menu-open"));
  $$("#navLinks a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("menu-open")));

  $("#newsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    e.target.reset();
    $("#newsMsg").textContent = "Pronto! Você vai ser o primeiro a saber.";
  });

  observeReveals();
})();
