import { MarkdownTableData } from '@/components/Chat/MarkdownTableBlock';

export type MarkdownContentPart =
  | { type: 'text'; value: string }
  | { type: 'table'; markdown: string; data: MarkdownTableData };

function splitPipeRow(line: string) {
  const trimmed = line.trim();
  const noOuterPipes = trimmed.replace(/^\|/, '').replace(/\|$/, '');
  return noOuterPipes.split('|').map((c) => c.trim());
}

function isSeparatorRow(line: string) {
  // Examples:
  // |-----|:---:|----|
  // ----- | ---- | -----
  const cells = splitPipeRow(line);
  if (cells.length < 2) return false;
  return cells.every((c) => /^:?-{3,}:?$/.test(c.replace(/\s/g, '')));
}

function parsePipeTable(markdown: string): MarkdownTableData | null {
  const lines = markdown
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);

  if (lines.length < 3) return null;

  const headerLine = lines[0];
  const separatorLine = lines[1];
  if (!headerLine.includes('|') || !isSeparatorRow(separatorLine)) return null;

  const headers = splitPipeRow(headerLine);
  const rows = lines.slice(2).map((l) => splitPipeRow(l));

  // Normalize row lengths
  const width = headers.length;
  const normalizedRows = rows.map((r) => {
    const out = new Array(width).fill('');
    for (let i = 0; i < Math.min(width, r.length); i++) out[i] = r[i] ?? '';
    return out;
  });

  return { headers, rows: normalizedRows };
}

// Extract one or more GFM pipe-tables from a blob of text.
// Works best when backend returns the table as plain markdown (with newlines).
export function extractMarkdownPipeTables(content: string): MarkdownContentPart[] {
  const parts: MarkdownContentPart[] = [];

  const re =
    /(^\s*\|.*\|\s*\n\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*\n(?:\s*\|.*\|\s*(?:\n|$))+)/gm;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const start = match.index;
    const end = start + match[0].length;

    const before = content.slice(lastIndex, start);
    if (before.trim().length > 0) parts.push({ type: 'text', value: before });

    const markdown = match[0].trim();
    const data = parsePipeTable(markdown);
    if (data) {
      parts.push({ type: 'table', markdown, data });
    } else {
      // Fallback to text if parsing fails
      parts.push({ type: 'text', value: match[0] });
    }

    lastIndex = end;
  }

  const after = content.slice(lastIndex);
  if (after.trim().length > 0) parts.push({ type: 'text', value: after });

  if (parts.length === 0) return [{ type: 'text', value: content }];
  return parts;
}

