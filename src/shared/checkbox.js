(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoCheckbox = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const className = '_x_extension_checkbox_2026_unique_';
  const groupClassName = '_x_extension_checkbox_group_2026_unique_';

  function normalizeInputs(inputs) {
    return (Array.isArray(inputs) ? inputs : [])
      .filter((input) => input && typeof input.addEventListener === 'function');
  }

  function createRequiredGroup(inputs, options) {
    const settings = options && typeof options === 'object' ? options : {};
    const inputList = normalizeInputs(inputs);
    const getValue = typeof settings.getValue === 'function'
      ? settings.getValue
      : (input) => input && input.value;
    const normalizeValue = typeof settings.normalizeValue === 'function'
      ? settings.normalizeValue
      : (value) => (Array.isArray(value) && value.length > 0 ? value : []);
    const onChange = typeof settings.onChange === 'function'
      ? settings.onChange
      : () => {};

    function readValue() {
      return inputList
        .filter((input) => input.checked)
        .map(getValue)
        .filter(Boolean);
    }

    function setValue(value) {
      const selected = new Set(normalizeValue(value));
      inputList.forEach((input) => {
        input.checked = selected.has(getValue(input));
      });
    }

    function handleChange(event) {
      let nextValue = readValue();
      const target = event && event.target ? event.target : null;
      if (nextValue.length <= 0 && target) {
        target.checked = true;
        nextValue = readValue();
      }
      const normalized = normalizeValue(nextValue);
      setValue(normalized);
      onChange(normalized);
    }

    inputList.forEach((input) => {
      input.addEventListener('change', handleChange);
    });

    return Object.freeze({
      getValue: readValue,
      setValue,
      refresh: () => setValue(readValue())
    });
  }

  return Object.freeze({
    className,
    groupClassName,
    createRequiredGroup
  });
});
