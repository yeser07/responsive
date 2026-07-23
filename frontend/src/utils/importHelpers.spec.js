import { describe, expect, it } from 'vitest';
import { parseCsv } from './importHelpers.js';

describe('parseCsv', () => {
  it('parses quoted commas', () => {
    const rows = parseCsv('name,job\n"Perez, Juan",Analyst\n');
    expect(rows).toEqual([{ name: 'Perez, Juan', job: 'Analyst' }]);
  });

  it('supports escaped quotes', () => {
    const rows = parseCsv('name\n"He said ""hi"""\n');
    expect(rows[0].name).toBe('He said "hi"');
  });
});
