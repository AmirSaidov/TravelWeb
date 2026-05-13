(function () {
  function toNum(v) {
    var n = Number(String(v || "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }

  function fmt6(n) {
    return (Math.round(n * 1e6) / 1e6).toFixed(6);
  }

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    if (!window.L) return;

    var latInput = document.getElementById("id_lat");
    var lngInput = document.getElementById("id_lng");
    var mapEl = document.getElementById("coord-picker");
    var searchInput = document.getElementById("coord-search");
    var inlineResultsEl = document.getElementById("coord-search-results");
    if (!latInput || !lngInput || !mapEl) return;

    // Render dropdown into <body> to avoid admin layout clipping/overflow issues.
    var dropdownEl = null;
    function ensureDropdown() {
      if (dropdownEl) return dropdownEl;
      dropdownEl = document.createElement("div");
      dropdownEl.className = "coord-picker__results coord-picker__results--floating";
      dropdownEl.style.position = "absolute";
      dropdownEl.style.zIndex = "99999";
      dropdownEl.style.display = "none";
      document.body.appendChild(dropdownEl);
      return dropdownEl;
    }

    // Kyrgyzstan bbox: west,south,east,north
    var KG_BOUNDS = L.latLngBounds(L.latLng(39.17, 69.23), L.latLng(43.27, 80.28));
    var kgCenter = [41.2, 74.6];

    var initialLat = toNum(latInput.value);
    var initialLng = toNum(lngInput.value);
    var initial = initialLat != null && initialLng != null ? [initialLat, initialLng] : kgCenter;

    var map = L.map(mapEl, {
      center: initial,
      zoom: initial === kgCenter ? 6 : 10,
      maxBounds: KG_BOUNDS.pad(0.2),
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(map);

    var marker = L.marker(initial, { draggable: true }).addTo(map);

    function setInputs(lat, lng) {
      latInput.value = fmt6(lat);
      lngInput.value = fmt6(lng);
      // Trigger Django admin change detection
      latInput.dispatchEvent(new Event("change", { bubbles: true }));
      lngInput.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function setMarker(lat, lng, fly) {
      marker.setLatLng([lat, lng]);
      if (fly) map.flyTo([lat, lng], Math.max(map.getZoom(), 11), { duration: 0.6 });
    }

    map.on("click", function (e) {
      var lat = e.latlng.lat;
      var lng = e.latlng.lng;
      setMarker(lat, lng, false);
      setInputs(lat, lng);
    });

    marker.on("dragend", function () {
      var p = marker.getLatLng();
      setInputs(p.lat, p.lng);
    });

    function syncFromInputs() {
      var lat = toNum(latInput.value);
      var lng = toNum(lngInput.value);
      if (lat == null || lng == null) return;
      setMarker(lat, lng, true);
    }

    latInput.addEventListener("blur", syncFromInputs);
    lngInput.addEventListener("blur", syncFromInputs);

    // --- Simple place search.
    // Uses a same-origin Django endpoint to avoid browser CORS / adblock issues.
    var debounceTimer = null;
    var lastQuery = "";

    function hideResults() {
      var el = dropdownEl || inlineResultsEl;
      if (!el) return;
      el.style.display = "none";
      el.innerHTML = "";
    }

    function showResults(items) {
      var el = ensureDropdown();
      if (!items || items.length === 0) return hideResults();
      el.innerHTML = "";

      // Position dropdown under input.
      if (searchInput) {
        var r = searchInput.getBoundingClientRect();
        el.style.left = Math.round(r.left + window.scrollX) + "px";
        el.style.top = Math.round(r.bottom + window.scrollY + 6) + "px";
        el.style.width = Math.round(r.width) + "px";
      }

      items.forEach(function (it) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.innerHTML =
          "<div>" +
          String(it.name || "").replace(/</g, "&lt;") +
          "</div>" +
          "<div class=\"muted\">" +
          String(it.sub || "").replace(/</g, "&lt;") +
          "</div>";
        btn.addEventListener("click", function () {
          hideResults();
          if (searchInput) searchInput.value = it.name || "";
          setMarker(it.lat, it.lng, true);
          setInputs(it.lat, it.lng);
        });
        el.appendChild(btn);
      });
      el.style.display = "block";
    }

    async function searchPlaces(q) {
      // Normalize common Russian words that can reduce match quality.
      var normalized = String(q || "")
        .trim()
        .replace(/\bущелье\b/gi, "")
        .replace(/\bнациональный\s+парк\b/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      var url = "/api/geo/suggest/?q=" + encodeURIComponent(normalized || q);
      var resp = await fetch(url, { headers: { Accept: "application/json" } });
      if (!resp.ok) return [];
      var data = await resp.json();
      return Array.isArray(data) ? data : [];
    }

    function onSearchInput() {
      if (!searchInput) return;
      var q = String(searchInput.value || "").trim();
      if (q.length < 3) return hideResults();
      lastQuery = q;

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async function () {
        try {
          var items = await searchPlaces(q);
          // Ignore if user typed something else.
          if (lastQuery !== q) return;
          showResults(items);
        } catch {
          hideResults();
        }
      }, 350);
    }

    if (searchInput) {
      searchInput.addEventListener("input", onSearchInput);
      searchInput.addEventListener("blur", function () {
        // Delay to allow click on a result.
        setTimeout(hideResults, 200);
      });
      searchInput.addEventListener("focus", function () {
        if (dropdownEl && dropdownEl.innerHTML) dropdownEl.style.display = "block";
      });
    }
  });
})();
