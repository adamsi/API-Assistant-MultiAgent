import { IconDownload, IconMaximize, IconX } from '@tabler/icons-react';
import {
  Box,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import ExcelJS from 'exceljs';
import { FC, useEffect, useMemo, useState } from 'react';

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

const iconButtonSx = { color: 'text.secondary', '&:hover': { color: 'primary.main' } };

function TableContent({ normalized }: { normalized: MarkdownTableData }) {
  return (
    <Table size="small" sx={{ minWidth: 'max-content' }}>
      <TableHead>
        <TableRow>
          {normalized.headers.map((h, idx) => (
            <TableCell key={`${h}-${idx}`} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
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
                sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}
              >
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export const MarkdownTableBlock: FC<{
  data: MarkdownTableData;
  filenameBase?: string;
}> = ({ data, filenameBase = 'assistant-table' }) => {
  const [downloading, setDownloading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isModalOpen]);

  const normalized = useMemo<MarkdownTableData>(() => {
    const headers = (data.headers ?? []).map((h) => (h ?? '').trim());
    const rows = (data.rows ?? []).map((r) =>
      headers.map((_, i) => (r?.[i] ?? '').trim()),
    );
    return { headers, rows };
  }, [data.headers, data.rows]);

  return (
    <Box className="not-prose" sx={{ my: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0, mb: 0.5 }}>
        <IconButton
          size="small"
          onClick={() => setIsModalOpen(true)}
          sx={iconButtonSx}
          title="View full screen"
        >
          <IconMaximize size={18} />
        </IconButton>
        <IconButton
          size="small"
          disabled={downloading || normalized.headers.length === 0}
          onClick={async () => {
            setDownloading(true);
            try {
              await downloadTableAsXlsx(filenameBase, normalized);
            } finally {
              setDownloading(false);
            }
          }}
          sx={iconButtonSx}
          title="Download as Excel"
        >
          <IconDownload size={18} />
        </IconButton>
      </Box>

      {/* Fullscreen Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div
            className="relative bg-gray-950/95 backdrop-blur-xl w-full min-w-0 h-full sm:w-[90vw] sm:h-[90vh] sm:max-w-[1400px] flex flex-col max-w-full border border-white/30 shadow-[0_0_40px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-semibold text-white">Table</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden bg-gradient-to-br from-gray-800/50 via-gray-700/40 to-gray-800/50 p-4">
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{
                  flex: 1,
                  minHeight: 0,
                  minWidth: 0,
                  width: '100%',
                  maxWidth: '100%',
                  overflow: 'auto',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  '& .MuiTableCell-root': { color: 'rgba(255,255,255,0.9)' },
                  '& .MuiTableHead .MuiTableCell-root': { color: 'rgba(255,255,255,0.95)' },
                }}
              >
                <TableContent normalized={normalized} />
              </TableContainer>
            </div>
          </div>
        </div>
      )}

      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          width: '100%',
          overflowX: 'auto',
          backgroundColor: 'transparent',
        }}
      >
        <TableContent normalized={normalized} />
      </TableContainer>
    </Box>
  );
};

