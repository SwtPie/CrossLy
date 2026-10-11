// Placeholder screens for features delivered in later phases.
window.CrossLy = window.CrossLy || {};
CrossLy.screens = CrossLy.screens || {};

(function () {
  const { h, mount } = CrossLy.ui;
  const S = CrossLy.strings;

  function placeholder() {
    return async function render() {
      mount(h("div", { class: "card empty" }, h("p", {}, S.placeholder.comingSoon)));
    };
  }

  for (const key of ["participants", "races", "timing", "results", "stats"]) {
    CrossLy.screens[key] = placeholder();
  }
})();
