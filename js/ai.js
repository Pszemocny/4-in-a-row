/**
 * AI Module - Podpowiadanie najlepszego ruchu
 *
 * Implementacja algorytmu Minimax z Alpha-Beta Pruning
 * Bazowane na: https://roboticsproject.readthedocs.io/en/latest/ConnectFourAlgorithm.html
 *
 * Algorytm przeszukuje drzewo gry do określonej głębokości,
 * oceniając pozycje za pomocą funkcji heurystycznej.
 */

const AI = (function() {
    // Konfiguracja
    const SEARCH_DEPTH = 4; // Głębokość przeszukiwania (4-5 dla płynności)
    const WIN_SCORE = 100000;
    const BOARD_SIZE = 6;
    const WIN_COUNT = 4;

    // Wagi dla heurystyki
    const SCORES = {
        FOUR: WIN_SCORE,      // 4 w linii = wygrana
        THREE: 100,           // 3 w linii z wolnym miejscem
        TWO: 10,              // 2 w linii z wolnymi miejscami
        CENTER_BONUS: 3       // Bonus za pozycje centralne
    };

    /**
     * Znajduje najlepszy ruch dla aktualnego gracza
     * @param {Array} board - Aktualna plansza (2D array)
     * @param {number} player - Numer gracza (1 lub 2)
     * @returns {Object|null} Najlepszy ruch {row, col, score} lub null
     */
    function findBestMove(board, player) {
        const moves = getAvailableMoves(board);

        if (moves.length === 0) {
            return null;
        }

        let bestMove = null;
        let bestScore = -Infinity;

        // Sortuj ruchy - preferuj środkowe pozycje (lepsza kolejność dla alpha-beta)
        moves.sort((a, b) => {
            const centerA = Math.abs(a.row - 2.5) + Math.abs(a.col - 2.5);
            const centerB = Math.abs(b.row - 2.5) + Math.abs(b.col - 2.5);
            return centerA - centerB;
        });

        for (const move of moves) {
            // Wykonaj ruch
            const newBoard = copyBoard(board);
            newBoard[move.row][move.col] = player;

            // Oceń ruch algorytmem minimax
            const score = minimax(
                newBoard,
                SEARCH_DEPTH - 1,
                -Infinity,
                Infinity,
                false,
                player,
                getOpponent(player)
            );

            if (score > bestScore) {
                bestScore = score;
                bestMove = { row: move.row, col: move.col, score };
            }
        }

        return bestMove;
    }

    /**
     * Algorytm Minimax z Alpha-Beta Pruning
     * @param {Array} board - Plansza
     * @param {number} depth - Pozostała głębokość
     * @param {number} alpha - Wartość alpha (najlepsza dla maksymalizującego)
     * @param {number} beta - Wartość beta (najlepsza dla minimalizującego)
     * @param {boolean} isMaximizing - Czy to tura maksymalizującego gracza
     * @param {number} maximizingPlayer - Gracz maksymalizujący
     * @param {number} minimizingPlayer - Gracz minimalizujący
     * @returns {number} Ocena pozycji
     */
    function minimax(board, depth, alpha, beta, isMaximizing, maximizingPlayer, minimizingPlayer) {
        // Sprawdź stan terminalny
        const winner = checkWinner(board);
        if (winner === maximizingPlayer) {
            return WIN_SCORE + depth; // Preferuj szybszą wygraną
        }
        if (winner === minimizingPlayer) {
            return -WIN_SCORE - depth; // Unikaj szybszej przegranej
        }
        if (isBoardFull(board)) {
            return 0; // Remis
        }
        if (depth === 0) {
            return evaluateBoard(board, maximizingPlayer);
        }

        const moves = getAvailableMoves(board);

        if (isMaximizing) {
            let maxEval = -Infinity;

            for (const move of moves) {
                const newBoard = copyBoard(board);
                newBoard[move.row][move.col] = maximizingPlayer;

                const evalScore = minimax(
                    newBoard,
                    depth - 1,
                    alpha,
                    beta,
                    false,
                    maximizingPlayer,
                    minimizingPlayer
                );

                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);

                // Alpha-Beta Pruning
                if (beta <= alpha) {
                    break;
                }
            }

            return maxEval;
        } else {
            let minEval = Infinity;

            for (const move of moves) {
                const newBoard = copyBoard(board);
                newBoard[move.row][move.col] = minimizingPlayer;

                const evalScore = minimax(
                    newBoard,
                    depth - 1,
                    alpha,
                    beta,
                    true,
                    maximizingPlayer,
                    minimizingPlayer
                );

                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);

                // Alpha-Beta Pruning
                if (beta <= alpha) {
                    break;
                }
            }

            return minEval;
        }
    }

    /**
     * Funkcja heurystyczna - ocenia pozycję na planszy
     * @param {Array} board - Plansza
     * @param {number} player - Gracz dla którego oceniamy
     * @returns {number} Ocena pozycji
     */
    function evaluateBoard(board, player) {
        let score = 0;
        const opponent = getOpponent(player);

        // Sprawdź wszystkie możliwe "okna" 4-polowe
        // Poziomo
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col <= BOARD_SIZE - WIN_COUNT; col++) {
                const window = [];
                for (let i = 0; i < WIN_COUNT; i++) {
                    window.push(board[row][col + i]);
                }
                score += evaluateWindow(window, player, opponent);
            }
        }

        // Pionowo
        for (let col = 0; col < BOARD_SIZE; col++) {
            for (let row = 0; row <= BOARD_SIZE - WIN_COUNT; row++) {
                const window = [];
                for (let i = 0; i < WIN_COUNT; i++) {
                    window.push(board[row + i][col]);
                }
                score += evaluateWindow(window, player, opponent);
            }
        }

        // Ukośnie (\ )
        for (let row = 0; row <= BOARD_SIZE - WIN_COUNT; row++) {
            for (let col = 0; col <= BOARD_SIZE - WIN_COUNT; col++) {
                const window = [];
                for (let i = 0; i < WIN_COUNT; i++) {
                    window.push(board[row + i][col + i]);
                }
                score += evaluateWindow(window, player, opponent);
            }
        }

        // Ukośnie (/)
        for (let row = 0; row <= BOARD_SIZE - WIN_COUNT; row++) {
            for (let col = WIN_COUNT - 1; col < BOARD_SIZE; col++) {
                const window = [];
                for (let i = 0; i < WIN_COUNT; i++) {
                    window.push(board[row + i][col - i]);
                }
                score += evaluateWindow(window, player, opponent);
            }
        }

        // Bonus za pozycje centralne
        const centerCols = [2, 3];
        const centerRows = [2, 3];
        for (const row of centerRows) {
            for (const col of centerCols) {
                if (board[row][col] === player) {
                    score += SCORES.CENTER_BONUS;
                }
            }
        }

        return score;
    }

    /**
     * Ocenia "okno" 4 pól
     * @param {Array} window - 4 pola do oceny
     * @param {number} player - Gracz
     * @param {number} opponent - Przeciwnik
     * @returns {number} Ocena okna
     */
    function evaluateWindow(window, player, opponent) {
        let score = 0;

        const playerCount = window.filter(cell => cell === player).length;
        const opponentCount = window.filter(cell => cell === opponent).length;
        const emptyCount = window.filter(cell => cell === 0).length;

        // Ocena dla gracza
        if (playerCount === 4) {
            score += SCORES.FOUR;
        } else if (playerCount === 3 && emptyCount === 1) {
            score += SCORES.THREE;
        } else if (playerCount === 2 && emptyCount === 2) {
            score += SCORES.TWO;
        }

        // Ocena dla przeciwnika (blokowanie)
        if (opponentCount === 3 && emptyCount === 1) {
            score -= SCORES.THREE * 1.5; // Wysoki priorytet blokowania
        } else if (opponentCount === 2 && emptyCount === 2) {
            score -= SCORES.TWO;
        }

        return score;
    }

    /**
     * Sprawdza czy jest zwycięzca
     * @param {Array} board - Plansza
     * @returns {number|null} Numer zwycięzcy lub null
     */
    function checkWinner(board) {
        // Sprawdź wszystkie kierunki
        const directions = [
            { dr: 0, dc: 1 },   // Poziomo
            { dr: 1, dc: 0 },   // Pionowo
            { dr: 1, dc: 1 },   // Ukośnie \
            { dr: 1, dc: -1 }   // Ukośnie /
        ];

        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const player = board[row][col];
                if (player === 0) continue;

                for (const { dr, dc } of directions) {
                    let count = 1;
                    let r = row + dr;
                    let c = col + dc;

                    while (
                        r >= 0 && r < BOARD_SIZE &&
                        c >= 0 && c < BOARD_SIZE &&
                        board[r][c] === player
                    ) {
                        count++;
                        r += dr;
                        c += dc;
                    }

                    if (count >= WIN_COUNT) {
                        return player;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Pobiera dostępne ruchy
     * @param {Array} board - Plansza
     * @returns {Array} Lista dostępnych ruchów
     */
    function getAvailableMoves(board) {
        const moves = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (board[row][col] === 0) {
                    moves.push({ row, col });
                }
            }
        }
        return moves;
    }

    /**
     * Kopiuje planszę
     * @param {Array} board - Plansza
     * @returns {Array} Kopia planszy
     */
    function copyBoard(board) {
        return board.map(row => [...row]);
    }

    /**
     * Pobiera numer przeciwnika
     * @param {number} player - Gracz
     * @returns {number} Przeciwnik
     */
    function getOpponent(player) {
        return player === 1 ? 2 : 1;
    }

    /**
     * Sprawdza czy plansza jest pełna
     * @param {Array} board - Plansza
     * @returns {boolean}
     */
    function isBoardFull(board) {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (board[row][col] === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    // Publiczne API
    return {
        findBestMove,
        evaluateBoard
    };
})();
