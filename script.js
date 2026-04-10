const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ─── H1: 文字単位ウェーブスタガー ────────────────────────
if (!reducedMotion) {
  document.querySelectorAll(".h1-line-inner").forEach((inner) => {
    const raw = inner.style.getPropertyValue("--d") ||
                getComputedStyle(inner).getPropertyValue("--d") || "0s";
    const baseDelay = parseFloat(raw) || 0;
    inner.classList.add("is-split");
    inner.innerHTML = [...inner.textContent]
      .map((ch, i) =>
        `<span class="ch" style="--char-delay:calc(${baseDelay}s + ${i} * 0.026s)">${ch}</span>`
      )
      .join("");
  });
}

// ─── Header: scroll 連動で背景を表示 ─────────────────────
const header = document.querySelector("[data-header]");

function updateHeader() {
  header.classList.toggle("scrolled", window.scrollY > 40);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

// ─── Scroll progress bar ──────────────────────────────────
const progressBar = document.querySelector(".scroll-progress");

function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (progressBar && max > 0) {
    progressBar.style.transform = `scaleX(${window.scrollY / max})`;
  }
}

window.addEventListener("scroll", updateProgress, { passive: true });

// ─── Hero parallax ────────────────────────────────────────
const heroInner = document.querySelector(".hero-inner");
let parallaxTicking = false;

if (!reducedMotion && heroInner) {
  function updateParallax() {
    const y = window.scrollY;
    if (y < window.innerHeight * 1.5) {
      heroInner.style.transform = `translateY(${y * 0.15}px)`;
    }
    parallaxTicking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!parallaxTicking) {
        requestAnimationFrame(updateParallax);
        parallaxTicking = true;
      }
    },
    { passive: true }
  );
}

// ─── Nav toggle ───────────────────────────────────────────
const navToggle = document.querySelector("[data-nav-toggle]");

function closeNav() {
  document.body.classList.remove("is-nav-open");
  if (navToggle) navToggle.setAttribute("aria-expanded", "false");
}

function toggleNav() {
  const isOpen = document.body.classList.toggle("is-nav-open");
  if (navToggle) navToggle.setAttribute("aria-expanded", String(isOpen));
}

if (navToggle) navToggle.addEventListener("click", toggleNav);

document.querySelectorAll("[data-nav-link]").forEach((link) => {
  link.addEventListener("click", closeNav);
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) closeNav();
});

// ─── Active section nav highlight ────────────────────────
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll('.site-nav a[href^="#"]');

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach((a) =>
          a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`)
        );
      }
    });
  },
  { rootMargin: "-45% 0px -45% 0px" }
);

sections.forEach((s) => navObserver.observe(s));

// ─── CTA magnetic effect ──────────────────────────────────
if (!reducedMotion) {
  document.querySelectorAll(".cta-primary").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 12;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 8;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });
}

// ─── Scroll reveal ────────────────────────────────────────
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -32px 0px" }
);

document.querySelectorAll(".reveal").forEach((el) => {
  revealObserver.observe(el);
});
