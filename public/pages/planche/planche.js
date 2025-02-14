let plancheCards = [];
const searchForm = document.getElementById('search-form');
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

const plancheList = document.getElementById('planche-list');


async function loadCards() {
    try {
        const response = await fetch('/cards.json');
        if (!response.ok) {
            console.error("Impossible de charger cards.json");
            return [];
        }
        const data = await response.json();
        return data;
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

function displayResults(cards) {
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

    cards.forEach(card => {
        const tr = document.createElement('tr');

        const tdNom = document.createElement('td');
        tdNom.textContent = card.nom;
        tdNom.style.cursor = 'pointer';

        tdNom.addEventListener('click', () => {
            addCardToPlanche(card);
        });

        tr.appendChild(tdNom);

        const tdType = document.createElement('td');
        tdType.textContent = card.type;
        tr.appendChild(tdType);

        const tdEnergie = document.createElement('td');
        tdEnergie.textContent = card.energie;
        tr.appendChild(tdEnergie);

        searchResultsTbody.appendChild(tr);
    });
}

  async function fileExists(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok; 
    } catch {
      return false; 
    }
  }

async function getAppercuPath(card) {
    const rawName = card.nom;
    const underscoredName = rawName.replace(/\s+/g, '_');
    
    const candidates = [
        `../../appercu/${underscoredName}.png`,
      `../../appercu/${rawName}.png`
      
    ];
  
    for (const path of candidates) {
      if (await fileExists(path)) {
        return path; 
      }
    }
    return '../../appercu/default.png';
  }

  const deckSelector = document.getElementById('deck-selector');
  const loadDeckBtn = document.getElementById('load-deck-btn');


async function loadDecks() {
    try {
        const response = await fetch('/deck.json');
        if (!response.ok) {
            console.error("Impossible de charger les decks. Statut :", response.status);
            return [];
        }

        const decks = await response.json();
        console.log("Decks chargés :", decks);

        populateDeckSelector(decks);
    } catch (error) {
        console.error("Erreur lors du chargement des decks :", error);
    }
}

function populateDeckSelector(decks) {
    if (!Array.isArray(decks)) {
        console.error("Les decks chargés ne sont pas un tableau :", decks);
        return;
    }

    deckSelector.innerHTML = '<option value="">Choisissez un deck</option>'; 
    decks.forEach(deck => {
        const option = document.createElement('option');
        option.value = deck.code;
        option.textContent = deck.nom || `Deck ${deck.code}`;
        deckSelector.appendChild(option);
    });
}
  
async function loadDeckToPlanche(deckCode) {
  try {
      const response = await fetch('/deck.json');
      const decks = await response.json();
      const selectedDeck = decks.find(deck => deck.code === deckCode);

      if (!selectedDeck) {
          alert("Deck introuvable.");
          return;
      }

      const allCards = await loadCards();

      selectedDeck.cards.forEach(cardName => {
          const card = allCards.find(c => c.nom === cardName);
          if (card) {
              addCardToPlanche(card); 
          } else {
              console.warn(`Carte "${cardName}" introuvable dans les données.`);
          }
      });
  } catch (error) {
      console.error("Erreur lors du chargement des cartes du deck :", error);
  }
}

  
loadDeckBtn.addEventListener('click', (e) => {
  e.preventDefault(); 
  const selectedDeckCode = deckSelector.value;

  if (!selectedDeckCode) {
      alert("Veuillez sélectionner un deck.");
      return;
  }

  loadDeckToPlanche(selectedDeckCode);
});


function addCardToPlanche(card) {

    if (plancheCards.length >= 51) {
        alert("Vous ne pouvez pas ajouter plus de 51 cartes dans la planche !");
        return;
    }
        
    const distinctClasses = new Set(
        plancheCards
            .map(c => c.fond.toUpperCase())
            .filter(f => f !== "../../FOND DE CARTE/COMMUN.PNG")
    );
      
    const newCardClass = (card.fond || "").toUpperCase();

    const newCardType = (card.type || "").toUpperCase();
    if (newCardType === "RACE") {
        const alreadyHasRace = plancheCards.some(c => (c.type || "").toUpperCase() === "RACE");
        if (alreadyHasRace) {
            alert("Impossible d'avoir plus d'une race dans la planche !");
            return;
        }
    }

    const copiesOfThisCard = plancheCards.filter(c => c.nom.toLowerCase() === card.nom.toLowerCase()).length;
    if (copiesOfThisCard >= 3) {
        alert(`Vous ne pouvez pas avoir plus de 3 exemplaires de "${card.nom}".`);
        return;
    }

    plancheCards.push(card);

    // On crée un <li> ou tout autre élément pour la représenter
    const li = document.createElement('li');
    const img = document.createElement('img');
    getAppercuPath(card).then(path => {
  img.src = path;
});
    img.alt = card.nom;
    img.style.width = "120px";
    li.appendChild(img);
    plancheList.appendChild(li);
}

async function handleSearch() {
    const allCards = await loadCards();
    const filtered = filterCards(allCards);
    displayResults(filtered);
}

searchBtn.addEventListener('click', handleSearch);

document.addEventListener('DOMContentLoaded', handleSearch);

const CARD_WIDTH_CM = 6.6;
const CARD_HEIGHT_CM = 9;

const PT_PER_CM = 28.3465;
const CARD_WIDTH_PT = CARD_WIDTH_CM * PT_PER_CM;   
const CARD_HEIGHT_PT = CARD_HEIGHT_CM * PT_PER_CM; 

const MARGIN_LEFT = 40;
const MARGIN_TOP = 40;
const HORIZONTAL_SPACING = 0;
const VERTICAL_SPACING = 0;

function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

async function generatePDF(doc, groups) {
  const NEGATIVE_HORIZONTAL = 0.5; 
  const NEGATIVE_VERTICAL = 0.5;   

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
    const group = groups[groupIndex];
    if (groupIndex > 0) {
      doc.addPage();
    }

    for (let i = 0; i < group.length; i++) {
      const card = group[i];
      const col = i % 3;
      const row = Math.floor(i / 3);
      
      const x = MARGIN_LEFT + col * (CARD_WIDTH_PT + HORIZONTAL_SPACING) - (col * NEGATIVE_HORIZONTAL);
      const y = MARGIN_TOP + row * (CARD_HEIGHT_PT + VERTICAL_SPACING) - (row * NEGATIVE_VERTICAL);
      
      const imageUrl = await getAppercuPath(card);

      doc.addImage(
        imageUrl,
        'PNG',
        x,
        y,
        CARD_WIDTH_PT,
        CARD_HEIGHT_PT,
        undefined,
        'FAST'
      );
    }
  }
}



document.getElementById('download-pdf-btn').addEventListener('click', () => {
  if (!plancheCards || plancheCards.length === 0) {
    alert("Aucune carte à imprimer dans la planche.");
    return;
  }

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',   
    format: 'a4',
  });

  const groupsOfNine = chunkArray(plancheCards, 9);

  (async () => {
  await generatePDF(doc, groupsOfNine);
  doc.save('planche.pdf');
})();
});

document.addEventListener('DOMContentLoaded', () => {
  const userCode = localStorage.getItem('userCode'); 
  if (!userCode || userCode != "JP8J1NYV") {
      window.location.href = '../petitCoquinou.html';
  }
});


  document.addEventListener('DOMContentLoaded', async () => {
    await loadDecks();
    handleSearch();
});

