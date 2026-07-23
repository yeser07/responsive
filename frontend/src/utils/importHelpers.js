export function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cols[index] || '';
    });
    return row;
  });
}

export function downloadCsvTemplate(filename, headers, sampleRow) {
  const csv = `${headers.join(',')}\n${sampleRow.join(',')}\n`;
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
