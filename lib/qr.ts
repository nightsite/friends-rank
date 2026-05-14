/**
 * Minimal QR code generator (numeric + byte mode) up to version 10, level Q.
 * Adapted from public-domain reference implementations. Returns a 2-D matrix
 * of booleans (true = dark).
 *
 * Designed to be small enough to ship inline — no external dependencies.
 */

const GF_EXP: number[] = new Array(512).fill(0);
const GF_LOG: number[] = new Array(256).fill(0);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[(GF_LOG[a] + GF_LOG[b]) % 255];
}

function rsGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], 1);
      next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: number[], ecLen: number): number[] {
  const gen = rsGeneratorPoly(ecLen);
  const result = data.concat(new Array(ecLen).fill(0));
  for (let i = 0; i < data.length; i++) {
    const coef = result[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        result[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return result.slice(data.length);
}

// Version capacity table for level Q (byte mode, total data codewords).
// Source: ISO/IEC 18004. Version index 1..10.
const Q_DATA_CODEWORDS = [
  /* v1  */ 13, /* v2  */ 22, /* v3  */ 34, /* v4  */ 48, /* v5  */ 62,
  /* v6  */ 76, /* v7  */ 88, /* v8  */ 110, /* v9  */ 132, /* v10 */ 154,
];
const Q_EC_CODEWORDS = [13, 22, 36, 52, 72, 96, 108, 132, 160, 192];
const Q_BLOCKS = [1, 1, 2, 2, 4, 4, 6, 6, 8, 8];

function pickVersion(byteLength: number): number {
  for (let v = 1; v <= 10; v++) {
    const dataCodewords = Q_DATA_CODEWORDS[v - 1];
    // mode (4) + char count (8 for v1-9, 16 for v10+ byte) + bytes*8
    const charCountBits = v <= 9 ? 8 : 16;
    const bits = 4 + charCountBits + byteLength * 8;
    if (Math.ceil(bits / 8) + 1 <= dataCodewords) return v;
  }
  throw new Error("QR payload too large for v10 capacity.");
}

function buildBitstream(text: string, version: number): number[] {
  const bytes: number[] = [];
  for (const c of text) {
    const code = c.charCodeAt(0);
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }
  const charCountBits = version <= 9 ? 8 : 16;
  const bits: number[] = [];
  function pushBits(value: number, len: number) {
    for (let i = len - 1; i >= 0; i--) bits.push((value >> i) & 1);
  }
  pushBits(0b0100, 4);
  pushBits(bytes.length, charCountBits);
  for (const b of bytes) pushBits(b, 8);

  const dataCodewords = Q_DATA_CODEWORDS[version - 1];
  // terminator
  for (let i = 0; i < 4 && bits.length < dataCodewords * 8; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    codewords.push(b);
  }
  const pads = [0xec, 0x11];
  let p = 0;
  while (codewords.length < dataCodewords) codewords.push(pads[p++ & 1]);
  return codewords;
}

function interleaveBlocks(data: number[], version: number): number[] {
  const blockCount = Q_BLOCKS[version - 1];
  const ecPerBlock = Math.floor(Q_EC_CODEWORDS[version - 1] / blockCount);
  const dataPerBlock = Math.floor(Q_DATA_CODEWORDS[version - 1] / blockCount);
  const remainder = Q_DATA_CODEWORDS[version - 1] % blockCount;
  const blocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let idx = 0;
  for (let i = 0; i < blockCount; i++) {
    const size = dataPerBlock + (i >= blockCount - remainder ? 1 : 0);
    const block = data.slice(idx, idx + size);
    idx += size;
    blocks.push(block);
    ecBlocks.push(rsEncode(block, ecPerBlock));
  }

  const maxData = Math.max(...blocks.map((b) => b.length));
  const out: number[] = [];
  for (let col = 0; col < maxData; col++) {
    for (const b of blocks) if (col < b.length) out.push(b[col]);
  }
  for (let col = 0; col < ecPerBlock; col++) {
    for (const b of ecBlocks) out.push(b[col]);
  }
  return out;
}

const ALIGNMENT_POSITIONS: number[][] = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

function setupMatrix(version: number): {
  matrix: boolean[][];
  reserved: boolean[][];
  size: number;
} {
  const size = 17 + version * 4;
  const matrix: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  function placeFinder(r: number, c: number) {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
        const inside =
          dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6 &&
          (dr === 0 || dr === 6 || dc === 0 || dc === 6 ||
            (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
        matrix[rr][cc] = inside;
        reserved[rr][cc] = true;
      }
    }
  }
  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
    reserved[6][i] = true;
    reserved[i][6] = true;
  }

  // alignment patterns
  const positions = ALIGNMENT_POSITIONS[version];
  for (const r of positions) {
    for (const c of positions) {
      if (
        (r === 6 && c === 6) ||
        (r === 6 && c === size - 7) ||
        (r === size - 7 && c === 6)
      )
        continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const rr = r + dr;
          const cc = c + dc;
          const mark =
            Math.abs(dr) === 2 ||
            Math.abs(dc) === 2 ||
            (dr === 0 && dc === 0);
          matrix[rr][cc] = mark;
          reserved[rr][cc] = true;
        }
      }
    }
  }

  // format reservation around finders
  for (let i = 0; i < 9; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    reserved[size - 1 - i][8] = true;
    reserved[8][size - 1 - i] = true;
  }
  matrix[size - 8][8] = true;
  reserved[size - 8][8] = true;

  return { matrix, reserved, size };
}

function placeData(matrix: boolean[][], reserved: boolean[][], size: number, bits: number[]) {
  let idx = 0;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i;
      for (let c = 0; c < 2; c++) {
        const cc = col - c;
        if (reserved[row][cc]) continue;
        const bit = idx < bits.length ? bits[idx] : 0;
        matrix[row][cc] = bit === 1;
        idx++;
      }
    }
    upward = !upward;
  }
}

function maskCondition(mask: number, r: number, c: number): boolean {
  switch (mask) {
    case 0: return (r + c) % 2 === 0;
    case 1: return r % 2 === 0;
    case 2: return c % 3 === 0;
    case 3: return (r + c) % 3 === 0;
    case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    case 7: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
  }
  return false;
}

function applyMask(matrix: boolean[][], reserved: boolean[][], size: number, mask: number) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c] && maskCondition(mask, r, c)) {
        matrix[r][c] = !matrix[r][c];
      }
    }
  }
}

function placeFormat(matrix: boolean[][], size: number, mask: number) {
  // ECC level Q = 0b11
  const formatBits = (0b11 << 3) | mask;
  let bits = formatBits << 10;
  const gen = 0b10100110111;
  for (let i = 14; i >= 10; i--) {
    if ((bits >> i) & 1) bits ^= gen << (i - 10);
  }
  const full = ((formatBits << 10) | bits) ^ 0b101010000010010;
  const arr: boolean[] = [];
  for (let i = 14; i >= 0; i--) arr.push(((full >> i) & 1) === 1);

  // top-left
  for (let i = 0; i < 6; i++) matrix[8][i] = arr[i];
  matrix[8][7] = arr[6];
  matrix[8][8] = arr[7];
  matrix[7][8] = arr[8];
  for (let i = 0; i < 6; i++) matrix[5 - i][8] = arr[9 + i];
  // bottom-left + top-right
  for (let i = 0; i < 7; i++) matrix[size - 1 - i][8] = arr[i];
  for (let i = 0; i < 8; i++) matrix[8][size - 8 + i] = arr[7 + i];
}

function scoreMask(matrix: boolean[][], size: number): number {
  let score = 0;
  // rule 1: runs of 5+
  for (let r = 0; r < size; r++) {
    let run = 1;
    for (let c = 1; c < size; c++) {
      if (matrix[r][c] === matrix[r][c - 1]) {
        run++;
      } else {
        if (run >= 5) score += run - 2;
        run = 1;
      }
    }
    if (run >= 5) score += run - 2;
  }
  for (let c = 0; c < size; c++) {
    let run = 1;
    for (let r = 1; r < size; r++) {
      if (matrix[r][c] === matrix[r - 1][c]) {
        run++;
      } else {
        if (run >= 5) score += run - 2;
        run = 1;
      }
    }
    if (run >= 5) score += run - 2;
  }
  return score;
}

export function buildQrMatrix(text: string): boolean[][] {
  const utf8Bytes: number[] = [];
  for (const c of text) {
    const code = c.charCodeAt(0);
    if (code < 0x80) utf8Bytes.push(code);
    else if (code < 0x800) utf8Bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    else utf8Bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
  }
  const version = pickVersion(utf8Bytes.length);
  const codewords = buildBitstream(text, version);
  const interleaved = interleaveBlocks(codewords, version);

  const bits: number[] = [];
  for (const b of interleaved) for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);

  let best: { mask: number; matrix: boolean[][] } | null = null;
  for (let mask = 0; mask < 8; mask++) {
    const { matrix, reserved, size } = setupMatrix(version);
    placeData(matrix, reserved, size, bits);
    applyMask(matrix, reserved, size, mask);
    placeFormat(matrix, size, mask);
    const s = scoreMask(matrix, size);
    if (!best || s < scoreMask(best.matrix, size)) {
      best = { mask, matrix };
    }
  }
  return best!.matrix;
}

export function renderQrSvg(text: string, opts?: { scale?: number; quiet?: number }): string {
  const matrix = buildQrMatrix(text);
  const size = matrix.length;
  const scale = opts?.scale ?? 8;
  const quiet = opts?.quiet ?? 4;
  const total = (size + quiet * 2) * scale;
  const cells: string[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        cells.push(
          `<rect x="${(c + quiet) * scale}" y="${(r + quiet) * scale}" width="${scale}" height="${scale}"/>`,
        );
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total}" height="${total}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="white"/><g fill="black">${cells.join("")}</g></svg>`;
}
