import { describe, it, expect } from 'vitest';
import { parsePagination, parseSort } from '../utils/pagination.js';

describe('pagination utils', () => {
  it('parses page and rows with caps', () => {
    expect(parsePagination({ page: '2', rowsPerPage: '25' })).toEqual({
      page: 2,
      rowsPerPage: 25,
      skip: 25,
      limit: 25,
    });
    expect(parsePagination({ rowsPerPage: '9999' }).rowsPerPage).toBe(200);
  });

  it('whitelists sort fields', () => {
    const sort = parseSort(
      { sortBy: JSON.stringify(['name', 'hack']), sortType: JSON.stringify(['desc', 'asc']) },
      ['name', 'status'],
      'name'
    );
    expect(sort).toEqual({ name: -1 });
  });

  it('accepts string sortBy/sortType from EasyDataTable', () => {
    const sort = parseSort(
      { sortBy: JSON.stringify('className'), sortType: JSON.stringify('desc') },
      ['className', 'serialNumber'],
      'className'
    );
    expect(sort).toEqual({ className: -1 });
  });

  it('defaults when arrays are empty', () => {
    const sort = parseSort(
      { sortBy: '[]', sortType: '[]' },
      ['name'],
      'name'
    );
    expect(sort).toEqual({ name: 1 });
  });
});
