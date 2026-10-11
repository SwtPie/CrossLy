// Events screen: list, create, edit, delete, open, export and import.
window.CrossLy = window.CrossLy || {};
CrossLy.screens = CrossLy.screens || {};

CrossLy.screens.events = async function render() {
  const { h, mount, toast, formatDate, confirmDialog, formDialog } = CrossLy.ui;
  const S = CrossLy.strings.events;
  const E = CrossLy.strings.errors;
  const state = CrossLy.state;

  const refresh = () => CrossLy.app.show("events");
  const fail = (err) => toast(err.message || E.generic, true);

  let events = [];
  let info = null;
  try {
    [events, info] = await Promise.all([
      CrossLy.api.call("list_events"),
      CrossLy.api.call("app_info"),
    ]);
  } catch (err) {
    fail(err);
  }

  const fields = [
    { name: "name", label: S.fieldName, required: true, placeholder: S.fieldNamePlaceholder },
    { name: "date", label: S.fieldDate, type: "date" },
    { name: "location", label: S.fieldLocation, placeholder: S.fieldLocationPlaceholder },
  ];

  async function createEvent() {
    const values = await formDialog({ title: S.createTitle, fields, submitLabel: CrossLy.strings.common.create });
    if (!values) return;
    try {
      const created = await CrossLy.api.call("create_event", values.name, values.date, values.location);
      CrossLy.app.setEvent(created);
      toast(S.created);
      await refresh();
    } catch (err) { fail(err); }
  }

  async function editEvent(ev) {
    const values = await formDialog({ title: S.editTitle, fields, initial: ev });
    if (!values) return;
    try {
      const updated = await CrossLy.api.call("update_event", ev.file, values.name, values.date, values.location);
      if (state.eventFile === ev.file) CrossLy.app.setEvent(updated);
      toast(S.updated);
      await refresh();
    } catch (err) { fail(err); }
  }

  async function deleteEvent(ev) {
    const confirmed = await confirmDialog({
      title: S.deleteTitle,
      message: S.deleteMessage(ev.name),
      confirmLabel: S.delete,
      danger: true,
    });
    if (!confirmed) return;
    try {
      await CrossLy.api.call("delete_event", ev.file);
      if (state.eventFile === ev.file) CrossLy.app.setEvent(null);
      toast(S.deleted);
      await refresh();
    } catch (err) { fail(err); }
  }

  async function exportEvent(ev) {
    try {
      const result = await CrossLy.api.call("export_event", ev.file);
      if (!result.cancelled) toast(`${S.exported} ${result.path}`);
    } catch (err) { fail(err); }
  }

  async function importEvent() {
    try {
      const result = await CrossLy.api.call("import_event");
      if (result.cancelled) return;
      toast(S.imported);
      await refresh();
    } catch (err) { fail(err); }
  }

  function openEvent(ev) {
    CrossLy.app.setEvent(ev);
    refresh();
  }

  function card(ev) {
    const isCurrent = state.eventFile === ev.file;
    const details = [
      ev.date ? formatDate(ev.date) : S.noDate,
      ev.location || S.noLocation,
      S.participantsCount(ev.participants),
      S.racesCount(ev.races),
    ].join(" · ");
    return h(
      "li",
      { class: `event-card${isCurrent ? " current" : ""}` },
      h("div", {},
        h("div", { class: "name" }, ev.name, isCurrent && h("span", { class: "tag" }, S.opened)),
        h("div", { class: "meta" }, details)),
      h("div", { class: "actions" },
        !isCurrent && h("button", { class: "btn primary small", onclick: () => openEvent(ev) }, S.open),
        h("button", { class: "btn small", onclick: () => editEvent(ev) }, S.edit),
        h("button", { class: "btn small", onclick: () => exportEvent(ev) }, S.export),
        h("button", { class: "btn link-danger small", onclick: () => deleteEvent(ev) }, S.delete))
    );
  }

  const list = events.length
    ? h("ul", { class: "event-list" }, events.map(card))
    : h("div", { class: "card empty" },
        h("p", {}, S.empty),
        h("p", { class: "muted" }, S.emptyHint));

  mount(
    h("div", {},
      h("div", { class: "toolbar" },
        h("button", { class: "btn primary", onclick: createEvent }, S.new),
        h("button", { class: "btn", onclick: importEvent }, S.import)),
      list,
      info && h("p", { class: "muted data-folder" }, `${S.dataFolder} ${info.data_dir}`))
  );
};
