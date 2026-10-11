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

  // fields: [{name, label, type = "text", required, placeholder}]
  // Resolves with {name: trimmedValue, ...}, or null when cancelled.
  function formDialog({ title, fields, initial = {}, submitLabel }) {
    const S = CrossLy.strings.common;
    return new Promise((resolve) => {
      const error = h("p", { class: "form-error", hidden: true });
      const inputs = {};
      const form = h(
        "form",
        { class: "form", novalidate: true },
        fields.map((f) => {
          inputs[f.name] = h("input", {
            id: `field-${f.name}`,
            name: f.name,
            type: f.type || "text",
            placeholder: f.placeholder || "",
            value: initial[f.name] || "",
            autocomplete: "off",
          });
          return h("label", { class: "field", for: `field-${f.name}` },
            h("span", {}, f.label, f.required ? " *" : ""), inputs[f.name]);
        }),
        error
      );

      function submit(close) {
        const values = {};
        for (const f of fields) {
          values[f.name] = inputs[f.name].value.trim();
          if (f.required && !values[f.name]) {
            error.textContent = `${f.label} : ${S.fieldRequired}`;
            error.hidden = false;
            inputs[f.name].focus();
            return;
          }
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
