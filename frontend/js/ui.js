// Small UI helpers shared by all screens.
window.CrossLy = window.CrossLy || {};

(function () {
  let toastTimer = null;

  // Build an element: h("div", {class: "card"}, "text", childNode, ...)
  // Text is always inserted as text nodes, never as HTML.
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value === false || value == null) continue;
      if (key.startsWith("on") && typeof value === "function") {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        el.setAttribute(key, value === true ? "" : value);
      }
    }
    for (const child of children.flat()) {
      if (child == null || child === false) continue;
      el.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return el;
  }

  function toast(message, isError = false) {
    const el = document.getElementById("toast");
    el.textContent = message;
    el.classList.toggle("error", isError);
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 4000);
  }

  function setTitle(text) {
    document.getElementById("screen-title").textContent = text;
  }

  function mount(node) {
    const screen = document.getElementById("screen");
    screen.replaceChildren(node);
  }

  // "2026-10-15" -> "15 octobre 2026". Empty input gives an empty string.
  function formatDate(iso) {
    if (!iso) return "";
    const date = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  }

  // --- modal dialogs -----------------------------------------------------

  // buttons: [{label, kind: "primary" | "danger" | "ghost", onClick(close)}]
  // onDismiss runs when the user presses Escape.
  function openModal(title, content, buttons, onDismiss) {
    const previousFocus = document.activeElement;
    const backdrop = h("div", { class: "modal-backdrop" });

    function close() {
      document.removeEventListener("keydown", onKey, true);
      backdrop.remove();
      if (previousFocus && previousFocus.focus) previousFocus.focus();
    }
    function onKey(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        if (onDismiss) onDismiss();
      }
    }

    const actions = h(
      "div",
      { class: "modal-actions" },
      buttons.map((b) =>
        h("button", { class: `btn ${b.kind || "ghost"}`, type: "button", onclick: () => b.onClick(close) }, b.label)
      )
    );
    backdrop.append(
      h("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": title },
        h("h2", {}, title), content, actions)
    );
    document.body.append(backdrop);
    document.addEventListener("keydown", onKey, true);

    const firstField = backdrop.querySelector("input, select, textarea");
    (firstField || backdrop.querySelector(".btn.primary, .btn.danger, .btn")).focus();
    return { close };
  }

  // Resolves true when the user confirms, false otherwise.
  function confirmDialog({ title, message, confirmLabel, danger = false }) {
    const S = CrossLy.strings.common;
    return new Promise((resolve) => {
      openModal(
        title,
        h("p", { class: "modal-text" }, message),
        [
          { label: S.cancel, kind: "ghost", onClick: (close) => { close(); resolve(false); } },
          { label: confirmLabel, kind: danger ? "danger" : "primary", onClick: (close) => { close(); resolve(true); } },
        ],
        () => resolve(false)
      );
    });
  }

  // fields: [{name, label, type = "text" | "number" | "date" | "select" | "checkbox",
  //           required, placeholder, options (select), suggestions (datalist), min, max, step}]
  // Resolves with {name: trimmedValue, ...} (a boolean for checkboxes), or null when cancelled.
  // intro: optional paragraph above the fields.
  // onSubmit(values): optional async step run on submit (typically the backend call).
  // If it throws, the message is shown in the dialog and the dialog stays open,
  // so a rejected entry (duplicate, invalid value...) is never lost.
  function formDialog({ title, fields, initial = {}, submitLabel, intro, onSubmit }) {
    const S = CrossLy.strings.common;
    return new Promise((resolve) => {
      const error = h("p", { class: "form-error", hidden: true });
      const inputs = {};
      const form = h(
        "form",
        { class: "form", novalidate: true },
        intro && h("p", { class: "modal-text muted" }, intro),
        fields.map((f) => {
          const id = `field-${f.name}`;
          const start = initial[f.name] ?? "";
          let datalist = null;
          if (f.type === "select") {
            inputs[f.name] = h("select", { id, name: f.name },
              f.options.map((o) =>
                h("option", { value: o.value, selected: String(o.value) === String(start) }, o.label)));
          } else if (f.type === "checkbox") {
            inputs[f.name] = h("input", { id, name: f.name, type: "checkbox", checked: Boolean(start) });
          } else {
            const listId = f.suggestions && f.suggestions.length ? `list-${f.name}` : null;
            inputs[f.name] = h("input", {
              id,
              name: f.name,
              type: f.type || "text",
              placeholder: f.placeholder || "",
              value: start,
              autocomplete: "off",
              list: listId,
              min: f.min,
              max: f.max,
              step: f.step,
              inputmode: f.inputmode,
            });
            if (listId) {
              datalist = h("datalist", { id: listId }, f.suggestions.map((s) => h("option", { value: s })));
            }
          }
          if (f.type === "checkbox") {
            return h("label", { class: "field checkbox", for: id }, inputs[f.name], h("span", {}, f.label));
          }
          return h("label", { class: "field", for: id },
            h("span", {}, f.label, f.required ? " *" : ""), inputs[f.name], datalist);
        }),
        error
      );

      let busy = false;
      async function submit(close) {
        if (busy) return;
        const values = {};
        for (const f of fields) {
          values[f.name] = f.type === "checkbox" ? inputs[f.name].checked : inputs[f.name].value.trim();
          if (f.required && !values[f.name]) {
            error.textContent = `${f.label} : ${S.fieldRequired}`;
            error.hidden = false;
            inputs[f.name].focus();
            return;
          }
        }
        if (onSubmit) {
          busy = true;
          try {
            await onSubmit(values);
          } catch (err) {
            error.textContent = err.message || CrossLy.strings.errors.generic;
            error.hidden = false;
            busy = false;
            return;
          }
          busy = false;
        }
        close();
        resolve(values);
      }

      const modal = openModal(
        title,
        form,
        [
          { label: S.cancel, kind: "ghost", onClick: (close) => { close(); resolve(null); } },
          { label: submitLabel || S.save, kind: "primary", onClick: submit },
        ],
        () => resolve(null)
      );
      // The form has no built-in submit button (the buttons live in the modal footer),
      // so browsers would not submit on Enter: handle it explicitly.
      form.addEventListener("submit", (event) => event.preventDefault());
      form.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          submit(modal.close);
        }
      });
    });
  }

  CrossLy.ui = { h, toast, setTitle, mount, formatDate, openModal, confirmDialog, formDialog };
})();
