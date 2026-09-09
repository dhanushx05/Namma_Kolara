/* =========================================================================
   NAMMA KOLARA — SCRIPT
   Handles: mobile nav toggle, active-link highlighting on scroll,
   scroll-reveal animations, and the citizen report form submission.

   BACKEND INTEGRATION:
   Search for "REPORT_API_ENDPOINT" below — that's the one line to change
   when you wire this up to a real backend (Node/Express, Django, Firebase
   function, Google Apps Script, etc). The form already sends a clean
   JSON payload, so no other changes should be needed on the front end.
   ========================================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initScrollSpy();
  initScrollReveal();
  initReportForm();
  initHeroSearch();
  initLocalityPicker();
  document.getElementById("year").textContent = new Date().getFullYear();
});

/* -------------------------------------------------------------------------
   Mobile nav: toggles a simple slide-down panel on small screens
   ------------------------------------------------------------------------- */
function initMobileNav() {
  const toggle = document.getElementById("navToggle");
  const panel = document.getElementById("mobileNav");
  if (!toggle || !panel) return;

  toggle.addEventListener("click", () => {
    panel.classList.toggle("is-open");
    toggle.classList.toggle("is-active");
  });

  // Close the panel whenever a link inside it is tapped
  panel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      panel.classList.remove("is-open");
      toggle.classList.remove("is-active");
    });
  });
}
/* -------------------------------------------------------------------------
   Hero search bar
   No real search backend yet, so this just takes the person to the most
   relevant section based on simple keyword matching. Swap this out for a
   real search API call once one exists.
   ------------------------------------------------------------------------- */
function initHeroSearch() {
  const form = document.getElementById("heroSearch");
  const input = document.getElementById("heroSearchInput");
  if (!form || !input) return;

  const routes = [
    { keywords: ["restaurant", "food", "eat", "market", "dosa", "thali"], target: "#taste" },
    { keywords: ["hospital", "clinic", "doctor", "health", "services"], target: "#services" },
    { keywords: ["event", "festival", "jatre", "fair"], target: "#news" },
    { keywords: ["temple", "heritage", "place", "tour", "kgf", "antaragange", "avani"], target: "#places" },
    { keywords: ["news", "update"], target: "#news" },
    { keywords: ["history", "fact", "know"], target: "#did-you-know" },
    { keywords: ["near", "nearby", "close"], target: "#near-you" },
    { keywords: ["story", "stories"], target: "#stories" },
    { keywords: ["map", "location", "direction"], target: "#map" },
    { keywords: ["community", "volunteer", "why"], target: "#why-us" },
    { keywords: ["report", "pothole", "garbage", "drainage", "issue", "problem"], target: "#report" },
  ];

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = input.value.trim().toLowerCase();
    if (!query) return;

    const match = routes.find((r) => r.keywords.some((k) => query.includes(k)));
    const target = document.querySelector(match ? match.target : "#explore");
    target?.scrollIntoView({ behavior: "smooth" });
  });
}
/* -------------------------------------------------------------------------
   Scroll-spy: highlights the nav link matching the section in view
   ------------------------------------------------------------------------- */
function initScrollSpy() {
  const sections = document.querySelectorAll("main section[id]");
  const links = document.querySelectorAll(".nav-link");
  if (!sections.length || !links.length) return;

  const spyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          links.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
          });
        }
      });
    },
    { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
  );

  sections.forEach((section) => spyObserver.observe(section));
}

/* -------------------------------------------------------------------------
   Scroll-reveal: fades/slides ".reveal" elements in as they enter view
   ------------------------------------------------------------------------- */
function initScrollReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  items.forEach((item) => revealObserver.observe(item));
}

/* -------------------------------------------------------------------------
   Citizen report form
   Intercepts submit, builds a JSON payload, and posts it to the backend.
   Falls back to a friendly local confirmation if no backend is connected
   yet (the fetch call is wrapped so the page never breaks in a static
   preview / before a real API exists).
   ------------------------------------------------------------------------- */
function initReportForm() {
  const form = document.getElementById("reportForm");
  const status = document.getElementById("reportStatus");
  if (!form || !status) return;

  // TODO: point this at your real backend route, e.g. "/api/reports"
  const REPORT_API_ENDPOINT = "/api/reports";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const payload = {
      category: formData.get("category"),
      location: formData.get("location"),
      description: formData.get("description"),
      name: formData.get("name") || null,
      phone: formData.get("phone") || null,
      submittedAt: new Date().toISOString(),
      // Note: the photo file itself (formData.get("photo")) should be sent
      // as multipart/form-data rather than JSON once a real backend/file
      // storage endpoint is in place.
    };

    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
      const response = await fetch(REPORT_API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Request failed");

      showStatus(
        status,
        "Thank you — your report has been submitted and will be routed to the right department.",
        "success"
      );
      form.reset();
    } catch (err) {
      // No backend connected yet, or the request failed — let the person
      // know clearly rather than pretending it worked.
      showStatus(
        status,
        "This form isn't connected to a live backend yet, so your report wasn't actually sent. Once REPORT_API_ENDPOINT in script.js points to a real API, submissions will go through.",
        "error"
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Report";
    }
  });
}

function showStatus(el, message, type) {
  el.textContent = message;
  el.className = `form-status is-visible ${type}`;
}

/* -------------------------------------------------------------------------
   "Discover What's Near You" — locality chips + geolocation button
   The chips just toggle active state for now; nearGrid shows sample
   results. Swap in a real "nearby" API call keyed on chip.dataset.area
   (or the geolocation coordinates) once a backend exists.
   ------------------------------------------------------------------------- */
function initLocalityPicker() {
  const chips = document.querySelectorAll(".locality-chip");
  const geoBtn = document.getElementById("useLocationBtn");
  if (!chips.length) return;

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      // TODO: fetch real nearby results for chip.dataset.area here.
    });
  });

  if (!geoBtn) return;

  geoBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Location isn't supported on this browser.");
      return;
    }
    geoBtn.textContent = "Locating...";
    navigator.geolocation.getCurrentPosition(
      (position) => {
        geoBtn.textContent = "Location found";
        // TODO: send position.coords.latitude/longitude to a real
        // nearby-search API and update #nearGrid with live results.
      },
      () => {
        geoBtn.textContent = "Use my location";
        alert("Couldn't access your location.");
      }
    );
  });
}
