/**
 * Game Module - Logika gry 4 in a Row
 *
 * Moduł odpowiada za:
 * - Zarządzanie stanem gry
 * - Sprawdzanie warunków wygranej
 * - Obsługę ruchów graczy
 */

const Game = (function() {
    // Stałe gry
    const BOARD_SIZE = 6;
    const WIN_COUNT = 4;

    // Stan gry
    let board = [];
    let currentPlayer = 1;
    let gameOver = false;
    let players = {
        1: { name: 'Gracz 1', color: '#3498db' },
        2: { name: 'Gracz 2', color: '#27ae60' }
    };
    let winningCells = [];

    /**
     * Inicjalizuje nową grę
     * @param {Object} player1 - Dane gracza 1
     * @param {Object} player2 - Dane gracza 2
     * @param {number} startingPlayer - Opcjonalnie: który gracz zaczyna (1 lub 2)
     */
    function init(player1, player2, startingPlayer) {
        board = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            board[row] = [];
            for (let col = 0; col < BOARD_SIZE; col++) {
                board[row][col] = 0; // 0 = puste, 1 = gracz 1, 2 = gracz 2
            }
        }

        players[1] = player1;
        players[2] = player2;
        // Losowy wybór gracza startowego jeśli nie podano
        currentPlayer = startingPlayer || (Math.random() < 0.5 ? 1 : 2);
        gameOver = false;
        winningCells = [];
    }

    /**
     * Wykonuje ruch gracza
     * @param {number} row - Wiersz (0-5)
     * @param {number} col - Kolumna (0-5)
     * @returns {Object} Wynik ruchu
     */
    function makeMove(row, col) {
        // Sprawdź czy gra się skończyła
        if (gameOver) {
            return { success: false, reason: 'game_over' };
        }

        // Sprawdź czy pole jest wolne
        if (board[row][col] !== 0) {
            return { success: false, reason: 'cell_taken' };
        }

        // Wykonaj ruch
        board[row][col] = currentPlayer;

        // Sprawdź wygraną
        const win = checkWin(row, col);
        if (win) {
            gameOver = true;
            winningCells = win;
            return {
                success: true,
                winner: currentPlayer,
                winningCells: win,
                playerName: players[currentPlayer].name,
                playerColor: players[currentPlayer].color
            };
        }

        // Sprawdź remis
        if (isBoardFull()) {
            gameOver = true;
            return {
                success: true,
                draw: true
            };
        }

        // Zmień gracza
        const previousPlayer = currentPlayer;
        currentPlayer = currentPlayer === 1 ? 2 : 1;

        return {
            success: true,
            nextPlayer: currentPlayer,
            placedBy: previousPlayer
        };
    }

    /**
     * Sprawdza czy gracz wygrał po wykonaniu ruchu
     * @param {number} row - Wiersz ostatniego ruchu
     * @param {number} col - Kolumna ostatniego ruchu
     * @returns {Array|null} Tablica wygrywających komórek lub null
     */
    function checkWin(row, col) {
        const player = board[row][col];
        const directions = [
            { dr: 0, dc: 1 },   // Poziomo
            { dr: 1, dc: 0 },   // Pionowo
            { dr: 1, dc: 1 },   // Ukośnie \
            { dr: 1, dc: -1 }   // Ukośnie /
        ];

        for (const { dr, dc } of directions) {
            const cells = getLine(row, col, dr, dc, player);
            if (cells.length >= WIN_COUNT) {
                return cells.slice(0, WIN_COUNT);
            }
        }

        return null;
    }

    /**
     * Pobiera linię pionków w danym kierunku
     * @param {number} row - Wiersz startowy
     * @param {number} col - Kolumna startowa
     * @param {number} dr - Kierunek wiersza (-1, 0, 1)
     * @param {number} dc - Kierunek kolumny (-1, 0, 1)
     * @param {number} player - Numer gracza
     * @returns {Array} Tablica komórek w linii
     */
    function getLine(row, col, dr, dc, player) {
        const cells = [];

        // Szukaj w kierunku ujemnym
        let r = row - dr;
        let c = col - dc;
        const backCells = [];
        while (isValidCell(r, c) && board[r][c] === player) {
            backCells.unshift({ row: r, col: c });
            r -= dr;
            c -= dc;
        }

        // Dodaj komórki z kierunku ujemnego
        cells.push(...backCells);

        // Dodaj aktualną komórkę
        cells.push({ row, col });

        // Szukaj w kierunku dodatnim
        r = row + dr;
        c = col + dc;
        while (isValidCell(r, c) && board[r][c] === player) {
            cells.push({ row: r, col: c });
            r += dr;
            c += dc;
        }

        return cells;
    }

    /**
     * Sprawdza czy komórka jest w granicach planszy
     * @param {number} row - Wiersz
     * @param {number} col - Kolumna
     * @returns {boolean}
     */
    function isValidCell(row, col) {
        return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
    }

    /**
     * Sprawdza czy plansza jest pełna
     * @returns {boolean}
     */
    function isBoardFull() {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (board[row][col] === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Pobiera aktualny stan gry
     * @returns {Object} Stan gry
     */
    function getState() {
        return {
            board: board.map(row => [...row]),
            currentPlayer,
            gameOver,
            players,
            winningCells
        };
    }

    /**
     * Pobiera aktualnego gracza
     * @returns {Object} Dane aktualnego gracza
     */
    function getCurrentPlayer() {
        return {
            number: currentPlayer,
            ...players[currentPlayer]
        };
    }

    /**
     * Pobiera rozmiar planszy
     * @returns {number}
     */
    function getBoardSize() {
        return BOARD_SIZE;
    }

    /**
     * Sprawdza czy gra jest zakończona
     * @returns {boolean}
     */
    function isGameOver() {
        return gameOver;
    }

    // Publiczne API modułu
    return {
        init,
        makeMove,
        getState,
        getCurrentPlayer,
        getBoardSize,
        isGameOver
    };
})();
