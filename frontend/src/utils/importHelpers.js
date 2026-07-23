/**
 * RFC 4180-ish CSV parser with quoted fields and escaped quotes.
 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    if (row.length === 1 && row[0] === '' && rows.length === 0) {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  };

  const input = String(text || '').replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const next = input[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      pushField();
    } else if (char === '\n') {
      pushField();
      pushRow();
    } else if (char === '\r') {
      // ignore; handle \r\n via \n
    } else {
      field += char;
    }
  }

  if (field.length || row.length) {
    pushField();
    pushRow();
  }

  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((cols) => cols.some((c) => String(c).trim() !== '')).map((cols) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = (cols[index] || '').trim();
    });
    return item;
  });
}

export function downloadCsvTemplate(filename, headers, sampleRow) {
  const escape = (value) => {
    const text = String(value ?? '');
    if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  const csv = `${headers.map(escape).join(',')}\n${sampleRow.map(escape).join(',')}\n`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

export const CI_IMPORT_TEMPLATE = {
  filename: 'cis_import_template.csv',
  headers: ['className', 'serialNumber', 'brandName', 'modelName', 'location', 'status'],
  sampleRow: ['Laptop', 'SN-001', 'Dell', 'Latitude', 'Tegucigalpa', 'stock'],
  required: ['className', 'serialNumber', 'brandName', 'modelName', 'location'],
  optional: ['status'],
  statusValues: ['In use', 'stock', 'retired', 'missing', 'damaged'],
  preview: `className,serialNumber,brandName,modelName,location,status
Laptop,SN-001,Dell,Latitude,Tegucigalpa,stock`,
};

export const USER_OWNER_IMPORT_TEMPLATE = {
  filename: 'user_owners_import_template.csv',
  headers: ['name', 'logonUser', 'jobDescription', 'status'],
  sampleRow: ['Juan Perez', 'jperez', 'Analista', 'active'],
  required: ['name', 'logonUser', 'jobDescription'],
  optional: ['status'],
  statusValues: ['active', 'inactive'],
  preview: `name,logonUser,jobDescription,status
Juan Perez,jperez,Analista,active`,
};

export async function parseImportFile(file) {
  const text = await file.text();
  if (file.name.toLowerCase().endsWith('.json')) {
    const parsed = JSON.parse(text);
    const items = Array.isArray(parsed) ? parsed : parsed.items;
    if (!Array.isArray(items) || !items.length) {
      throw new Error('No items found in file');
    }
    return items;
  }
  const items = parseCsv(text);
  if (!items.length) {
    throw new Error('No items found in file');
  }
  return items;
}
