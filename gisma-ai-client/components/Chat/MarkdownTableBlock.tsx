import { IconDownload } from '@tabler/icons-react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ExcelJS from 'exceljs';
import { FC, useMemo, useState } from 'react';

export type MarkdownTableData = {
  headers: string[];
  rows: string[][];
};

function sanitizeCellValue(value: string) {
  // Excel formula injection mitigation
  if (/^[=+\-@]/.test(value)) return `'${value}`;
  return value;
}

async function downloadTableAsXlsx(filenameBase: string, data: MarkdownTableData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GISMA AI Client';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Table');

  sheet.addRow(data.headers.map(sanitizeCellValue));
  for (const row of data.rows) {
    sheet.addRow(row.map((v) => sanitizeCellValue(v ?? '')));
  }

  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Basic autosize (bounded) for readability
  sheet.columns = data.headers.map((header, colIdx) => {
    const values = [header, ...data.rows.map((r) => r[colIdx] ?? '')];
    const max = Math.min(
      60,
      Math.max(10, ...values.map((v) => (typeof v === 'string' ? v.length : 10))),
    );
    return { width: max };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenameBase}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const MarkdownTableBlock: FC<{
  data: MarkdownTableData;
  filenameBase?: string;
}> = ({ data, filenameBase = 'assistant-table' }) => {
  const [downloading, setDownloading] = useState(false);

  const normalized = useMemo<MarkdownTableData>(() => {
    const headers = (data.headers ?? []).map((h) => (h ?? '').trim());
    const rows = (data.rows ?? []).map((r) =>
      headers.map((_, i) => (r?.[i] ?? '').trim()),
    );
    return { headers, rows };
  }, [data.headers, data.rows]);

  return (
    <Box className="not-prose" sx={{ my: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
        <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
          Table
        </Typography>
        <Button
          size="small"
          variant="outlined"
          disabled={downloading || normalized.headers.length === 0}
          startIcon={<IconDownload size={16} />}
          onClick={async () => {
            setDownloading(true);
            try {
              await downloadTableAsXlsx(filenameBase, normalized);
            } finally {
              setDownloading(false);
            }
          }}
        >
          {downloading ? 'Exporting…' : 'Download Excel'}
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          width: '100%',
          overflowX: 'auto',
          backgroundColor: 'transparent',
        }}
      >
        <Table size="small" sx={{ tableLayout: 'fixed', minWidth: 720 }}>
          <TableHead>
            <TableRow>
              {normalized.headers.map((h, idx) => (
                <TableCell
                  key={`${h}-${idx}`}
                  sx={{
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {normalized.rows.map((row, rIdx) => (
              <TableRow key={rIdx} hover>
                {row.map((cell, cIdx) => (
                  <TableCell
                    key={`${rIdx}-${cIdx}`}
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                    title={cell}
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

