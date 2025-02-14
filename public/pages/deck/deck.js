let deckCards = []; 

const searchName = document.getElementById('search-name');
const searchEffet = document.getElementById('search-effet');
const searchType = document.getElementById('search-type');
const searchEnergie = document.getElementById('search-energie');
const searchAttaque = document.getElementById('search-attaque');
const searchDefense = document.getElementById('search-defense');
const searchFond = document.getElementById('search-fond');
const searchBtn = document.getElementById('search-btn');

const searchResultsTable = document.getElementById('search-results');
const searchResultsTbody = searchResultsTable.querySelector('tbody');

const deckList = document.getElementById('deck-list');
const saveDeckBtn = document.getElementById('save-deck-btn');
const deckNameInput = document.getElementById('deck-name'); 

async function loadCards() {
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

function filterCards(cards) {
    const nameVal = searchName.value.trim().toLowerCase();
    const effetVal = searchEffet.value.trim().toLowerCase();
    const typeVal = searchType.value.trim().toLowerCase();
    const energieVal = searchEnergie.value ? parseInt(searchEnergie.value) : null;
    const attaqueVal = searchAttaque.value ? parseInt(searchAttaque.value) : null;
    const defenseVal = searchDefense.value ? parseInt(searchDefense.value) : null;
    const fondVal = searchFond.value.trim().toLowerCase();

    return cards.filter(card => {
        const cardAttaque = (typeof card.attaque === 'number') ? card.attaque : null;
        const cardDefense = (typeof card.defense === 'number') ? card.defense : null;

        if (nameVal && !card.nom.toLowerCase().includes(nameVal)) return false;
        if (effetVal && !card.effet.toLowerCase().includes(effetVal)) return false;
        if (typeVal && !card.type.toLowerCase().includes(typeVal)) return false;
        if (energieVal !== null && card.energie !== energieVal) return false;
        if (attaqueVal !== null && cardAttaque !== attaqueVal) return false;
        if (defenseVal !== null && cardDefense !== defenseVal) return false;
        if (fondVal && (!card.fond || !card.fond.toLowerCase().includes(fondVal))) return false;

        return true;
    });
}

async function displayResults(cards) {
    searchResultsTbody.innerHTML = '';

    if (cards.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 3;
        td.textContent = "Aucune carte trouvée.";
        tr.appendChild(td);
        searchResultsTbody.appendChild(tr);
        return;
    }

    for (const card of cards) {
        const tr = document.createElement('tr');

        const tdImage = document.createElement('td');
        const imagePath = await findExistingAppercuPath(card.nom);

        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = card.nom;
        img.style.width = "100px";
        img.style.cursor = "pointer";
        img.addEventListener('click', () => {
            addCardToDeck(card);
        });

        tdImage.appendChild(img);
        tr.appendChild(tdImage);

        const tdType = document.createElement('td');
        tdType.textContent = card.type;
        tr.appendChild(tdType);

        const tdEnergie = document.createElement('td');
        tdEnergie.textContent = card.energie;
        tr.appendChild(tdEnergie);

        searchResultsTbody.appendChild(tr);
    }
}

async function findExistingAppercuPath(nom) {
    const rawPath = `../../appercu/${nom}.png`;
    const underscoredPath = `../../appercu/${nom.replace(/\s+/g, '_')}.png`;

    if (await fileExists(rawPath)) {
        return rawPath;
    }
    if (await fileExists(underscoredPath)) {
        return underscoredPath;
    }

    return '../../appercu/default.png';
}

async function fileExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
}

async function addCardToDeck(cardObj) {
    if (deckCards.length >= 51) {
        alert("Vous ne pouvez pas ajouter plus de 51 cartes dans le deck !");
        return;
    }

    const distinctClasses = new Set(
        deckCards.map(c => c.fond ? c.fond.toUpperCase() : "").filter(f => f && f !== "FOND DE CARTE/COMMUN.PNG")
    );

    const newCardFond = (cardObj.fond || "").toUpperCase();
    if (newCardFond !== "FOND DE CARTE/COMMUN.PNG" && !distinctClasses.has(newCardFond)) {
        if (distinctClasses.size >= 2) {
            alert("Impossible d'avoir 3 classes différentes dans le deck !");
            return;
        }
    }

    if (cardObj.type && cardObj.type.toUpperCase() === "RACE") {
        const alreadyHasRace = deckCards.some(c => c.type && c.type.toUpperCase() === "RACE");
        if (alreadyHasRace) {
            alert("Impossible d'avoir plus d'une race dans le deck !");
            return;
        }
    }

    const copiesOfThisCard = deckCards.filter(c => c.nom.toLowerCase() === cardObj.nom.toLowerCase()).length;
    if (copiesOfThisCard >= 3) {
        alert(`Vous ne pouvez pas avoir plus de 3 exemplaires de "${cardObj.nom}".`);
        return;
    }

    deckCards.push(cardObj);
    updateDeckDisplay();
}

async function updateDeckDisplay() {
    deckList.innerHTML = "";

    for (const card of deckCards) {
        const li = document.createElement('li');
        li.style.listStyle = "none";

        const path = await findExistingAppercuPath(card.nom);

        const img = document.createElement('img');
        img.src = path;
        img.alt = card.nom;
        img.style.width = "120px";
        img.style.cursor = "pointer";

        img.addEventListener('click', () => {
            removeCardFromDeck(card.nom);
        });

        li.appendChild(img);
        deckList.appendChild(li);
    }
}

function removeCardFromDeck(cardName) {
    deckCards = deckCards.filter(c => c.nom !== cardName);
    updateDeckDisplay();
}

async function saveDeck() {
    const deckNameInput = document.getElementById('deck-name');
    const deckName = deckNameInput.value.trim();

    if (!deckName) {
        alert("Le nom du deck est obligatoire !");
        return;
    }

    if (deckCards.length < 41) {
        alert("Il faut au moins 41 cartes pour enregistrer le deck !");
        return;
    }
    if (deckCards.length === 0) {
        alert("Le deck est vide, impossible d'enregistrer.");
        return;
    }

    const userCode = localStorage.getItem('userCode');
    if (!userCode) {
        alert("Vous devez être connecté pour enregistrer un deck.");
        return;
    }

    const deckNames = deckCards.map(c => c.nom);

    let allDecks;
    try {
        const response = await fetch('/deck.json');
        if (!response.ok) {
            console.error("Erreur lors du chargement des decks.");
            alert("Impossible de charger les decks.");
            return;
        }
        allDecks = await response.json();
    } catch (error) {
        console.error("Erreur lors du chargement des decks :", error);
        alert("Erreur lors de la récupération des decks.");
        return;
    }

    const existingDeckIndex = allDecks.findIndex(deck => deck.nom === deckName && deck.userCode === userCode);

    const deckObject = {
        code: existingDeckIndex !== -1 ? allDecks[existingDeckIndex].code : generateDeckCode(),
        userCode: userCode,
        nom: deckName,
        cards: deckNames
    };

    if (existingDeckIndex !== -1) {
        allDecks[existingDeckIndex] = deckObject;
    } else {
        allDecks.push(deckObject);
    }

    try {
        const response = await fetch('/save-deck', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deckObject)
        });

        if (!response.ok) {
            const errData = await response.json();
            alert("Erreur du serveur : " + (errData.error || "Non spécifiée"));
            return;
        }

        alert(existingDeckIndex !== -1 ? `Deck "${deckName}" mis à jour avec succès !` : `Deck "${deckName}" enregistré avec succès !`);
        populateDeckSelector();
    } catch (error) {
        console.error("Erreur lors de l'enregistrement du deck :", error);
        alert("Erreur lors de l'enregistrement du deck.");
    }
}


function generateDeckCode() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
}

async function handleSearch() {
    const allCards = await loadCards();
    const filtered = filterCards(allCards);
    displayResults(filtered);
}

function setupHoverPreview() {
    const previewContainer = document.getElementById('hover-preview');
    if (!previewContainer) {
        console.warn("Élément d'aperçu introuvable.");
        return;
    }

    searchResultsTable.addEventListener('mouseover', async (e) => {
        const row = e.target.closest('tr');
        if (!row) return;

        const imageCell = row.querySelector('img');
        if (!imageCell) return;

        const cardName = imageCell.alt.trim();
        if (!cardName) return;

        const imagePath = await findExistingAppercuPath(cardName);

        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = cardName;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';

        previewContainer.innerHTML = '';
        previewContainer.appendChild(img);
    });

    searchResultsTable.addEventListener('mouseout', (e) => {
        const row = e.target.closest('tr');
        if (row) {
            previewContainer.innerHTML = '<p>Survolez une carte pour l\'aperçu</p>';
        }
    });
}

const deckSelector = document.getElementById('deck-selector'); 

async function loadUserDecks() {
    const userCode = new URLSearchParams(window.location.search).get('code');
    if (!userCode) {
        console.error("Impossible de trouver le code utilisateur dans l'URL.");
        return [];
    }

    try {
        const response = await fetch('/deck.json');
        if (!response.ok) {
            console.error("Impossible de charger deck.json");
            return [];
        }

        const allDecks = await response.json();
        const userDecks = allDecks.filter(deck => deck.userCode === userCode);

        return userDecks;
    } catch (error) {
        console.error("Erreur lors du chargement des decks :", error);
        return [];
    }
}

async function populateDeckSelector() {
    const userDecks = await loadUserDecks();
    userDecks.forEach(deck => {
        const option = document.createElement('option');
        option.value = deck.code;
        option.textContent = deck.nom;
        deckSelector.appendChild(option);
    });
}

async function loadDeckToZone(deckCode) {
    const userDecks = await loadUserDecks();
    const selectedDeck = userDecks.find(deck => deck.code === deckCode);

    if (!selectedDeck) {
        console.error("Deck introuvable.");
        return;
    }

    deckCards = []; 
    const allCards = await loadCards(); 
    selectedDeck.cards.forEach(cardName => {
        const card = allCards.find(c => c.nom === cardName);
        if (card) {
            deckCards.push(card);
        }
    });

    updateDeckDisplay(); 
}

deckSelector.addEventListener('change', () => {
    const selectedDeckCode = deckSelector.value;
    if (selectedDeckCode) {
        loadDeckToZone(selectedDeckCode);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const userCode = localStorage.getItem('userCode');
    if (!userCode) {
        window.location.href = '../connexion/connexion.html';
    }
});


document.addEventListener('DOMContentLoaded', () => {
    setupHoverPreview();
    searchBtn.addEventListener('click', handleSearch);
    saveDeckBtn.addEventListener('click', saveDeck);
    handleSearch();
    populateDeckSelector();
});
