/**
 * Storage Module - Zarządzanie danymi w localStorage
 *
 * Moduł odpowiada za:
 * - Zapisywanie i odczytywanie ustawień graczy
 * - Zapisywanie historii meczów
 * - Resetowanie danych
 */

const Storage = (function() {
    // Klucze localStorage
    const KEYS = {
        PLAYERS: '4inrow_players',
        HISTORY: '4inrow_history',
        CURRENT_SCORE: '4inrow_current_score'
    };

    /**
     * Pobiera ustawienia graczy
     * @returns {Object} Obiekt z danymi graczy
     */
    function getPlayers() {
        const data = localStorage.getItem(KEYS.PLAYERS);
        if (data) {
            return JSON.parse(data);
        }
        // Domyślne ustawienia
        return {
            player1: { name: 'Gracz 1', color: '#3498db' },
            player2: { name: 'Gracz 2', color: '#27ae60' }
        };
    }

    /**
     * Zapisuje ustawienia graczy
     * @param {Object} players - Obiekt z danymi graczy
     */
    function savePlayers(players) {
        localStorage.setItem(KEYS.PLAYERS, JSON.stringify(players));
    }

    /**
     * Pobiera historię meczów
     * @returns {Array} Tablica z historiami meczów
     */
    function getHistory() {
        const data = localStorage.getItem(KEYS.HISTORY);
        if (data) {
            return JSON.parse(data);
        }
        return [];
    }

    /**
     * Dodaje nowy mecz do historii
     * @param {Object} match - Dane meczu
     * @param {string} match.player1Name - Nazwa gracza 1
     * @param {string} match.player2Name - Nazwa gracza 2
     * @param {string} match.player1Color - Kolor gracza 1
     * @param {string} match.player2Color - Kolor gracza 2
     * @param {number|null} match.winner - Numer zwycięzcy (1, 2) lub null (remis)
     * @param {string} match.date - Data meczu w formacie ISO
     */
    function addMatch(match) {
        const history = getHistory();
        history.unshift({
            ...match,
            id: Date.now(),
            date: new Date().toISOString()
        });
        // Zachowaj maksymalnie 100 ostatnich meczów
        if (history.length > 100) {
            history.pop();
        }
        localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
    }

    /**
     * Pobiera aktualny wynik sesji
     * @returns {Object} Obiekt z wynikami
     */
    function getCurrentScore() {
        const data = localStorage.getItem(KEYS.CURRENT_SCORE);
        if (data) {
            return JSON.parse(data);
        }
        return { player1: 0, player2: 0 };
    }

    /**
     * Zapisuje aktualny wynik sesji
     * @param {Object} score - Obiekt z wynikami
     */
    function saveCurrentScore(score) {
        localStorage.setItem(KEYS.CURRENT_SCORE, JSON.stringify(score));
    }

    /**
     * Resetuje wynik sesji
     */
    function resetCurrentScore() {
        localStorage.removeItem(KEYS.CURRENT_SCORE);
    }

    /**
     * Resetuje całą historię i ustawienia
     */
    function resetAll() {
        localStorage.removeItem(KEYS.PLAYERS);
        localStorage.removeItem(KEYS.HISTORY);
        localStorage.removeItem(KEYS.CURRENT_SCORE);
    }

    /**
     * Resetuje tylko wyniki (historia + wynik sesji), zachowuje ustawienia graczy
     */
    function resetScores() {
        localStorage.removeItem(KEYS.HISTORY);
        localStorage.removeItem(KEYS.CURRENT_SCORE);
    }

    /**
     * Pobiera statystyki graczy
     * @param {string} playerName - Nazwa gracza
     * @returns {Object} Statystyki gracza
     */
    function getPlayerStats(playerName) {
        const history = getHistory();
        let wins = 0;
        let losses = 0;
        let draws = 0;

        history.forEach(match => {
            if (match.player1Name === playerName) {
                if (match.winner === 1) wins++;
                else if (match.winner === 2) losses++;
                else draws++;
            } else if (match.player2Name === playerName) {
                if (match.winner === 2) wins++;
                else if (match.winner === 1) losses++;
                else draws++;
            }
        });

        return { wins, losses, draws, total: wins + losses + draws };
    }

    // Publiczne API modułu
    return {
        getPlayers,
        savePlayers,
        getHistory,
        addMatch,
        getCurrentScore,
        saveCurrentScore,
        resetCurrentScore,
        resetAll,
        resetScores,
        getPlayerStats
    };
})();
