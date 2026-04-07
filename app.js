// ============================================================================
// STATE MANAGEMENT
// ============================================================================

let currentGrid = Array(9).fill().map(() => Array(9).fill(0));
let givenNumbers = Array(9).fill().map(() => Array(9).fill(false));
let solutionGrid = Array(9).fill().map(() => Array(9).fill(0));
let verificationMode = false;
let history = [];
let historyIndex = -1;
let selectedCell = null;

// Auto-save every 30 seconds
let autoSaveInterval = setInterval(autoSave, 30000);

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    createInputGrid();
    createSolutionGrid();
    saveState();
    setupCameraInput();
    checkAutoSave();
    showWelcomeMessage();
}

function setupCameraInput() {
    document.getElementById('cameraInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = document.createElement('img');
                img.src = event.target.result;
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = '<h4>📸 Your Photo:</h4>';
                preview.appendChild(img);
                showVerificationMode();
            };
            reader.readAsDataURL(file);
        }
    });
}

function checkAutoSave() {
    const autoSaved = localStorage.getItem('sudoku_autosave');
    if (autoSaved) {
        const puzzleData = JSON.parse(autoSaved);
        const saveDate = new Date(puzzleData.timestamp);
        if (confirm(`Auto-saved puzzle found from ${saveDate.toLocaleDateString()} at ${saveDate.toLocaleTimeString()}. Load it?`)) {
            currentGrid = puzzleData.grid;
            givenNumbers = puzzleData.given;
            saveState();
            createInputGrid();
        }
    }
}

function showWelcomeMessage() {
    document.getElementById('status-container').innerHTML = `
        <div class="status-section status-info">
            <h3>👋 Welcome!</h3>
            <p>Take a photo or tap cells to enter numbers. Auto-saves every 30 seconds!</p>
        </div>
    `;
}

// ============================================================================
// PHOTO/VERIFICATION MODE
// ============================================================================

function showVerificationMode() {
    verificationMode = true;
    
    // Simulated OCR extraction - replace with actual OCR implementation
    const extractedGrid = [
        [2,3,6,9,1,7,8,4,5],
        [8,1,0,2,5,4,0,9,6],
        [4,5,0,8,3,6,0,0,2],
        [5,8,2,6,7,3,9,1,4],
        [7,6,1,4,9,2,5,3,8],
        [9,4,3,1,8,5,2,6,7],
        [1,6,0,0,0,0,8,7,0],
        [0,0,3,0,0,5,0,4,2],
        [8,0,0,0,0,0,0,0,7]
    ];
    
    const extractedGiven = [
        [true,true,true,false,false,true,false,true,true],
        [false,false,false,true,true,true,false,true,true],
        [true,true,false,true,true,true,false,false,true],
        [true,true,true,false,false,true,true,true,true],
        [false,true,true,true,true,true,true,true,false],
        [true,true,true,true,true,true,true,true,true],
        [true,false,false,false,false,false,true,true,false],
        [false,false,true,false,false,true,false,false,true],
        [true,false,false,false,false,false,false,false,true]
    ];
    
    currentGrid = extractedGrid;
    givenNumbers = extractedGiven;
    saveState();
    createInputGrid();
    
    document.getElementById('status-container').innerHTML = `
        <div class="verification-grid">
            <h3>✏️ Verify Extracted Numbers</h3>
            <p>We've extracted the numbers from your photo. Please verify they're correct.</p>
            <p><strong>Tip:</strong> Tap any cell to edit using the number picker.</p>
        </div>
    `;
}

// ============================================================================
// GRID CREATION
// ============================================================================

function createInputGrid() {
    const container = document.getElementById('input-grid');
    container.innerHTML = '';
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = createCell(row, col, true);
            container.appendChild(cell);
        }
    }
}

function createSolutionGrid() {
    const container = document.getElementById('solution-grid');
    container.innerHTML = '';
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = createCell(row, col, false);
            container.appendChild(cell);
        }
    }
}

function createCell(row, col, isInput) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    
    // Add thick borders for 3x3 box separation
    if (col === 2 || col === 5) cell.classList.add('thick-right');
    if (row === 2 || row === 5) cell.classList.add('thick-bottom');
    
    const input = document.createElement('input');
    input.type = 'text';
    input.readOnly = true;
    
    if (isInput) {
        input.value = currentGrid[row][col] === 0 ? '' : currentGrid[row][col];
        
        // Click handler for input grid
        cell.addEventListener('click', function() {
            if (!givenNumbers[row][col]) {
                showNumberPicker(row, col);
            }
        });
        
        // Apply cell styling
        if (givenNumbers[row][col]) {
            cell.classList.add('given');
        } else if (currentGrid[row][col] !== 0) {
            cell.classList.add('user-entry');
        }
        
        if (verificationMode && currentGrid[row][col] !== 0) {
            cell.classList.add('needs-verification');
        }
    } else {
        // Solution grid
        input.value = solutionGrid[row][col] === 0 ? '' : solutionGrid[row][col];
        
        if (givenNumbers[row][col]) {
            cell.classList.add('given');
        } else if (solutionGrid[row][col] !== 0) {
            cell.classList.add('solved');
        }
    }
    
    cell.appendChild(input);
    return cell;
}

// ============================================================================
// NUMBER PICKER
// ============================================================================

function showNumberPicker(row, col) {
    selectedCell = {row, col};
    document.getElementById('overlay').classList.add('active');
    document.getElementById('numberPicker').classList.add('active');
}

function closeNumberPicker() {
    selectedCell = null;
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('numberPicker').classList.remove('active');
}

function selectNumber(num) {
    if (selectedCell) {
        const {row, col} = selectedCell;
        
        // Save state for undo
        saveState();
        
        currentGrid[row][col] = num;
        
        if (num !== 0 && document.getElementById('givenMode').checked) {
            givenNumbers[row][col] = true;
        } else if (num === 0) {
            givenNumbers[row][col] = false;
        }
        
        updateSolutionDisplay();
        createInputGrid();
        closeNumberPicker();
        updateUndoRedoButtons();
    }
}

// ============================================================================
// UNDO/REDO FUNCTIONALITY
// ============================================================================

function saveState() {
    // Remove any future states when making new changes
    history = history.slice(0, historyIndex + 1);
    
    // Save current state
    history.push({
        grid: currentGrid.map(row => [...row]),
        given: givenNumbers.map(row => [...row])
    });
    
    historyIndex++;
    
    // Limit history to 50 states to prevent memory issues
    if (history.length > 50) {
        history.shift();
        historyIndex--;
    }
    
    updateUndoRedoButtons();
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        const state = history[historyIndex];
        currentGrid = state.grid.map(row => [...row]);
        givenNumbers = state.given.map(row => [...row]);
        createInputGrid();
        updateSolutionDisplay();
        updateUndoRedoButtons();
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        const state = history[historyIndex];
        currentGrid = state.grid.map(row => [...row]);
        givenNumbers = state.given.map(row => [...row]);
        createInputGrid();
        updateSolutionDisplay();
        updateUndoRedoButtons();
    }
}

function updateUndoRedoButtons() {
    document.getElementById('undoBtn').disabled = historyIndex <= 0;
    document.getElementById('redoBtn').disabled = historyIndex >= history.length - 1;
}

// ============================================================================
// HINT SYSTEM
// ============================================================================

function showHint() {
    // Clear previous hints
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => cell.classList.remove('hint'));
    
    // Find a cell where only one number is possible
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (currentGrid[row][col] === 0) {
                const possible = getPossibleNumbers(row, col);
                
                if (possible.length === 1) {
                    // Highlight this cell
                    const cellIndex = row * 9 + col;
                    const cellElement = document.querySelectorAll('#input-grid .cell')[cellIndex];
                    cellElement.classList.add('hint');
                    
                    document.getElementById('status-container').innerHTML = `
                        <div class="status-section status-info">
                            <h3>💡 Hint</h3>
                            <p>Row ${row + 1}, Column ${col + 1} can only be <strong>${possible[0]}</strong></p>
                            <p>This is the only number that fits based on the current state!</p>
                        </div>
                    `;
                    return;
                }
            }
        }
    }
    
    // No single-candidate cells found
    document.getElementById('status-container').innerHTML = `
        <div class="status-section status-info">
            <h3>💡 No Simple Hints Available</h3>
            <p>No cells with only one possible number found. Try more advanced solving techniques or use the Solve button!</p>
        </div>
    `;
}

function getPossibleNumbers(row, col) {
    const possible = [];
    for (let num = 1; num <= 9; num++) {
        if (isValidMove(currentGrid, row, col, num)) {
            possible.push(num);
        }
    }
    return possible;
}

// ============================================================================
// SAVE/LOAD FUNCTIONALITY
// ============================================================================

function savePuzzle() {
    const puzzleData = {
        grid: currentGrid,
        given: givenNumbers,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('sudoku_save', JSON.stringify(puzzleData));
    
    document.getElementById('status-container').innerHTML = `
        <div class="status-section status-success">
            <h3>💾 Puzzle Saved!</h3>
            <p>Your progress has been saved successfully.</p>
        </div>
    `;
}

function loadPuzzle() {
    const savedData = localStorage.getItem('sudoku_save');
    
    if (savedData) {
        const puzzleData = JSON.parse(savedData);
        currentGrid = puzzleData.grid;
        givenNumbers = puzzleData.given;
        
        saveState();
        createInputGrid();
        updateSolutionDisplay();
        
        const saveDate = new Date(puzzleData.timestamp);
        document.getElementById('status-container').innerHTML = `
            <div class="status-section status-success">
                <h3>📂 Puzzle Loaded!</h3>
                <p>Loaded puzzle saved on ${saveDate.toLocaleDateString()} at ${saveDate.toLocaleTimeString()}</p>
            </div>
        `;
    } else {
        document.getElementById('status-container').innerHTML = `
            <div class="status-section status-error">
                <h3>📂 No Saved Puzzle</h3>
                <p>No saved puzzle found. Save your current puzzle first!</p>
            </div>
        `;
    }
}

function autoSave() {
    const hasContent = currentGrid.flat().some(cell => cell !== 0);
    if (hasContent) {
        const puzzleData = {
            grid: currentGrid,
            given: givenNumbers,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('sudoku_autosave', JSON.stringify(puzzleData));
    }
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateGrid(grid) {
    const errors = [];
    
    // Check rows
    for (let row = 0; row < 9; row++) {
        const seen = new Set();
        for (let col = 0; col < 9; col++) {
            const val = grid[row][col];
            if (val !== 0) {
                if (seen.has(val)) {
                    errors.push(`Row ${row + 1} has duplicate ${val}`);
                }
                seen.add(val);
            }
        }
    }
    
    // Check columns
    for (let col = 0; col < 9; col++) {
        const seen = new Set();
        for (let row = 0; row < 9; row++) {
            const val = grid[row][col];
            if (val !== 0) {
                if (seen.has(val)) {
                    errors.push(`Column ${col + 1} has duplicate ${val}`);
                }
                seen.add(val);
            }
        }
    }
    
    // Check 3x3 boxes
    for (let boxRow = 0; boxRow < 3; boxRow++) {
        for (let boxCol = 0; boxCol < 3; boxCol++) {
            const seen = new Set();
            for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
                for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
                    const val = grid[row][col];
                    if (val !== 0) {
                        if (seen.has(val)) {
                            errors.push(`Box (${boxRow + 1},${boxCol + 1}) has duplicate ${val}`);
                        }
                        seen.add(val);
                    }
                }
            }
        }
    }
    
    return errors;
}

function isValidMove(grid, row, col, num) {
    // Check row
    for (let c = 0; c < 9; c++) {
        if (c !== col && grid[row][c] === num) return false;
    }
    
    // Check column
    for (let r = 0; r < 9; r++) {
        if (r !== row && grid[r][col] === num) return false;
    }
    
    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
            if ((r !== row || c !== col) && grid[r][c] === num) return false;
        }
    }
    
    return true;
}

function checkValidity() {
    verificationMode = false;
    const errors = validateGrid(currentGrid);
    
    // Clear previous error/verification highlighting
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('needs-verification');
        cell.classList.remove('error');
    });
    
    if (errors.length > 0) {
        document.getElementById('status-container').innerHTML = `
            <div class="status-section status-error">
                <h3>❌ Rule Violations Found</h3>
                <ul class="error-list">
                    ${errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
                <p><strong>Total violations: ${errors.length}</strong></p>
            </div>
        `;
        
        highlightErrors();
    } else {
        const filledCells = currentGrid.flat().filter(cell => cell !== 0).length;
        if (filledCells === 81) {
            document.getElementById('status-container').innerHTML = `
                <div class="status-section status-success">
                    <h3>🎉 Puzzle Solved Correctly!</h3>
                    <p>Congratulations! You've completed the Sudoku puzzle with no rule violations.</p>
                </div>
            `;
        } else {
            document.getElementById('status-container').innerHTML = `
                <div class="status-section status-info">
                    <h3>✅ No Rule Violations</h3>
                    <p>Your current entries are valid. You have ${81 - filledCells} cells remaining to fill.</p>
                </div>
            `;
        }
    }
    
    createInputGrid();
}

function highlightErrors() {
    const inputs = document.querySelectorAll('#input-grid .cell');
    
    inputs.forEach((cell, index) => {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const val = currentGrid[row][col];
        
        if (val !== 0) {
            const tempGrid = currentGrid.map(r => [...r]);
            tempGrid[row][col] = 0;
            
            if (!isValidMove(tempGrid, row, col, val)) {
                cell.classList.add('error');
            }
        }
    });
}

// ============================================================================
// SUDOKU SOLVER
// ============================================================================

function solveSudoku(grid) {
    const solution = grid.map(row => [...row]);
    
    function solve() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (solution[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (isValidMove(solution, row, col, num)) {
                            solution[row][col] = num;
                            if (solve()) {
                                return true;
                            }
                            solution[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }
    
    if (solve()) {
        return solution;
    }
    return null;
}

function solvePuzzle() {
    verificationMode = false;
    const solution = solveSudoku(currentGrid);
    
    if (solution) {
        solutionGrid = solution;
        createSolutionGrid();
        
        document.getElementById('status-container').innerHTML = `
            <div class="status-section status-success">
                <h3>🎯 Puzzle Solved!</h3>
                <p>The complete solution is shown on the right. Blue cells are your given numbers, green cells show the solution.</p>
            </div>
        `;
    } else {
        document.getElementById('status-container').innerHTML = `
            <div class="status-section status-error">
                <h3>❌ Cannot Solve</h3>
                <p>This puzzle cannot be solved with the current entries. Please check for errors and try again.</p>
            </div>
        `;
    }
    
    createInputGrid();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function clearAll() {
    if (confirm('Are you sure you want to clear the entire puzzle?')) {
        currentGrid = Array(9).fill().map(() => Array(9).fill(0));
        givenNumbers = Array(9).fill().map(() => Array(9).fill(false));
        solutionGrid = Array(9).fill().map(() => Array(9).fill(0));
        verificationMode = false;
        history = [];
        historyIndex = -1;
        
        saveState();
        createInputGrid();
        createSolutionGrid();
        updateUndoRedoButtons();
        
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('cameraInput').value = '';
        
        document.getElementById('status-container').innerHTML = `
            <div class="status-section status-info">
                <h3>🆕 Grid Cleared</h3>
                <p>Take a photo or tap cells to enter your puzzle numbers manually.</p>
            </div>
        `;
    }
}

function updateSolutionDisplay() {
    solutionGrid = Array(9).fill().map(() => Array(9).fill(0));
    createSolutionGrid();
}