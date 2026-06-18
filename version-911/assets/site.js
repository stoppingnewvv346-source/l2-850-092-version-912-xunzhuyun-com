(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  ready(function () {
    var toggle = document.querySelector(".nav-toggle");
    var mobileNav = document.querySelector(".mobile-nav");

    if (toggle && mobileNav) {
      toggle.addEventListener("click", function () {
        var expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!expanded));
        mobileNav.classList.toggle("is-open", !expanded);
      });
    }

    var hero = document.querySelector("[data-hero-carousel]");
    if (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
      var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
      var current = 0;

      function showSlide(index) {
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle("is-active", slideIndex === current);
        });
        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle("is-active", dotIndex === current);
        });
      }

      dots.forEach(function (dot, dotIndex) {
        dot.addEventListener("click", function () {
          showSlide(dotIndex);
        });
      });

      if (slides.length > 1) {
        window.setInterval(function () {
          showSlide(current + 1);
        }, 5200);
      }
    }

    var searchInput = document.querySelector("[data-search-input]");
    var typeSelect = document.querySelector("[data-search-type]");
    var searchableCards = Array.prototype.slice.call(document.querySelectorAll("[data-search]"));

    function normalize(value) {
      return String(value || "").trim().toLowerCase();
    }

    function applySearch() {
      var query = normalize(searchInput ? searchInput.value : "");
      var type = normalize(typeSelect ? typeSelect.value : "");

      searchableCards.forEach(function (card) {
        var text = normalize(card.getAttribute("data-search"));
        var title = normalize(card.getAttribute("data-title"));
        var matchesQuery = !query || text.indexOf(query) !== -1 || title.indexOf(query) !== -1;
        var matchesType = !type || text.indexOf(type) !== -1;
        card.classList.toggle("hidden-card", !(matchesQuery && matchesType));
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", applySearch);
    }
    if (typeSelect) {
      typeSelect.addEventListener("change", applySearch);
    }
  });
})();
