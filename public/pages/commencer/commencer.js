document.addEventListener('DOMContentLoaded', async () => {
    const deckSelector = document.getElementById('deck-selector');
    const startGameBtn = document.getElementById('start-game-btn');

    const userCode = new URLSearchParams(window.location.search).get('code');

    if (!userCode) {
        alert('Code utilisateur introuvable.');
        return;
    }

    try {
        const response = await fetch('/deck.json');
        const decks = await response.json();

        // Filtrer les decks par userCode
        const userDecks = decks.filter(deck => deck.userCode === userCode);

        if (userDecks.length === 0) {
            alert("Aucun deck disponible pour cet utilisateur.");
            return;
        }

        // Ajouter les decks filtrés au menu déroulant
        userDecks.forEach(deck => {
            const option = document.createElement('option');
            option.value = deck.code;
            option.textContent = deck.nom || `Deck ${deck.code}`;
            deckSelector.appendChild(option);
        });

        deckSelector.addEventListener('change', () => {
            startGameBtn.disabled = !deckSelector.value;
        });

        startGameBtn.addEventListener('click', async (e) => {
            const selectedDeckCode = deckSelector.value;
            const selectedDeck = userDecks.find(deck => deck.code === selectedDeckCode);
            e.preventDefault();
            if (!selectedDeck) {
                alert("Deck sélectionné introuvable.");
                return;
            }

            try {
                const response = await fetch('/join-or-create-game', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userCode, deck: selectedDeck.cards })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    alert(`Erreur : ${errorData.error || 'Non spécifiée'}`);
                    return;
                }

                const data = await response.json();
                if (data.idGame) {
                    window.location.href = `../play/play.html?deck=${selectedDeckCode}&idGame=${data.idGame}&code=${userCode}`;
                } else {
                    alert('Erreur lors de la création ou de la jonction de la partie.');
                }
            } catch (error) {
                console.error("Erreur lors de la création ou de la jonction de la partie :", error);
                alert("Une erreur est survenue lors de la création ou de la jonction de la partie.");
            }
        });
    } catch (error) {
        console.error("Erreur lors du chargement des decks :", error);
        alert("Une erreur est survenue lors du chargement des decks.");
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Vérifiez si l'utilisateur est connecté
    const userCode = localStorage.getItem('userCode'); // Par exemple, vérifiez un code utilisateur stocké
    if (!userCode) {
        // Redirigez vers la page de connexion si l'utilisateur n'est pas connecté
        window.location.href = '../connexion/connexion.html';
    }
});



// Générer une ID aléatoire pour la partie
function generateGameId() {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
}
