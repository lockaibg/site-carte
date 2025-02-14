import { findImagePath } from './utils.js';
import { refreshRaceBottom } from './zones.js';
import { findCardById } from './utils.js';

function buildDeckCardsData(allCards, deckNames) {
    const deckCards = [];
    deckNames.forEach(deckCardName => {
        const foundCard = allCards.find(c => c.nom === deckCardName);
        if (foundCard) {
            deckCards.push({ ...foundCard });
        } else {
            console.warn(`Aucune carte nommée "${deckCardName}" n’existe dans cards.json`);
        }
    });
    return deckCards;
}

async function getDeckFromUrlOrRandom() {
    const urlParams = new URLSearchParams(window.location.search);
    const deckCode = urlParams.get('deck');

    const response = await fetch('/deck.json');
    const decks = await response.json();

    if (deckCode) {
        const selectedDeck = decks.find(deck => deck.code === deckCode);
        if (selectedDeck) {
            console.error(`deck trouvé avec le code ${deckCode}`);
            return selectedDeck;
        } else {
            console.warn(`Aucun deck trouvé avec le code "${deckCode}". Un deck aléatoire sera choisi.`);
        }
    }
    else{
        console.log(`aucun code trouvé`);
        return decks[Math.floor(Math.random() * decks.length)];
    }
}

async function displayCards() {;
    const selectedDeck = await getDeckFromUrlOrRandom();
    if (!selectedDeck) {
        alert("Impossible de récupérer un deck.");
        return;
    }

    const allCards = await loadAllCards();
    if (allCards.length === 0) {
        alert("Impossible de charger cards.json !");
        return;
    }

    window.allCards = allCards;

    const deckCardsData = buildDeckCardsData(allCards, selectedDeck.cards);

    const raceCardIndex = deckCardsData.findIndex(card => card.type && card.type.toUpperCase() === "RACE");
    if (raceCardIndex !== -1) {
        const raceCard = deckCardsData.splice(raceCardIndex, 1)[0];
        window.zoneCardLists["zone-race"] = [raceCard.nom];
        refreshRaceBottom();
    }

    const { startingHand, remainingDeck } = drawStartingHand(deckCardsData);

    
    displayDeckCards(startingHand);
    window.zoneCardLists["zone-deck"] = remainingDeck.map(card => card.nom);

    

    window.initZones();
}

async function loadAllCards() {
    try {
        const response = await fetch('/cards.json');
        if (!response.ok) {
            console.error("Impossible de charger cards.json");
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error("Erreur lors du chargement du JSON :", error);
        return [];
    }
}

async function displayDeckCards(deckCardsData) {
    const cardsContainer = document.getElementById('cards-container');
    cardsContainer.innerHTML = "";

    window.zoneCardLists['zone-main'] = [];

    for (const cardObj of deckCardsData) {
        const carte = new window.Carte(cardObj);
        const cardItem = carte.renderListItem();
    
        const cardId = cardItem.dataset.cardId;
        window.zoneCardLists['zone-main'].push(cardId);
    
        cardsContainer.appendChild(cardItem);
        await carte.loadImage(cardItem);
    }
}

function drawStartingHand(deckCardsData) {
    let deckCopy = fisherYatesShuffle([...deckCardsData]);
    let startingHand = deckCopy.slice(0, 6);
    deckCopy = deckCopy.slice(6);
    return { startingHand, remainingDeck: deckCopy };
}

function fisherYatesShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function setupHoverPreview() {
    const previewContainer = document.getElementById('hover-preview');
    if (!previewContainer) {
        console.warn("Élément conteneur introuvable");
        return;
    }

    document.addEventListener('mouseover', async (e) => {
        const cardElement = e.target.closest('li[data-card-id]');
        const opponentCardImg = e.target.closest('#opponent-cards-container img');

        if (!cardElement && !opponentCardImg) return;

        let img;
        if (cardElement) {
            const cardId = cardElement.dataset.cardId;
            const cardObj = findCardById(cardId);
            if (!cardObj) return;

            img = document.createElement('img');
            const imagePath = await findImagePath(cardObj.nom);
            img.src = imagePath;
            img.alt = cardObj.nom;
        } else if (opponentCardImg) {
            img = document.createElement('img');
            img.src = opponentCardImg.src;
            img.alt = opponentCardImg.alt || "Carte de l'adversaire";
        }

        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';

        previewContainer.innerHTML = '';
        previewContainer.appendChild(img);
    });

    document.addEventListener('mouseout', (e) => {
        const cardElement = e.target.closest('li[data-card-id]');
        const opponentCardImg = e.target.closest('#opponent-cards-container img');

        if (cardElement || opponentCardImg) {
            previewContainer.innerHTML = '';
        }
    });
}



const userCode = new URLSearchParams(window.location.search).get('code');
const idGame = new URLSearchParams(window.location.search).get('idGame');

async function startGame() {
    try {
        await fetch('/start-game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ idGame, userCode })
        });
        console.log(`Partie ${idGame} démarrée`);
    } catch (error) {
        console.error("Erreur lors de l'enregistrement de la partie :", error);
    }
}

async function endGame() {
    try {
        await fetch('/end-game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ idGame })
        });
        console.log(`Partie ${idGame} terminée`);
    } catch (error) {
        console.error("Erreur lors de la suppression de la partie :", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const userCode = localStorage.getItem('userCode'); 
    if (!userCode) {
        window.location.href = '../connexion/connexion.html';
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const counters = {
        counter1: { value: 0, min: 0, max: 10 },
        counter2: { value: 1, min: 1, max: 20 }
    };

    function updateCounter(counterId, increment) {
        const counter = counters[counterId];
        if (!counter) return;

        const newValue = counter.value + increment;
        if (newValue >= counter.min && newValue <= counter.max) {
            counter.value = newValue;
            document.getElementById(counterId).textContent = counter.value;
        }
    }

    document.querySelectorAll('.increment').forEach(button => {
        button.addEventListener('click', () => {
            const counterId = button.dataset.counter;
            updateCounter(counterId, 1);
        });
    });

    document.querySelectorAll('.decrement').forEach(button => {
        button.addEventListener('click', () => {
            const counterId = button.dataset.counter;
            updateCounter(counterId, -1);
        });
    });
});

document.addEventListener('DOMContentLoaded', async () => {
    await displayCards();
    if (typeof enableZoneClickToShowAllCards === 'function') {
        enableZoneClickToShowAllCards();
    }
    if (typeof initModalClose === 'function') {
        initModalClose();
    }
    setupHoverPreview();
    startGame();
});

window.addEventListener('beforeunload', endGame);