import { describe, expect, it } from 'vitest';
import { normalizeSortParams, toSortArray } from './sortParams.js';

describe('sortParams', () => {
  it('wraps string sort values into JSON arrays', () => {
    expect(normalizeSortParams('className', 'desc')).toEqual({
      sortBy: JSON.stringify(['className']),
      sortType: JSON.stringify(['desc']),
    });
  });

  it('keeps arrays as arrays', () => {
    expect(normalizeSortParams(['name'], ['asc'])).toEqual({
      sortBy: JSON.stringify(['name']),
      sortType: JSON.stringify(['asc']),
    });
  });

  it('pads missing sort types with asc', () => {
    expect(toSortArray(null)).toEqual([]);
    expect(normalizeSortParams(['a', 'b'], 'asc')).toEqual({
      sortBy: JSON.stringify(['a', 'b']),
      sortType: JSON.stringify(['asc', 'asc']),
    });
  });
});
