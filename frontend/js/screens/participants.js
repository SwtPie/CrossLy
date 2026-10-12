// Participants screen: table with live search, filters and sorting,
// add / edit / delete, and automatic or manual bib assignment.
window.CrossLy = window.CrossLy || {};
CrossLy.screens = CrossLy.screens || {};

(function () {
  // Filters and sort survive navigation between screens, but reset when another event is opened.
  const view = {
    eventFile: null,
    filters: { q: "", sex: "", cls: "", est: "", bib: "" },
    sort: { key: "name", dir: 1 },
  };

  // Lowercase, accent-free text for search and comparison.
  const fold = (value) =>
    String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const collator = new Intl.Collator("fr", { sensitivity: "base", numeric: true });
  const distinct = (rows, key) =>
    [...new Set(rows.map((r) => r[key]).filter(Boolean))].sort(collator.compare);

  function matches(p, f) {
    if (f.sex && p.sex !== f.sex) return false;
    if (f.cls && p.class_name !== f.cls) return false;
    if (f.est && p.establishment !== f.est) return false;
    if (f.bib === "with" && p.bib == null) return false;
    if (f.bib === "without" && p.bib != null) return false;
    const terms = fold(f.q).split(/\s+/).filter(Boolean);
    if (!terms.length) return true;
    const haystack = fold([p.last_name, p.first_name, p.class_name, p.establishment, p.bib].join(" "));
    return terms.every((t) => haystack.includes(t));
  }

  // Missing values always sort last, whatever the direction.
  function compareBy(key, dir) {
    const text = (v) => (v == null || v === "" ? null : v);
    return (a, b) => {
      let x, y;
      if (key === "name") {
        const byLast = collator.compare(a.last_name, b.last_name);
        return dir * (byLast || collator.compare(a.first_name, b.first_name));
      }
      if (key === "bib" || key === "vma") { x = a[key]; y = b[key]; }
      else { x = text(a[key]); y = text(b[key]); }
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      const diff = typeof x === "number" ? x - y : collator.compare(x, y);
      return dir * diff || collator.compare(a.last_name, b.last_name);
    };
  }

  const formatVma = (vma) => (vma == null ? null : vma.toLocaleString("fr-FR", { maximumFractionDigits: 2 }));

  CrossLy.screens.participants = async function render() {
    const { h, mount, toast, confirmDialog, formDialog } = CrossLy.ui;
    const S = CrossLy.strings.participants;
    const E = CrossLy.strings.errors;
    const eventFile = CrossLy.state.eventFile;

    if (view.eventFile !== eventFile) {
      view.eventFile = eventFile;
      view.filters = { q: "", sex: "", cls: "", est: "", bib: "" };
      view.sort = { key: "name", dir: 1 };
    }

    const refresh = () => CrossLy.app.show("participants");
    const fail = (err) => toast(err.message || E.generic, true);

    let participants = [];
    try {
      participants = await CrossLy.api.call("list_participants", eventFile);
    } catch (err) {
      fail(err);
    }

    const fullName = (p) => `${p.last_name} ${p.first_name}`;

    // --- add / edit ---------------------------------------------------------

    function formFields() {
      return [
        { name: "last_name", label: S.fieldLastName, required: true },
        { name: "first_name", label: S.fieldFirstName, required: true },
        {
          name: "sex",
          label: S.fieldSex,
          type: "select",
          options: [
            { value: "", label: S.sexUnknown },
            { value: "M", label: S.sex.M },
            { value: "F", label: S.sex.F },
          ],
        },
        { name: "class_name", label: S.fieldClass, placeholder: S.fieldClassPlaceholder, suggestions: distinct(participants, "class_name") },
        { name: "establishment", label: S.fieldEstablishment, suggestions: distinct(participants, "establishment") },
        { name: "birth_date", label: S.fieldBirthDate, type: "date" },
        { name: "age", label: S.fieldAge, type: "number", min: 3, max: 99, step: 1 },
        { name: "vma", label: S.fieldVma, placeholder: S.fieldVmaPlaceholder, inputmode: "decimal" },
        { name: "bib", label: S.fieldBib, type: "number", min: 1, max: 99999, step: 1, placeholder: S.fieldBibPlaceholder },
      ];
    }

    async function addParticipant() {
      const values = await formDialog({
        title: S.addTitle,
        fields: formFields(),
        submitLabel: CrossLy.strings.common.create,
        onSubmit: (v) => CrossLy.api.call("add_participant", eventFile, v),
      });
      if (!values) return;
      toast(S.added);
      await refresh();
    }

    async function editParticipant(p) {
      const values = await formDialog({
        title: S.editTitle,
        fields: formFields(),
        initial: p,
        onSubmit: (v) => CrossLy.api.call("update_participant", eventFile, p.id, v),
      });
      if (!values) return;
      toast(S.updated);
      await refresh();
    }

    async function deleteParticipant(p) {
      const confirmed = await confirmDialog({
        title: S.deleteTitle,
        message: S.deleteMessage(fullName(p)),
        confirmLabel: S.delete,
        danger: true,
      });
      if (!confirmed) return;
      try {
        await CrossLy.api.call("delete_participant", eventFile, p.id);
        toast(S.deleted);
        await refresh();
      } catch (err) { fail(err); }
    }

    // --- bibs ---------------------------------------------------------------

    async function assignBibs() {
      const withBib = participants.filter((p) => p.bib != null).length;
      const values = await formDialog({
        title: S.bibsTitle,
        intro: S.bibsHint,
        fields: [
          { name: "start", label: S.bibsStart, type: "number", min: 1, max: 99999, step: 1 },
          { name: "renumber", label: S.bibsRenumber, type: "checkbox" },
        ],
        initial: { start: 1 },
        submitLabel: S.assignBibs,
      });
      if (!values) return;
      if (values.renumber && withBib > 0) {
        const ok = await confirmDialog({
          title: S.bibsRenumberTitle,
          message: S.bibsRenumberMessage(withBib),
          confirmLabel: S.bibsRenumberConfirm,
          danger: true,
        });
        if (!ok) return;
      }
      try {
        const result = await CrossLy.api.call("assign_bibs", eventFile, values.start ? Number(values.start) : 1, values.renumber);
        toast(S.bibsAssigned(result.assigned));
        await refresh();
      } catch (err) { fail(err); }
    }

    async function clearBibs() {
      const withBib = participants.filter((p) => p.bib != null).length;
      if (!withBib) return;
      const ok = await confirmDialog({
        title: S.clearTitle,
        message: S.clearMessage(withBib),
        confirmLabel: S.clearConfirm,
        danger: true,
      });
      if (!ok) return;
      try {
        const result = await CrossLy.api.call("clear_bibs", eventFile);
        toast(S.bibsCleared(result.cleared));
        await refresh();
      } catch (err) { fail(err); }
    }

    // --- empty event --------------------------------------------------------

    if (!participants.length) {
      mount(
        h("div", {},
          h("div", { class: "toolbar" },
            h("button", { class: "btn primary", onclick: addParticipant }, S.add)),
          h("div", { class: "card empty" },
            h("p", {}, S.empty),
            h("p", { class: "muted" }, S.emptyHint)))
      );
      return;
    }

    // --- filters, summary and table -------------------------------------------

    const f = view.filters;
    const classes = distinct(participants, "class_name");
    const establishments = distinct(participants, "establishment");

    const option = (value, label, current) => h("option", { value, selected: value === current }, label);

    const searchInput = h("input", {
      type: "search",
      placeholder: S.search,
      value: f.q,
      "aria-label": S.search,
      oninput: (e) => { f.q = e.target.value; renderRows(); },
    });
    const select = (key, label, options) =>
      h("select", { "aria-label": label, onchange: (e) => { f[key] = e.target.value; renderRows(); } },
        option("", label, f[key]), options.map(([value, text]) => option(value, text, f[key])));

    const sexSelect = select("sex", S.allSexes, [["M", S.sex.M], ["F", S.sex.F]]);
    const classSelect = classes.length ? select("cls", S.allClasses, classes.map((c) => [c, c])) : null;
    const estSelect = establishments.length ? select("est", S.allEstablishments, establishments.map((e) => [e, e])) : null;
    const bibSelect = select("bib", S.bibAny, [["with", S.bibWith], ["without", S.bibWithout]]);
    const resetButton = h("button", {
      class: "btn ghost small",
      onclick: () => { view.filters = { q: "", sex: "", cls: "", est: "", bib: "" }; refresh(); },
    }, S.reset);

    const withBib = participants.filter((p) => p.bib != null).length;
    const withoutVma = participants.filter((p) => p.vma == null).length;
    const count = h("strong", {});
    const summary = h("p", { class: "summary" }, count, ` · ${S.withBib(withBib)} · ${S.withoutVma(withoutVma)}`);

    const columns = [
      ["bib", S.columns.bib, "num"],
      ["name", S.columns.name],
      ["first_name", S.columns.firstName],
      ["sex", S.columns.sex],
      ["class_name", S.columns.class],
      ["establishment", S.columns.establishment],
      ["vma", S.columns.vma, "num"],
    ];
    const headerCells = columns.map(([key, label, cls]) => {
      return h("th", { class: cls || false, scope: "col" },
        h("button", { type: "button", onclick: () => toggleSort(key) }, label, " ", h("span", { "data-arrow": key })));
    });
    const tbody = h("tbody", {});
    const table = h("table", { class: "data-table" },
      h("thead", {}, h("tr", {}, headerCells, h("th", { class: "actions-col", scope: "col" }))),
      tbody);

    function toggleSort(key) {
      view.sort = view.sort.key === key ? { key, dir: -view.sort.dir } : { key, dir: 1 };
      renderRows();
    }

    function dash() { return h("span", { class: "dash" }, "—"); }

    function row(p) {
      return h("tr", {},
        h("td", { class: "num bib" }, p.bib == null ? dash() : String(p.bib)),
        h("td", {}, p.last_name),
        h("td", {}, p.first_name),
        h("td", {}, p.sex ? S.sex[p.sex] : dash()),
        h("td", {}, p.class_name || dash()),
        h("td", {}, p.establishment || dash()),
        h("td", { class: "num" }, p.vma == null ? dash() : formatVma(p.vma)),
        h("td", { class: "actions" },
          h("button", { class: "btn small", onclick: () => editParticipant(p) }, S.edit),
          h("button", { class: "btn link-danger small", onclick: () => deleteParticipant(p) }, S.delete)));
    }

    function renderRows() {
      const shown = participants.filter((p) => matches(p, f)).sort(compareBy(view.sort.key, view.sort.dir));
      count.textContent = S.countOf(shown.length, participants.length);
      tbody.replaceChildren(
        ...(shown.length
          ? shown.map(row)
          : [h("tr", {}, h("td", { colspan: columns.length + 1, class: "empty" }, S.noResult))])
      );
      for (const arrow of table.querySelectorAll("[data-arrow]")) {
        const active = arrow.dataset.arrow === view.sort.key;
        arrow.textContent = active ? (view.sort.dir === 1 ? "▲" : "▼") : "";
        arrow.closest("th").setAttribute("aria-sort", active ? (view.sort.dir === 1 ? "ascending" : "descending") : "none");
      }
    }

    mount(
      h("div", {},
        h("div", { class: "toolbar" },
          h("button", { class: "btn primary", onclick: addParticipant }, S.add),
          h("button", { class: "btn", onclick: assignBibs }, S.assignBibs),
          withBib > 0 && h("button", { class: "btn ghost", onclick: clearBibs }, S.clearBibs)),
        h("div", { class: "filters" }, searchInput, sexSelect, classSelect, estSelect, bibSelect, resetButton),
        summary,
        h("div", { class: "table-wrap" }, table))
    );
    renderRows();
  };
})();
