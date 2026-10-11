// Events screen. Phase 0: read-only list of event files found in data/.
// Creation, edit, delete and import/export arrive in phase 1.
window.CrossLy = window.CrossLy || {};
CrossLy.screens = CrossLy.screens || {};

CrossLy.screens.events = async function render() {
  const { h, mount, toast } = CrossLy.ui;
  const S = CrossLy.strings;

  let events = [];
  let info = null;
  try {
    [events, info] = await Promise.all([
      CrossLy.api.call("list_events"),
      CrossLy.api.call("app_info"),
    ]);
  } catch (err) {
    toast(err.message || S.errors.generic, true);
  }

  const list = events.length
    ? h(
        "ul",
        { class: "event-list" },
        events.map((ev) =>
          h(
            "li",
            {},
            h("span", { class: "name" }, ev.name),
            h("span", { class: "muted" }, ev.date || S.events.noDate)
          )
        )
      )
    : h(
        "div",
        { class: "card empty" },
        h("p", {}, S.events.empty),
        h("p", { class: "muted" }, S.events.emptyHint)
      );

  mount(
    h(
      "div",
      {},
      list,
      info && h("p", { class: "muted" }, `${S.events.dataFolder} ${info.data_dir}`)
    )
  );
};
