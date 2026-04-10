// ─── Header: scroll 連動で背景を表示 ─────────────────────
const header = document.querySelector("[data-header]");

function updateHeader() {
  header.classList.toggle("scrolled", window.scrollY > 40);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

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
