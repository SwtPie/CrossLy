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

  CrossLy.ui = { h, toast, setTitle, mount };
})();
