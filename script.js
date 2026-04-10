function closeNav() {
  document.body.classList.remove("is-nav-open");
  const toggle = document.querySelector("[data-nav-toggle]");
  if (toggle) {
    toggle.setAttribute("aria-expanded", "false");
  }
}

function toggleNav() {
  const isOpen = document.body.classList.toggle("is-nav-open");
  const toggle = document.querySelector("[data-nav-toggle]");
  if (toggle) {
    toggle.setAttribute("aria-expanded", String(isOpen));
  }
}

const navToggle = document.querySelector("[data-nav-toggle]");
if (navToggle) {
  navToggle.addEventListener("click", toggleNav);
}

document.querySelectorAll("[data-nav-link]").forEach((link) => {
  link.addEventListener("click", closeNav);
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) {
    closeNav();
  }
});
