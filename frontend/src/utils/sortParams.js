/**
 * vue3-easy-data-table may expose sortBy/sortType as a string (single column)
 * or as arrays. Always normalize to arrays before sending to the API.
 */
export function toSortArray(value) {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value.filter((v) => v != null && v !== '');
  return [value];
}

export function normalizeSortParams(sortBy, sortType) {
  const by = toSortArray(sortBy);
  let type = toSortArray(sortType);

  if (by.length && type.length === 0) {
    type = by.map(() => 'asc');
  }
  if (type.length < by.length) {
    type = [...type, ...Array(by.length - type.length).fill('asc')];
  }
  if (type.length > by.length) {
    type = type.slice(0, by.length);
  }

  return {
    sortBy: JSON.stringify(by),
    sortType: JSON.stringify(type),
  };
}
