// Navigation shell: sidebar, screen switching and the currently open event.
window.CrossLy = window.CrossLy || {};

(function () {
  const { h, setTitle, toast } = CrossLy.ui;
  const S = CrossLy.strings;

  // Order of the sidebar. Every screen except "events" needs an open event.
  const SCREENS = ["events", "participants", "races", "timing", "results", "stats"];
  const state = { current: "events", eventFile: null, event: null };
  CrossLy.state = state;

  function buildNav() {
    const nav = document.getElementById("nav");
    nav.replaceChildren(
      ...SCREENS.map((key) =>
        h(
          "button",
          {
            "data-screen": key,
            class: key === state.current ? "active" : false,
            disabled: key !== "events" && !state.eventFile,
            onclick: () => show(key),
          },
          S.nav[key]
        )
      )
    );
  }

  function updateBadge() {
    const badge = document.getElementById("event-badge");
    badge.hidden = !state.event;
    badge.textContent = state.event ? state.event.name : "";
  }

  // Select the open event (an event summary from the backend), or null to close it.
  function setEvent(event) {
    state.event = event || null;
    state.eventFile = event ? event.file : null;
    updateBadge();
    buildNav();
  }

  async function show(key) {
    // Screens that depend on an event fall back to the events list without one.
    if (key !== "events" && !state.eventFile) key = "events";
    state.current = key;
    for (const btn of document.querySelectorAll("#nav button")) {
      btn.classList.toggle("active", btn.dataset.screen === key);
    }
    setTitle(S.nav[key]);
    try {
      await CrossLy.screens[key]();
    } catch (err) {
      toast(err.message || S.errors.generic, true);
    }
  }

  CrossLy.app = { show, setEvent };

  async function init() {
    buildNav();
    await show("events");
    try {
      const info = await CrossLy.api.call("app_info");
      document.getElementById("app-version").textContent = `${info.name} v${info.version}`;
    } catch (_) {
      // Already reported by the events screen; nothing more to do here.
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
