const DEFAULT_PAGE = 1;
const DEFAULT_ROWS = 10;
const MAX_ROWS = 200;

function parsePagination(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || DEFAULT_PAGE);
  const rowsPerPage = Math.min(
    MAX_ROWS,
    Math.max(1, parseInt(query.rowsPerPage, 10) || DEFAULT_ROWS)
  );
  const skip = (page - 1) * rowsPerPage;
  return { page, rowsPerPage, skip, limit: rowsPerPage };
}

function parseSort(query = {}, allowedFields = [], defaultField = '_id') {
  let parsedSortBy = [];
  let parsedSortType = [];

  try {
    parsedSortBy = JSON.parse(query.sortBy || '[]');
    parsedSortType = JSON.parse(query.sortType || '[]');
  } catch {
    const err = new Error('Invalid sortBy or sortType format');
    err.status = 400;
    throw err;
  }

  // vue3-easy-data-table may send a single string instead of an array
  if (typeof parsedSortBy === 'string') {
    parsedSortBy = parsedSortBy ? [parsedSortBy] : [];
  }
  if (typeof parsedSortType === 'string') {
    parsedSortType = parsedSortType ? [parsedSortType] : [];
  }

  if (!Array.isArray(parsedSortBy) || !Array.isArray(parsedSortType)) {
    const err = new Error('sortBy and sortType must be arrays');
    err.status = 400;
    throw err;
  }

  if (parsedSortBy.length === 0) {
    parsedSortBy = [defaultField];
    parsedSortType = ['asc'];
  }

  if (parsedSortType.length === 0 && parsedSortBy.length > 0) {
    parsedSortType = parsedSortBy.map(() => 'asc');
  }

  if (parsedSortBy.length !== parsedSortType.length) {
    if (parsedSortType.length < parsedSortBy.length) {
      parsedSortType = [
        ...parsedSortType,
        ...Array(parsedSortBy.length - parsedSortType.length).fill('asc'),
      ];
    } else {
      parsedSortType = parsedSortType.slice(0, parsedSortBy.length);
    }
  }

  const sortObject = {};
  parsedSortBy.forEach((field, index) => {
    if (!allowedFields.includes(field)) return;
    sortObject[field] = parsedSortType[index] === 'desc' ? -1 : 1;
  });

  if (!Object.keys(sortObject).length) {
    sortObject[defaultField] = 1;
  }

  return sortObject;
}

module.exports = {
  parsePagination,
  parseSort,
  MAX_ROWS,
};
