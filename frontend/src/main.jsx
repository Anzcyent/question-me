import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

// GitHub Pages SPA redirect handler
(function () {
  var redirect = sessionStorage.redirect;
  delete sessionStorage.redirect;
  if (redirect && redirect !== location.href) {
    history.replaceState(null, null, redirect);
  }
})();

// 404.html redirect: read "?/path" query and restore
(function () {
  var l = window.location;
  if (l.search && l.search.startsWith("?/")) {
    var path = l.search.slice(1);
    window.history.replaceState(null, null, path);
  }
})();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
