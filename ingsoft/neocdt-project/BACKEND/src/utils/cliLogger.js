const SENSITIVE_FIELDS = ['password', 'token', 'authorization', 'secret', 'document', 'email', 'headers'];

export function redactObject(payload) {
  if (payload === null || payload === undefined) return payload;
  if (Array.isArray(payload)) {
    return payload.map((item) => redactObject(item));
  }
  if (typeof payload !== 'object') {
    return redactValue(payload);
  }

  return Object.entries(payload).reduce((acc, [key, val]) => {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
      acc[key] = '[REDACTED]';
    } else {
      acc[key] = redactValue(val);
    }
    return acc;
  }, {});
}

function redactValue(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    if (/bearer\s+[a-z0-9]/i.test(value)) {
      return '[REDACTED_TOKEN]';
    }
    if (value.includes('@')) {
      const [user, domain] = value.split('@');
      if (user.length <= 2) {
        return `${user[0] || ''}***@${domain}`;
      }
      // SonarQube Fix: Use .at(-1) instead of [length - 1]
      return `${user[0]}***${user.at(-1)}@${domain}`;
    }
    if (/^\d{6,}$/.test(value)) {
      // SonarQube Fix: Prefer String#replaceAll over String#replace (regex with global flag supported)
      return value.replaceAll(/\d(?=\d{4})/g, '*');
    }
    return value;
  }
  if (typeof value === 'object') {
    return redactObject(value);
  }
  return value;
}

const output = (level, message, meta) => {
  if (process.env.NODE_ENV === 'test' && level !== 'error') {
    return;
  }

  const timestamp = new Date().toISOString();
  const stream = level === 'error' ? process.stderr : process.stdout;
  const formattedMeta = meta ? ` ${JSON.stringify(redactObject(meta))}` : '';
  stream.write(`${timestamp} [${level.toUpperCase()}] ${message}${formattedMeta}\n`);
};

const renderTable = (input) => {
  if (!input) return ['[sin datos]'];

  const rows = Array.isArray(input) ? input : Object.entries(input).map(([key, value]) => ({ clave: key, valor: value }));

  if (rows.length === 0) return ['[sin datos]'];

  const headers = Object.keys(rows[0]);
  const columnWidths = headers.map((header) => Math.max(header.length, ...rows.map((row) => String(row[header] ?? '').length)));

  const buildLine = (values) => `| ${values.map((value, index) => {
    const cell = String(value ?? '');
    return cell.padEnd(columnWidths[index], ' ');
  }).join(' | ')} |`;

  const separator = `+-${columnWidths.map((width) => ''.padEnd(width, '-')).join('-+-')}-+`;
  const tableLines = [separator, buildLine(headers), separator];

  for (const row of rows) {
    const values = headers.map((header) => row[header] ?? '');
    tableLines.push(buildLine(values));
  }

  tableLines.push(separator);
  return tableLines;
};

export const cliLogger = {
  info: (message, meta) => output('info', message, meta),
  warn: (message, meta) => output('warn', message, meta),
  error: (message, meta) => output('error', message, meta),
  success: (message, meta) => output('success', message, meta),
  blank: () => output('info', ''),
  divider: (length = 60, char = '-') => output('info', char.repeat(length)),
  table: (title, rows) => {
    if (title) {
      output('info', title);
    }
    const tableLines = renderTable(rows);
    for (const line of tableLines) {
      output('info', line);
    }
  }
};

export default cliLogger;
