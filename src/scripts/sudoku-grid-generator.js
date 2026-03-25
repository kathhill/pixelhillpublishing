function createSudokus() {

    // generate full grid, then ensure uniqueness
    class SudokuGenerator {
        constructor() {
            this.grid = Array.from({ length: 9 }, () => Array(9).fill(0));
        }

        // Standard safety check for Sudoku rules
        isSafe(row, col, num) {
            for (let i = 0; i < 9; i++) {
                if (this.grid[row][i] === num || this.grid[i][col] === num) return false;
            }
            const startRow = row - (row % 3), startCol = col - (col % 3);
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (this.grid[i + startRow][j + startCol] === num) return false;
                }
            }
            return true;
        }

        // Recursive backtracking to fill the grid
        fillGrid() {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (this.grid[row][col] === 0) {
                        let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
                        for (let num of nums) {
                            if (this.isSafe(row, col, num)) {
                                this.grid[row][col] = num;
                                if (this.fillGrid()) return true;
                                this.grid[row][col] = 0;
                            }
                        }
                        return false;
                    }
                }
            }
            return true;
        }

        // Counts solutions to ensure uniqueness
        countSolutions(grid, count = { val: 0 }) {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (grid[row][col] === 0) {
                        for (let num = 1; num <= 9; num++) {
                            if (this.isSafe(row, col, num)) { // Simplified safety check here
                                grid[row][col] = num;
                                this.countSolutions(grid, count);
                                if (count.val > 1) return; // Exit early if non-unique
                                grid[row][col] = 0;
                            }
                        }
                        return;
                    }
                }
            }
            count.val++;
        }

        removeClues(attempts = 40) {
            while (attempts > 0) {
                let row = Math.floor(Math.random() * 9);
                let col = Math.floor(Math.random() * 9);
                while (this.grid[row][col] === 0) {
                    row = Math.floor(Math.random() * 9);
                    col = Math.floor(Math.random() * 9);
                }
                let backup = this.grid[row][col];
                this.grid[row][col] = 0;

                let count = { val: 0 };
                this.countSolutions(JSON.parse(JSON.stringify(this.grid)), count);

                if (count.val !== 1) {
                    this.grid[row][col] = backup;
                    attempts--;
                }
            }
        }
    }



    const sudoku = new SudokuGenerator();

    sudoku.fillGrid(); // returns true/false

    // easy: ~35-40 givens, medium: ~30-35 givens, hard: ~22-28 givens, expert/evil: 17 givens 
    sudoku.removeClues(0);

    const solution = sudoku.grid;

    const raw1 = solution.toString();
    const cleanRaw1 = raw1.replace(/,/g, "");
    
    // ~20-30 easy; ~35-40 medium; ~45-50+ hard
    sudoku.removeClues(70);
    
    const puzzle = sudoku.grid;
    
    const raw2 = puzzle.toString();
    const cleanRaw2 = raw2.replace(/,/g, "");
    console.log(cleanRaw2);


   function saveSvgFile(svgString, fileName) {
        // Convert the SVG string into a Blob
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        // Create a download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;

        // Trigger the download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log(`SVG file has been saved as "${fileName}".`);
    }
    
    function createSudokuSVG(string) {
        const SVG_NS = "http://www.w3.org/2000/svg";
        const size = 450;
        const cellSize = size / 9;

        // Create main SVG container
        const svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("width", size);
        svg.setAttribute("height", size);
        svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
        svg.setAttribute("xmlns", SVG_NS);

        // Add custom styles
        const style = document.createElementNS(SVG_NS, "style");
        style.textContent =
            `.custom-font {
                font-family: 'Roboto Mono', monospace;
                font-size: 42px;
                font-weight: normal;
                letter-spacing: 0px;
                line-height: 125%;
                word-spacing: 0px;
        }`;
        svg.appendChild(style);

        // Draw the grid lines
        for (let i = 0; i <= 9; i++) {
            const isThick = i % 3 === 0;
            // Horizontal lines
            const lineH = document.createElementNS(SVG_NS, "line");
            lineH.setAttribute("x1", 0);
            lineH.setAttribute("y1", i * cellSize);
            lineH.setAttribute("x2", size);
            lineH.setAttribute("y2", i * cellSize);
            lineH.setAttribute("stroke", "black");
            lineH.setAttribute("stroke-width", isThick ? 2.5 : 1);
            svg.appendChild(lineH);

            // Vertical lines
            const lineV = document.createElementNS(SVG_NS, "line");
            lineV.setAttribute("x1", i * cellSize);
            lineV.setAttribute("y1", 0);
            lineV.setAttribute("x2", i * cellSize);
            lineV.setAttribute("y2", size);
            lineV.setAttribute("stroke", "black");
            lineV.setAttribute("stroke-width", isThick ? 2.5 : 1);
            svg.appendChild(lineV);
        }

        // Add the numbers
        for (let i = 0; i < 81; i++) {
            const cellValue = string[i];
            if (cellValue !== '0' && cellValue !== '.') {
                const row = Math.floor(i / 9);
                const col = i % 9;
                const text = document.createElementNS(SVG_NS, "text");
                text.setAttribute("x", col * cellSize + cellSize / 2);
                text.setAttribute("y", row * cellSize + cellSize / 2);
                text.setAttribute("dominant-baseline", "middle");
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("fill", "black");
                text.textContent = cellValue;
                text.classList.add("custom-font");
                svg.appendChild(text);
            }
        }

        // Serialize the SVG element to a string
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svg);

        // Add XML declaration for proper file format
        svgString = '<?xml version="1.0" standalone="no"?>\n' + svgString;
        return svgString;
    }
    
    function getUniqueFileName() {
        let count = localStorage.getItem('sudokuSolutionCount') || 0;
        count = parseInt(count) + 1;
        localStorage.setItem('sudokuSolutionCount', count);
        return `solution${count}.svg`;       
    }

    function getUniqueFileName2() {
        let count2 = localStorage.getItem('sudokuCount') || 0;
        count2 = parseInt(count2) + 1;
        localStorage.setItem('sudokuCount', count2);
        return `soduku${count2}.svg`;
    }

    const solutionSvg = createSudokuSVG(cleanRaw1);
    const puzzleSvg = createSudokuSVG(cleanRaw2);
    saveSvgFile(solutionSvg, getUniqueFileName());
    saveSvgFile(puzzleSvg, getUniqueFileName2());
    
}

const timesToRun = 1;
for (let i = 0; i < timesToRun; i++) {
    createSudokus();
}




