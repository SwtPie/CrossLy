// Navigation shell: builds the sidebar and switches screens.
window.CrossLy = window.CrossLy || {};

(function () {
  const { h, setTitle, toast } = CrossLy.ui;
  const S = CrossLy.strings;

  // Order of the sidebar. Screens other than "events" need a selected event
  // (selection arrives in phase 1), so they stay disabled until then.
  const SCREENS = ["events", "participants", "races", "timing", "results", "stats"];
  const state = { current: "events", eventFile: null };
  CrossLy.state = state;

  function buildNav() {
    const nav = document.getElementById("nav");
    nav.replaceChildren(
      ...SCREENS.map((key) =>
        h(
          "button",
          {
            "data-screen": key,
            disabled: key !== "events" && !state.eventFile,
            onclick: () => show(key),
          },
          S.nav[key]
        )
      )
    );
  }

  async function show(key) {
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
