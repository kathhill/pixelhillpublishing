import axios from 'axios';

// Securely fetch the API key from an environment variable or backend
// const API_KEY = import.meta.env.PUBLIC_API_KEY;
// console.log(API_KEY);

const options = {
    method: 'GET',
    url: 'https://sudoku-all-purpose-pro.p.rapidapi.com/sudoku',
    headers: {
        'x-rapidapi-key': '367cc336fbmshd111f2775895059p1055e0jsn04b7fb5a3453',
        'x-rapidapi-host': 'sudoku-all-purpose-pro.p.rapidapi.com'        
    }
};

// Helper functions
// raw_data: 81-char string. Digits 1-9 are clues. '0' or '.' are blanks.
function parseRaw81(raw) {
  if (typeof raw !== "string" || raw.length !== 81) {
    throw new Error(`raw_data must be an 81-character string; got ${typeof raw} length ${raw?.length}`);
  }

  const grid = [];
  for (let r = 0; r < 9; r++) {
    const row = [];
    for (let c = 0; c < 9; c++) {
      const ch = raw[r * 9 + c];
      if (ch === "." || ch === "0") row.push(0);
      else if (ch >= "1" && ch <= "9") row.push(ch.charCodeAt(0) - 48);
      else throw new Error(`Invalid character '${ch}' in raw_data at index ${r * 9 + c}`);
    }
    grid.push(row);
  }
  return grid;
}

function cloneGrid(grid) {
  return grid.map(r => r.slice());
}

function isValidPlacement(grid, r, c, val) {
  for (let i = 0; i < 9; i++) {
    if (grid[r][i] === val) return false;
    if (grid[i][c] === val) return false;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let rr = br; rr < br + 3; rr++) {
    for (let cc = bc; cc < bc + 3; cc++) {
      if (grid[rr][cc] === val) return false;
    }
  }
  return true;
}

// MRV heuristic: choose empty cell with fewest candidates
function findBestEmptyCell(grid) {
  let best = null;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] !== 0) continue;

      const candidates = [];
      for (let v = 1; v <= 9; v++) {
        if (isValidPlacement(grid, r, c, v)) candidates.push(v);
      }
      if (candidates.length === 0) return { r, c, candidates: [] }; // dead end
      if (!best || candidates.length < best.candidates.length) {
        best = { r, c, candidates };
        if (candidates.length === 1) return best;
      }
    }
  }
  return best; // null => solved
}

// Count solutions up to `limit` (use limit=2 for uniqueness test)
function countSolutions(grid, limit = 2) {
  let count = 0;

  function backtrack() {
    if (count >= limit) return;

    const next = findBestEmptyCell(grid);
    if (next === null) {
      count += 1;
      return;
    }
    const { r, c, candidates } = next;
    if (candidates.length === 0) return;

    for (const v of candidates) {
      grid[r][c] = v;
      backtrack();
      grid[r][c] = 0;
      if (count >= limit) return;
    }
  }

  backtrack();
  return count;
}

// Add a local solver that returns the solved grid (and a solved raw string)
function solveOne(grid) {
  const g = cloneGrid(grid);

  function backtrack() {
    const next = findBestEmptyCell(g);
    if (next === null) return true; // solved

    const { r, c, candidates } = next;
    if (candidates.length === 0) return false;

    for (const v of candidates) {
      g[r][c] = v;
      if (backtrack()) return true;
      g[r][c] = 0;
    }
    return false;
  }

  return backtrack() ? g : null;
}

function gridToRaw81(grid) {
  let s = "";
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = grid[r][c];
      if (v < 1 || v > 9) throw new Error("gridToRaw81 expects a fully solved grid (digits 1-9).");
      s += String(v);
    }
  }
  return s;
}

async function fetchSudoku(maxTries = 25) {
  try {
    let raw = null;
    let base64Svg = null;

    // 1) Keep fetching until we get a uniquely solvable puzzle
    for (let attempt = 1; attempt <= maxTries; attempt++) {
      const options1 = { ...options, params: { create: 'evil', output: 'SVG' } };
      const response1 = await axios.request(options1);
      const data1 = response1.data;

      if (!data1.output || !data1.output.base64_data || !data1.output.raw_data) {
        console.warn(`Attempt ${attempt}: invalid API response, retrying...`);
        continue;
      }

      raw = data1.output.raw_data;         // 81-char puzzle string
      base64Svg = data1.output.base64_data; // puzzle SVG

      // Uniqueness test
      const grid = parseRaw81(raw);
      const solCount = countSolutions(cloneGrid(grid), 2);

      if (solCount === 1) {
        console.log(`Unique puzzle found on attempt ${attempt}.`);
        break;
      } else {
        console.log(`Attempt ${attempt}: not unique (solutions=${solCount}). Retrying...`);
        raw = null;
        base64Svg = null;
      }
    }

    if (!raw || !base64Svg) {
      throw new Error(`Could not fetch a uniquely solvable puzzle within ${maxTries} attempts.`);
    }

    // 2) Save puzzle SVG (unchanged)
    const decodedSvg = atob(base64Svg);
    const fileName = getUniqueFileName();
    const blob = new Blob([decodedSvg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log(`Puzzle SVG saved as "${fileName}".`);

    // 3) Solve locally
    const puzzleGrid = parseRaw81(raw);
    const solvedGrid = solveOne(puzzleGrid);

    if (!solvedGrid) {
      // This shouldn't happen if uniqueness check passed, but just in case.
      throw new Error("Local solver failed to solve the puzzle.");
    }

    const solvedRaw = gridToRaw81(solvedGrid);
    console.log("Solved locally (raw81):", solvedRaw);

    // 4) Verify with API (optional but recommended)
    const options3 = { ...options, params: { verify: solvedRaw } };
    const response3 = await axios.request(options3);
    const data3 = response3.data;
    console.log('Verification Result:', data3);

    // NOTE: At this point you are skipping the API solve entirely.

  } catch (error) {
    console.error('Error fetching data:', error);
    }
    
    const solutionSvg = makeSudokuSvgFromGrid(solvedGrid);
    const solutionFileName = getUniqueFileName2();
    downloadSvg(solutionSvg, solutionFileName);
    console.log(`Solution SVG saved as "${solutionFileName}".`);

}

// render solution svg locally
function makeSudokuSvgFromGrid(grid, cellSize = 50, padding = 20) {
  const size = padding * 2 + cellSize * 9;
  const fontSize = Math.floor(cellSize * 0.6);

  const lines = [];
  // Background
  lines.push(`<rect x="0" y="0" width="${size}" height="${size}" fill="white"/>`);

  // Grid lines
  for (let i = 0; i <= 9; i++) {
    const x = padding + i * cellSize;
    const y = padding + i * cellSize;
    const thick = (i % 3 === 0) ? 3 : 1;

    // vertical
    lines.push(`<line x1="${x}" y1="${padding}" x2="${x}" y2="${padding + 9 * cellSize}" stroke="black" stroke-width="${thick}"/>`);
    // horizontal
    lines.push(`<line x1="${padding}" y1="${y}" x2="${padding + 9 * cellSize}" y2="${y}" stroke="black" stroke-width="${thick}"/>`);
  }

  // Digits
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = grid[r][c];
      if (!v) continue;
      const cx = padding + c * cellSize + cellSize / 2;
      const cy = padding + r * cellSize + cellSize / 2 + fontSize * 0.35;

      lines.push(
        `<text x="${cx}" y="${cy}" text-anchor="middle" font-family="Arial" font-size="${fontSize}" fill="black">${v}</text>`
      );
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${lines.join("\n  ")}
</svg>`;
}

function downloadSvg(svgString, filename) {
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}



// original code:
// async function fetchSudoku() {
//     try {
//         // Request to create a Sudoku puzzle
//         const options1 = { ...options, params: { create: 'evil', output: 'SVG' } };
//         const response1 = await axios.request(options1);
//         const data1 = response1.data;

//         if (!data1.output || !data1.output.base64_data) {
//             throw new Error('Invalid API response: Missing base64_data');
//         }

//         const base64Svg = data1.output.base64_data;
//         const raw = data1.output.raw_data;

//         // Decode Base64 SVG
//         const decodedSvg = atob(base64Svg);

//         // Generatoe a unique filename 
//         const fileName = getUniqueFileName();

//         // Convert the SVG string into a Blob
//         const blob = new Blob([decodedSvg], { type: 'image/svg+xml' });

//         // Create a download link
//         const link = document.createElement('a');
//         link.href = URL.createObjectURL(blob);
//         link.download = fileName;

//         // Trigger the download
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);

//         console.log(`SVG file has been saved as "${fileName}".`);
       
//         // Solve the Sudoku puzzle
//         const options2 = { ...options, params: { solve: raw, output: 'SVG' } };
//         const response2 = await axios.request(options2);
//         const data2 = response2.data;

//         if (!data2.output || !data2.output.raw_data) {
//             throw new Error('Invalid API response: Missing raw_data');
//         }

//         const base64Svg2 = data2.output.base64_data;  
//         const raw2 = data2.output.raw_data;
//         console.log('Solved Sudoku:', data2);
      
//         // Decode Base64 SVG
//         const decodedSvg2 = atob(base64Svg2);

//         // Generatoe a unique filename 
//         const solutionFileName = getUniqueFileName2();

//         // Convert the SVG string into a Blob
//         const blob2 = new Blob([decodedSvg2], { type: 'image/svg+xml' });

//         // Create a download link
//         const solutionLink = document.createElement('a');
//         solutionLink.href = URL.createObjectURL(blob2);
//         solutionLink.download = solutionFileName;

//         // Trigger the download
//         document.body.appendChild(solutionLink);
//         solutionLink.click();
//         document.body.removeChild(solutionLink);

//         console.log(`SVG file has been saved as "${solutionFileName}".`);
        
//         // Verify the solution
//         const options3 = { ...options, params: { verify: raw2 } };
//         const response3 = await axios.request(options3);
//         const data3 = response3.data;
//         console.log('Verification Result:', data3);        

//     } catch (error) {
//         console.error('Error fetching data:', error);
//     }
// }

function getUniqueFileName() {
    let count = localStorage.getItem('sudokuCount') || 0;
    count = parseInt(count) + 1;
    localStorage.setItem('sudokuCount', count);
    return `sudoku${count}.svg`;
}

function getUniqueFileName2() {
    let count2 = localStorage.getItem('sudokuSolutionCount') || 0;
    count2 = parseInt(count2) + 1;
    localStorage.setItem('sudokuSolutionCount', count2);
    return `solution${count2}.svg`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function executeWithInterval(n) {
  for (let i = 0; i < n; i++) {
    await fetchSudoku();
    if (i < n - 1) await sleep(3 * 60 * 1000);
  }
  console.log("Function execution completed.");
}

// Execute the function n times
executeWithInterval(1);