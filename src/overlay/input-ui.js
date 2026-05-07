(function(root) {
  if (!root) {
    return;
  }
  if (root.LumnoSearchInputUI && typeof root.LumnoSearchInputUI.createSearchInput === 'function') {
    root._x_extension_createSearchInput_2024_unique_ = root.LumnoSearchInputUI.createSearchInput;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
