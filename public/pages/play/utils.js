import { drawRandomCardFromDeck } from "./carte.js";
import { openZoneModal } from "./zones.js";

async function findImagePath(cardName) {
    const rawPath = `../../appercu/${cardName}.png`;
    const underscoredPath = `../../appercu/${cardName.replace(/\s+/g, '_')}.png`;

    if (await fileExists(underscoredPath)) {
        return underscoredPath;
    }
    if (await fileExists(rawPath)) {
        return rawPath;
    }

    return '../../appercu/default.png';
}

async function fileExists(path) {
    try {
        const response = await fetch(path, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
}


function findCardById(cardId) {
      for (const zone in zoneCardLists) {
          const cardIndex = zoneCardLists[zone].findIndex(id => id === cardId);
          if (cardIndex !== -1) {
              const cardName = zoneCardLists[zone][cardIndex].split('-')[0];
              return window.allCards.find(card => card.nom === cardName);
          }
      }
      return null;
  }
  function initDeckMenu() {
    const deckZone = document.querySelector('.zone-deck');
    const deckMenu = document.getElementById('deck-menu'); 
    const drawButton = document.getElementById('draw-card-btn'); 
    const viewDeckButton = document.getElementById('view-deck-btn'); 
  
    if (!deckZone || !deckMenu || !drawButton || !viewDeckButton) {
      console.error("Les éléments du menu du deck sont manquants.");
      return;
    }
  
    deckZone.addEventListener('click', () => {
      deckMenu.style.display = 'block'; 
    });
  
    drawButton.addEventListener('click', () => {
      drawRandomCardFromDeck(); 
      deckMenu.style.display = 'none'; 
    });
  
    viewDeckButton.addEventListener('click', () => {
      openZoneModal('zone-deck'); 
      deckMenu.style.display = 'none'; 
    });
  
    window.addEventListener('click', (e) => {
      if (e.target !== deckZone && !deckMenu.contains(e.target)) {
        deckMenu.style.display = 'none';
      }
    });
  }
  document.addEventListener('DOMContentLoaded', () => {
      initDeckMenu();
  });
  

export {
    findCardById,
    findImagePath,
    fileExists
};
