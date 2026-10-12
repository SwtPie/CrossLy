// Import wizard for participants (CSV / Excel): column mapping, list-wide values,
// live preview with duplicates and warnings, then one all-or-nothing import.
// The file itself stays in the backend; this screen only exchanges column
// indexes, options and per-line class overrides.
window.CrossLy = window.CrossLy || {};

(function () {
  const FIELD_ORDER = [
    "last_name", "first_name", "full_name", "sex", "class_name",
    "establishment", "birth_date", "age", "vma",
  ];
  const MAX_DISPLAYED_ROWS = 1000;
  const COLUMN_COUNT = 9; // columns of the preview table

  function open(eventFile, data, extras = {}) {
    const { h, mount, toast, setTitle } = CrossLy.ui;
    const S = CrossLy.strings.importer;
    const E = CrossLy.strings.errors;
    const sexLabels = CrossLy.strings.participants.sex;

    const state = {
      mapping: { ...data.mapping },
      overrides: {}, // line number -> class typed in the preview
      filter: "all",
      preview: data.preview,
      busy: false,
      seq: 0, // ignores answers to outdated preview requests
    };
    const fail = (err) => toast(err.message || E.generic, true);
    const leave = () => CrossLy.app.show("participants");

    // --- step 1: column mapping ----------------------------------------------

    const fieldRows = {};
    const mappingGrid = h(
      "div",
      { class: "import-grid" },
      FIELD_ORDER.map((field) => {
        const select = h(
          "select",
          {
            id: `map-${field}`,
            onchange: (event) => {
              state.mapping[field] = event.target.value === "" ? null : Number(event.target.value);
              syncVisibility();
              refresh();
            },
          },
          h("option", { value: "" }, S.noColumn),
          data.headers.map((header, index) =>
            h("option", { value: String(index), selected: state.mapping[field] === index }, S.column(index, header))
          )
        );
        fieldRows[field] = h("label", { class: "field", for: `map-${field}` }, h("span", {}, S.fields[field]), select);
        return fieldRows[field];
      })
    );

    const firstNameFirst = h("input", {
      id: "opt-first-name-first",
      type: "checkbox",
      checked: Boolean(data.options && data.options.first_name_first),
      onchange: refresh,
    });
    const firstNameFirstRow = h("label", { class: "field checkbox import-options", for: "opt-first-name-first" },
      firstNameFirst, h("span", {}, S.firstNameFirst));

    // The combined-name options only matter when no separate name columns are chosen.
    function syncVisibility() {
      const separate = state.mapping.last_name != null && state.mapping.first_name != null;
      firstNameFirstRow.hidden = !(state.mapping.full_name != null && !separate);
    }

    // --- step 2: values for the whole list ------------------------------------------

    let timer = null;
    const debouncedRefresh = () => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 250);
    };
    const establishmentInput = h("input", {
      id: "opt-establishment",
      type: "text",
      autocomplete: "off",
      list: "import-establishments",
      oninput: debouncedRefresh,
    });
    const classInput = h("input", {
      id: "opt-class",
      type: "text",
      autocomplete: "off",
      placeholder: "Ex. 6A",
      oninput: debouncedRefresh,
    });
    const establishmentList = h(
      "datalist",
      { id: "import-establishments" },
      (extras.establishments || []).map((name) => h("option", { value: name }))
    );

    function readOptions() {
      return {
        establishment: establishmentInput.value.trim(),
        class_name: classInput.value.trim(),
        first_name_first: firstNameFirst.checked,
      };
    }

    // --- step 3: preview ---------------------------------------------------------------

    const filterSelect = h(
      "select",
      {
        "aria-label": S.filterAll,
        onchange: (event) => {
          state.filter = event.target.value;
          renderResults();
        },
      },
      h("option", { value: "all" }, S.filterAll),
      h("option", { value: "check" }, S.filterCheck)
    );
    const results = h("div", {});

    const cancelButton = h("button", { class: "btn", type: "button", onclick: cancel }, S.cancel);
    const importButton = h("button", { class: "btn primary", type: "button", onclick: commit });

    const dash = () => h("span", { class: "dash" }, "—");

    function birthOrAge(values) {
      if (values.birth_date) return new Date(`${values.birth_date}T00:00:00`).toLocaleDateString("fr-FR");
      if (values.age != null) return `${values.age} ans`;
      return dash();
    }

    // A row, plus a second line under it when there is something to tell about it.
    function previewRows(row) {
      const lines = [previewRow(row)];
      if (row.messages.length) {
        lines.push(
          h("tr", { class: `note-row status-${row.status}` },
            h("td", { colspan: COLUMN_COUNT }, h("span", { class: "note" }, "↳ ", row.messages.join(" "))))
        );
      }
      return lines;
    }

    function previewRow(row) {
      const v = row.values;
      const editable = row.status === "ok" || row.status === "warning";
      const classCell = editable
        ? h("input", {
            class: "cell-input",
            value: v.class_name || "",
            "aria-label": `${S.columns.class} (ligne ${row.line})`,
            oninput: (event) => { state.overrides[row.line] = event.target.value; },
          })
        : v.class_name || dash();
      return h(
        "tr",
        { class: `status-${row.status}` },
        h("td", { class: "num" }, String(row.line)),
        h("td", {}, h("span", { class: `badge ${row.status}` }, S.status[row.status])),
        h("td", {}, v.last_name || dash()),
        h("td", {}, v.first_name || dash()),
        h("td", {}, v.sex ? sexLabels[v.sex] : dash()),
        h("td", {}, classCell),
        h("td", {}, v.establishment || dash()),
        h("td", {}, birthOrAge(v)),
        h("td", { class: "num" }, v.vma == null ? dash() : v.vma.toLocaleString("fr-FR", { maximumFractionDigits: 2 }))
      );
    }

    function renderResults() {
      const p = state.preview;
      const s = p.summary;
      const chips = [h("span", { class: "chip ok" }, S.summaryImport(s.importable))];
      if (s.warnings) chips.push(h("span", { class: "chip warning" }, S.summaryWarnings(s.warnings)));
      if (s.duplicates) chips.push(h("span", { class: "chip duplicate" }, S.summaryDuplicates(s.duplicates)));
      if (s.errors) chips.push(h("span", { class: "chip error" }, S.summaryErrors(s.errors)));

      const rows = p.rows.filter((row) => state.filter === "all" || row.status !== "ok");
      const shown = rows.slice(0, MAX_DISPLAYED_ROWS);
      const columns = S.columns;
      const table = h(
        "table",
        { class: "data-table import-table" },
        h("thead", {}, h("tr", {},
          [columns.line, columns.status, columns.name, columns.firstName, columns.sex, columns.class,
            columns.establishment, columns.birth, columns.vma]
            .map((label) => h("th", { scope: "col" }, label)))),
        h("tbody", {},
          shown.length
            ? shown.flatMap(previewRows)
            : h("tr", {}, h("td", { colspan: COLUMN_COUNT, class: "empty" }, S.noRows)))
      );

      // replaceChildren() would turn null into the text "null": only pass real nodes.
      const blocks = [
        ...p.problems.map((message) => h("div", { class: "notice error", role: "alert" }, message)),
        h("div", { class: "chips" }, chips),
        p.rows.length ? h("div", { class: "table-wrap import-table-wrap" }, table) : null,
        rows.length > shown.length ? h("p", { class: "summary" }, S.truncated(shown.length, rows.length)) : null,
        p.rows.length ? h("p", { class: "summary" }, S.classHint) : null,
      ].filter(Boolean);
      results.replaceChildren(...blocks);
      updateActions();
    }

    function updateActions() {
      const p = state.preview;
      importButton.textContent = state.busy ? S.importing : S.importN(p.summary.importable);
      importButton.disabled = state.busy || p.summary.importable === 0 || p.problems.length > 0;
      cancelButton.disabled = state.busy;
    }

    // --- backend calls ----------------------------------------------------------------------

    async function refresh() {
      const mine = ++state.seq;
      try {
        const preview = await CrossLy.api.call(
          "import_preview", eventFile, state.mapping, readOptions(), state.overrides);
        if (mine !== state.seq) return;
        state.preview = preview;
        renderResults();
      } catch (err) {
        if (mine === state.seq) fail(err);
      }
    }

    async function commit() {
      if (state.busy) return;
      state.busy = true;
      state.seq++; // drop any preview still in flight
      updateActions();
      try {
        const result = await CrossLy.api.call(
          "import_commit", eventFile, state.mapping, readOptions(), state.overrides);
        toast(S.done(result.imported, result.duplicates, result.errors));
        await leave();
      } catch (err) {
        state.busy = false;
        updateActions();
        fail(err);
      }
    }

    async function cancel() {
      try { await CrossLy.api.call("import_discard"); } catch (_) { /* nothing to clean up */ }
      await leave();
    }

    // --- layout --------------------------------------------------------------------------------

    const step = (title, hint, ...content) =>
      h("section", { class: "card import-step" }, h("h2", {}, title), hint && h("p", { class: "hint" }, hint), content);

    setTitle(S.title);
    mount(
      h("div", {},
        h("div", { class: "toolbar" }, h("button", { class: "btn ghost", type: "button", onclick: cancel }, S.back)),
        h("p", { class: "import-file muted" },
          `${S.file} : `, h("strong", {}, data.file_name),
          data.sheet ? ` (${S.sheet} « ${data.sheet} »)` : "",
          ` · ${S.dataRows(data.row_count)}`),
        step(S.columnsTitle, S.columnsHint, mappingGrid, firstNameFirstRow),
        step(S.listTitle, S.listHint,
          h("div", { class: "import-grid" },
            h("label", { class: "field", for: "opt-establishment" }, h("span", {}, S.listEstablishment), establishmentInput),
            h("label", { class: "field", for: "opt-class" }, h("span", {}, S.listClass), classInput)),
          establishmentList),
        step(S.previewTitle, null,
          h("div", { class: "filters" }, filterSelect),
          results),
        h("div", { class: "import-actions" }, cancelButton, importButton))
    );
    syncVisibility();
    renderResults();
  }

  CrossLy.participantsImport = { open };
})();
