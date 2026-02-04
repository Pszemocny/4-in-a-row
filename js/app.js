/**
 * App Module - Główna logika aplikacji
 *
 * Moduł odpowiada za:
 * - Zarządzanie interfejsem użytkownika
 * - Obsługę zdarzeń
 * - Koordynację między modułami
 */

(function() {
    // Elementy DOM
    const elements = {
        // Ekrany
        menuScreen: document.getElementById('menu-screen'),
        gameScreen: document.getElementById('game-screen'),
        historyScreen: document.getElementById('history-screen'),

        // Inputy graczy
        player1Name: document.getElementById('player1-name'),
        player1Color: document.getElementById('player1-color'),
        player2Name: document.getElementById('player2-name'),
        player2Color: document.getElementById('player2-color'),

        // Przyciski menu
        startGameBtn: document.getElementById('start-game-btn'),
        showHistoryBtn: document.getElementById('show-history-btn'),
        resetProgressBtn: document.getElementById('reset-progress-btn'),

        // Elementy gry
        gameBoard: document.getElementById('game-board'),
        player1Token: document.getElementById('player1-token'),
        player1NameDisplay: document.getElementById('player1-name-display'),
        player1Score: document.getElementById('player1-score'),
        player2Token: document.getElementById('player2-token'),
        player2NameDisplay: document.getElementById('player2-name-display'),
        player2Score: document.getElementById('player2-score'),
        currentTurnName: document.getElementById('current-turn-name'),
        currentTurnToken: document.getElementById('current-turn-token'),
        gameMessage: document.getElementById('game-message'),
        boardOverlay: document.getElementById('board-overlay'),
        overlayMessage: document.getElementById('overlay-message'),
        hintBtn: document.getElementById('hint-btn'),
        newRoundBtn: document.getElementById('new-round-btn'),
        backToMenuBtn: document.getElementById('back-to-menu-btn'),
        gameHistoryList: document.getElementById('game-history-list'),

        // Historia
        historyList: document.getElementById('history-list'),
        backFromHistoryBtn: document.getElementById('back-from-history-btn'),

        // Modal
        resetModal: document.getElementById('reset-modal'),
        confirmResetBtn: document.getElementById('confirm-reset-btn'),
        cancelResetBtn: document.getElementById('cancel-reset-btn')
    };

    // Stan aplikacji
    let currentScore = { player1: 0, player2: 0 };
    let currentPlayers = null;
    let suggestedMove = null;
    let hintsEnabled = false;
    let isCalculatingHint = false;
    let sessionHistory = []; // Historia rund w bieżącej sesji
    let lastStartingPlayer = 0; // Kto zaczął ostatnią rundę (0 = nikt jeszcze)

    /**
     * Inicjalizacja aplikacji
     */
    function init() {
        loadSavedSettings();
        bindEvents();
        showScreen('menu');
    }

    /**
     * Ładuje zapisane ustawienia
     */
    function loadSavedSettings() {
        const players = Storage.getPlayers();
        elements.player1Name.value = players.player1.name;
        elements.player1Color.value = players.player1.color;
        elements.player2Name.value = players.player2.name;
        elements.player2Color.value = players.player2.color;

        currentScore = Storage.getCurrentScore();
    }

    /**
     * Przypisuje zdarzenia do elementów
     */
    function bindEvents() {
        // Menu
        elements.startGameBtn.addEventListener('click', startGame);
        elements.showHistoryBtn.addEventListener('click', () => showScreen('history'));
        elements.resetProgressBtn.addEventListener('click', showResetModal);

        // Gra
        elements.hintBtn.addEventListener('click', toggleHints);
        elements.newRoundBtn.addEventListener('click', startNewRound);
        elements.backToMenuBtn.addEventListener('click', () => {
            Storage.resetCurrentScore();
            currentScore = { player1: 0, player2: 0 };
            hintsEnabled = false;
            showScreen('menu');
        });

        // Historia
        elements.backFromHistoryBtn.addEventListener('click', () => showScreen('menu'));

        // Modal
        elements.confirmResetBtn.addEventListener('click', confirmReset);
        elements.cancelResetBtn.addEventListener('click', hideResetModal);

        // Zamknij modal klikając poza nim
        elements.resetModal.addEventListener('click', (e) => {
            if (e.target === elements.resetModal) {
                hideResetModal();
            }
        });
    }

    /**
     * Pokazuje wybrany ekran
     * @param {string} screenName - Nazwa ekranu ('menu', 'game', 'history')
     */
    function showScreen(screenName) {
        // Ukryj wszystkie ekrany
        elements.menuScreen.classList.remove('active');
        elements.gameScreen.classList.remove('active');
        elements.historyScreen.classList.remove('active');

        // Pokaż wybrany ekran
        switch (screenName) {
            case 'menu':
                elements.menuScreen.classList.add('active');
                break;
            case 'game':
                elements.gameScreen.classList.add('active');
                break;
            case 'history':
                renderHistory();
                elements.historyScreen.classList.add('active');
                break;
        }
    }

    /**
     * Rozpoczyna nową grę
     */
    function startGame() {
        // Pobierz dane graczy
        const player1 = {
            name: elements.player1Name.value.trim() || 'Gracz 1',
            color: elements.player1Color.value
        };
        const player2 = {
            name: elements.player2Name.value.trim() || 'Gracz 2',
            color: elements.player2Color.value
        };

        // Zapisz ustawienia
        Storage.savePlayers({ player1, player2 });
        currentPlayers = { player1, player2 };

        // Zresetuj wynik jeśli zmienili się gracze
        const savedPlayers = Storage.getPlayers();
        if (savedPlayers.player1.name !== player1.name ||
            savedPlayers.player2.name !== player2.name) {
            currentScore = { player1: 0, player2: 0 };
        }

        // Pierwsza runda - losowy gracz startowy
        const firstStarter = Math.random() < 0.5 ? 1 : 2;
        Game.init(player1, player2, firstStarter);
        lastStartingPlayer = firstStarter;

        // Resetuj stan podpowiedzi i historię sesji
        hintsEnabled = false;
        suggestedMove = null;
        sessionHistory = [];
        updateHintButton();

        // Zaktualizuj UI
        updateGameUI();
        renderBoard();
        renderGameHistory();

        // Pokaż ekran gry
        showScreen('game');

        // Pokaż kto zaczyna
        const starter = Game.getCurrentPlayer();
        showStarterMessage(starter.name);
    }

    /**
     * Rozpoczyna nową rundę
     */
    function startNewRound() {
        // Naprzemienne rozpoczynanie - drugi gracz niż poprzednio
        const nextStarter = lastStartingPlayer === 1 ? 2 : 1;
        Game.init(currentPlayers.player1, currentPlayers.player2, nextStarter);
        lastStartingPlayer = nextStarter;
        suggestedMove = null;
        elements.hintBtn.style.display = 'inline-block';
        elements.newRoundBtn.style.display = 'none';
        elements.gameMessage.textContent = '';
        elements.gameMessage.className = 'game-message';
        updateTurnIndicator();
        renderBoard();

        // Pokaż kto zaczyna
        const starter = Game.getCurrentPlayer();
        showStarterMessage(starter.name);

        // Jeśli podpowiedzi są włączone, pokaż podpowiedź
        if (hintsEnabled) {
            calculateAndShowHint();
        }
    }

    /**
     * Pokazuje komunikat o graczu rozpoczynającym
     * @param {string} playerName - Nazwa gracza
     */
    function showStarterMessage(playerName) {
        elements.gameMessage.textContent = `${playerName} zaczyna!`;
        elements.gameMessage.className = 'game-message';
        // Ukryj komunikat po 2 sekundach
        setTimeout(() => {
            if (!Game.isGameOver()) {
                elements.gameMessage.textContent = '';
            }
        }, 2000);
    }

    /**
     * Aktualizuje interfejs gry
     */
    function updateGameUI() {
        const state = Game.getState();

        // Gracz 1
        elements.player1Token.style.backgroundColor = state.players[1].color;
        elements.player1NameDisplay.textContent = state.players[1].name;
        elements.player1Score.textContent = currentScore.player1;

        // Gracz 2
        elements.player2Token.style.backgroundColor = state.players[2].color;
        elements.player2NameDisplay.textContent = state.players[2].name;
        elements.player2Score.textContent = currentScore.player2;

        // Wskaźnik tury
        updateTurnIndicator();

        // Pokaż przycisk podpowiedzi, ukryj przycisk nowej rundy i komunikat
        elements.hintBtn.style.display = 'inline-block';
        elements.newRoundBtn.style.display = 'none';
        elements.gameMessage.textContent = '';
    }

    /**
     * Aktualizuje wskaźnik tury
     */
    function updateTurnIndicator() {
        const current = Game.getCurrentPlayer();
        elements.currentTurnName.textContent = current.name;
        elements.currentTurnToken.style.backgroundColor = current.color;
    }

    /**
     * Włącza/wyłącza tryb podpowiedzi
     */
    function toggleHints() {
        if (Game.isGameOver()) {
            return;
        }

        hintsEnabled = !hintsEnabled;
        updateHintButton();

        if (hintsEnabled) {
            // Włączono - oblicz i pokaż podpowiedź
            calculateAndShowHint();
        } else {
            // Wyłączono - ukryj podpowiedź
            suggestedMove = null;
            renderBoard();
        }
    }

    /**
     * Aktualizuje wygląd przycisku podpowiedzi
     */
    function updateHintButton() {
        if (hintsEnabled) {
            elements.hintBtn.textContent = 'Wyłącz podpowiedzi';
            elements.hintBtn.classList.add('active');
        } else {
            elements.hintBtn.textContent = 'Włącz podpowiedzi';
            elements.hintBtn.classList.remove('active');
        }
    }

    /**
     * Renderuje historię sesji w grze
     */
    function renderGameHistory() {
        if (sessionHistory.length === 0) {
            elements.gameHistoryList.innerHTML = '<div class="game-history-empty">Brak rozegranych rund</div>';
            return;
        }

        elements.gameHistoryList.innerHTML = sessionHistory.map((round, index) => {
            const isLatest = index === sessionHistory.length - 1;
            let winnerText, winnerClass;

            if (round.winner === 1) {
                winnerText = currentPlayers.player1.name;
                winnerClass = 'player1';
            } else if (round.winner === 2) {
                winnerText = currentPlayers.player2.name;
                winnerClass = 'player2';
            } else {
                winnerText = 'Remis';
                winnerClass = 'draw';
            }

            return `
                <div class="game-history-item ${isLatest ? 'latest' : ''}">
                    <span class="game-history-round">Runda ${index + 1}</span>
                    <span class="game-history-winner ${winnerClass}">${winnerText}</span>
                </div>
            `;
        }).join('');

        // Przewiń do ostatniego elementu
        elements.gameHistoryList.scrollTop = elements.gameHistoryList.scrollHeight;
    }

    /**
     * Dodaje wynik rundy do historii sesji
     * @param {number|null} winner - Numer zwycięzcy (1, 2) lub null (remis)
     */
    function addToSessionHistory(winner) {
        sessionHistory.push({
            winner,
            timestamp: Date.now()
        });
        renderGameHistory();
    }

    /**
     * Oblicza i pokazuje podpowiedź
     */
    function calculateAndShowHint() {
        if (Game.isGameOver() || isCalculatingHint || !hintsEnabled) {
            return;
        }

        isCalculatingHint = true;

        // Użyj setTimeout aby UI mogło się odświeżyć
        setTimeout(() => {
            const state = Game.getState();
            const currentPlayer = state.currentPlayer;

            // Znajdź najlepszy ruch za pomocą AI
            const bestMove = AI.findBestMove(state.board, currentPlayer);

            if (bestMove && hintsEnabled) {
                suggestedMove = { row: bestMove.row, col: bestMove.col };
                renderBoard();
            }

            isCalculatingHint = false;
        }, 50);
    }

    /**
     * Renderuje planszę
     */
    function renderBoard() {
        const size = Game.getBoardSize();
        const state = Game.getState();

        elements.gameBoard.innerHTML = '';

        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                // Ustaw kolor jeśli pole jest zajęte
                if (state.board[row][col] !== 0) {
                    const player = state.board[row][col];
                    cell.style.backgroundColor = state.players[player].color;
                    cell.classList.add('taken');
                }

                // Zaznacz wygrywające komórki
                if (state.winningCells.some(wc => wc.row === row && wc.col === col)) {
                    cell.classList.add('winning');
                    cell.style.color = state.players[state.board[row][col]].color;
                }

                // Podświetl sugerowany ruch
                if (suggestedMove && suggestedMove.row === row && suggestedMove.col === col) {
                    cell.classList.add('suggested');
                }

                // Dodaj event listener
                cell.addEventListener('click', () => handleCellClick(row, col));

                elements.gameBoard.appendChild(cell);
            }
        }
    }

    /**
     * Obsługuje kliknięcie w komórkę
     * @param {number} row - Wiersz
     * @param {number} col - Kolumna
     */
    function handleCellClick(row, col) {
        const result = Game.makeMove(row, col);

        if (!result.success) {
            return;
        }

        // Wyczyść podpowiedź po wykonaniu ruchu
        suggestedMove = null;

        // Aktualizuj planszę
        renderBoard();

        if (result.winner) {
            // Wygrana
            handleWin(result);
        } else if (result.draw) {
            // Remis
            handleDraw();
        } else {
            // Kontynuuj grę
            updateTurnIndicator();

            // Jeśli podpowiedzi są włączone, oblicz nową podpowiedź
            if (hintsEnabled) {
                calculateAndShowHint();
            }
        }
    }

    /**
     * Obsługuje wygraną
     * @param {Object} result - Wynik gry
     */
    function handleWin(result) {
        // Aktualizuj wynik
        if (result.winner === 1) {
            currentScore.player1++;
        } else {
            currentScore.player2++;
        }
        Storage.saveCurrentScore(currentScore);

        // Zapisz mecz do historii
        Storage.addMatch({
            player1Name: currentPlayers.player1.name,
            player2Name: currentPlayers.player2.name,
            player1Color: currentPlayers.player1.color,
            player2Color: currentPlayers.player2.color,
            winner: result.winner
        });

        // Aktualizuj UI
        elements.player1Score.textContent = currentScore.player1;
        elements.player2Score.textContent = currentScore.player2;

        elements.gameMessage.textContent = `${result.playerName} wygrywa!`;
        elements.gameMessage.className = 'game-message winner';

        elements.hintBtn.style.display = 'none';
        elements.newRoundBtn.style.display = 'inline-block';

        // Dodaj do historii sesji
        addToSessionHistory(result.winner);
    }

    /**
     * Obsługuje remis
     */
    function handleDraw() {
        // Zapisz mecz do historii
        Storage.addMatch({
            player1Name: currentPlayers.player1.name,
            player2Name: currentPlayers.player2.name,
            player1Color: currentPlayers.player1.color,
            player2Color: currentPlayers.player2.color,
            winner: null
        });

        elements.gameMessage.textContent = 'Remis!';
        elements.gameMessage.className = 'game-message draw';

        elements.hintBtn.style.display = 'none';
        elements.newRoundBtn.style.display = 'inline-block';

        // Dodaj do historii sesji
        addToSessionHistory(null);
    }

    /**
     * Renderuje historię meczów
     */
    function renderHistory() {
        const history = Storage.getHistory();

        if (history.length === 0) {
            elements.historyList.innerHTML = '<div class="history-empty">Brak zapisanych meczów</div>';
            return;
        }

        elements.historyList.innerHTML = history.map(match => {
            const date = new Date(match.date);
            const dateStr = date.toLocaleDateString('pl-PL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            let resultText, resultClass;
            if (match.winner === 1) {
                resultText = `${match.player1Name} wygrywa`;
                resultClass = 'winner-1';
            } else if (match.winner === 2) {
                resultText = `${match.player2Name} wygrywa`;
                resultClass = 'winner-2';
            } else {
                resultText = 'Remis';
                resultClass = 'draw';
            }

            return `
                <div class="history-item">
                    <div class="history-players">
                        <span style="color: ${match.player1Color}">${match.player1Name}</span>
                        <span class="history-vs">vs</span>
                        <span style="color: ${match.player2Color}">${match.player2Name}</span>
                    </div>
                    <div class="history-result ${resultClass}">${resultText}</div>
                    <div class="history-date">${dateStr}</div>
                </div>
            `;
        }).join('');
    }

    /**
     * Pokazuje modal potwierdzenia resetu
     */
    function showResetModal() {
        elements.resetModal.classList.add('active');
    }

    /**
     * Ukrywa modal potwierdzenia resetu
     */
    function hideResetModal() {
        elements.resetModal.classList.remove('active');
    }

    /**
     * Potwierdza reset postępu (tylko wyniki, nie imiona/kolory)
     */
    function confirmReset() {
        Storage.resetScores();
        currentScore = { player1: 0, player2: 0 };
        hideResetModal();
    }

    // Uruchom aplikację po załadowaniu DOM
    document.addEventListener('DOMContentLoaded', init);
})();
