/** PDF table minimal — blob nommé via <a download> (print Chrome laisse le nom vide). */

export type TablePdfInput = {
  landscape: boolean;
  title: string;
  subtitle: string;
  countLabel: string;
  headers: string[];
  rows: string[][];
};

const A4 = {
  portrait: { w: 595.28, h: 841.89 },
  landscape: { w: 841.89, h: 595.28 },
};

export function buildTablePdf(input: TablePdfInput): Blob {
  const page = input.landscape ? A4.landscape : A4.portrait;
  const margin = 36;
  const usableW = page.w - margin * 2;
  const nCols = Math.max(1, input.headers.length);
  const colW = usableW / nCols;
  const fontSize = input.landscape ? 7.5 : 8.5;
  const headerSize = input.landscape ? 7 : 8;
  const rowH = fontSize + 6;
  const headerH = headerSize + 8;
  const topReserve = 52;

  const streams: string[] = [];
  let ops: string[] = [];
  let y = 0;
  let rowIndex = 0;

  const emit = (...xs: string[]) => {
    ops.push(...xs);
  };

  const paintHeader = () => {
    emit(`0.95 0.95 0.95 rg`);
    emit(`${margin} ${y - headerH} ${usableW} ${headerH} re f`);
    emit(`0.13 0.13 0.13 RG 0.7 w`);
    emit(`${margin} ${y} m ${margin + usableW} ${y} l S`);
    emit(`${margin} ${y - headerH} m ${margin + usableW} ${y - headerH} l S`);
    emit(`0.38 0.38 0.38 rg`);
    input.headers.forEach((h, i) => {
      emit(
        `BT /F1 ${headerSize} Tf ${margin + i * colW + 2.5} ${y - headerH + 3.5} Td ${pdfStr(clip(h, colW, headerSize))} Tj ET`,
      );
    });
    y -= headerH + 1;
  };

  const startPage = (first: boolean) => {
    if (ops.length) {
      streams.push(ops.join("\n"));
      ops = [];
    }
    y = page.h - margin;
    if (first) {
      emit(`0.92 0.34 0.05 rg`);
      emit(`BT /F1 8 Tf ${margin} ${y - 8} Td ${pdfStr("BACK2MBOA  ·  CRM")} Tj ET`);
      emit(`0.13 0.13 0.13 rg`);
      emit(`BT /F1 15 Tf ${margin} ${y - 26} Td ${pdfStr(input.title)} Tj ET`);
      emit(`0.38 0.38 0.38 rg`);
      emit(`BT /F1 8 Tf ${margin} ${y - 40} Td ${pdfStr(input.subtitle)} Tj ET`);
      const mw = Math.min(input.countLabel.length * 5.2, 180);
      emit(`0.13 0.13 0.13 rg`);
      emit(
        `BT /F1 10 Tf ${page.w - margin - mw} ${y - 26} Td ${pdfStr(input.countLabel)} Tj ET`,
      );
      emit(`0.13 0.13 0.13 RG 1.25 w`);
      emit(`${margin} ${y - topReserve + 6} m ${margin + usableW} ${y - topReserve + 6} l S`);
      y -= topReserve;
    } else {
      y -= 10;
    }
    paintHeader();
  };

  startPage(true);
  for (const row of input.rows) {
    if (y < margin + rowH + 16) startPage(false);
    if (rowIndex % 2 === 1) {
      emit(`0.98 0.98 0.98 rg`);
      emit(`${margin} ${y - rowH} ${usableW} ${rowH} re f`);
    }
    emit(`0.13 0.13 0.13 rg`);
    row.forEach((cell, i) => {
      emit(
        `BT /F1 ${fontSize} Tf ${margin + i * colW + 2.5} ${y - rowH + 3.5} Td ${pdfStr(clip(cell, colW, fontSize))} Tj ET`,
      );
    });
    emit(`0.91 0.91 0.91 RG 0.35 w`);
    emit(`${margin} ${y - rowH} m ${margin + usableW} ${y - rowH} l S`);
    y -= rowH;
    rowIndex++;
  }
  if (ops.length) streams.push(ops.join("\n"));
  if (!streams.length) streams.push("BT /F1 10 Tf 72 720 Td (Empty) Tj ET");

  return assemble(page.w, page.h, streams);
}

function assemble(w: number, h: number, streams: string[]): Blob {
  // obj 1 = font, 2..1+n = contents, 2+n..1+2n = pages, last-1 = pages tree, last = catalog
  const chunks: string[] = [];
  const offsets: number[] = [0];

  const writeObj = (body: string) => {
    const num = chunks.length + 1;
    chunks.push(`${num} 0 obj\n${body}\nendobj\n`);
    return num;
  };

  const fontId = writeObj(
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`,
  );

  const contentIds = streams.map((s) =>
    writeObj(`<< /Length ${s.length} >>\nstream\n${s}\nendstream`),
  );

  // Reserve page object numbers
  const pageStart = chunks.length + 1;
  const pageIds = contentIds.map((_, i) => pageStart + i);
  const pagesId = pageStart + contentIds.length;
  const catalogId = pagesId + 1;

  contentIds.forEach((cid, i) => {
    writeObj(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${w} ${h}] /Contents ${cid} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`,
    );
  });

  writeObj(
    `<< /Type /Pages /Kids [ ${pageIds.map((id) => `${id} 0 R`).join(" ")} ] /Count ${pageIds.length} >>`,
  );
  writeObj(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  for (const c of chunks) {
    offsets.push(pdf.length);
    pdf += c;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${chunks.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= chunks.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${chunks.length + 1} /Root ${catalogId} 0 R >>\n`;
  pdf += `startxref\n${xref}\n%%EOF`;

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return new Blob([bytes], { type: "application/pdf" });
}

function clip(s: string, colW: number, size: number) {
  const max = Math.max(3, Math.floor(colW / (size * 0.48)) - 1);
  const t = String(s || "")
    .replace(/\s+/g, " ")
    .trim();
  return t.length <= max ? t : `${t.slice(0, Math.max(1, max - 1))}…`;
}

function pdfStr(raw: string) {
  let out = "(";
  for (const ch of raw) {
    const c = winAnsi(ch);
    if (c === 40 || c === 41 || c === 92) out += `\\${String.fromCharCode(c)}`;
    else if (c < 32 || c > 126) out += `\\${c.toString(8).padStart(3, "0")}`;
    else out += String.fromCharCode(c);
  }
  return `${out})`;
}

function winAnsi(ch: string): number {
  const map: Record<string, number> = {
    À: 0xc0,
    Â: 0xc2,
    Ä: 0xc4,
    Ç: 0xc7,
    È: 0xc8,
    É: 0xc9,
    Ê: 0xca,
    Ë: 0xcb,
    Î: 0xce,
    Ï: 0xcf,
    Ô: 0xd4,
    Ù: 0xd9,
    Û: 0xdb,
    Ü: 0xdc,
    à: 0xe0,
    â: 0xe2,
    ä: 0xe4,
    ç: 0xe7,
    è: 0xe8,
    é: 0xe9,
    ê: 0xea,
    ë: 0xeb,
    î: 0xee,
    ï: 0xef,
    ô: 0xf4,
    ù: 0xf9,
    û: 0xfb,
    ü: 0xfc,
    œ: 0x9c,
    Œ: 0x8c,
    "’": 0x27,
    "‘": 0x27,
    "–": 0x2d,
    "—": 0x2d,
    "…": 0x2e,
    "·": 0xb7,
  };
  if (map[ch] != null) return map[ch];
  const code = ch.charCodeAt(0);
  if (code < 256) return code;
  const stripped = ch.normalize("NFD").replace(/\p{M}/gu, "");
  const c0 = stripped.charCodeAt(0);
  return c0 < 256 ? c0 : 63;
}
