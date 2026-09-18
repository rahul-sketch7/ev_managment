export const downloadTextFile = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const toCsv = (rows: Array<Record<string, unknown>>, columns?: string[]) => {
  const resolvedColumns = columns || (rows.length ? Object.keys(rows[0]) : []);
  if (!resolvedColumns.length) return 'status\r\n"No data available"\r\n';
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return [resolvedColumns.map(escape).join(','), ...rows.map((row) => resolvedColumns.map((column) => escape(row[column])).join(','))].join('\r\n');
};

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

export const printReport = (title: string, reportText?: string) => {
  const content = reportText || document.querySelector('main')?.innerText || document.body.innerText;
  const reportHtml = escapeHtml(content).replace(/\r?\n/g, '<br />');
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 16mm; }
    body { margin: 0; background: #fff; color: #0b1c30; font: 14px/1.55 Arial, sans-serif; }
    h1 { color: #00163d; font-size: 22px; border-bottom: 2px solid #00163d; padding-bottom: 8px; }
    .content { white-space: normal; overflow-wrap: anywhere; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="content">${reportHtml}</div>
</body>
</html>`;
  const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.html`;
  downloadTextFile(filename, html, 'text/html;charset=utf-8');
};
