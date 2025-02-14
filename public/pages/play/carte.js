import { findImagePath } from './utils.js';

class Carte {
    constructor({ 
        nom, 
        effet, 
        type, 
        energie = null, 
        attaque = null, 
        defense = null,
    }) {
        this.nom = nom;
        this.effet = effet;
        this.type = type;
        this.energie = energie;
        this.attaque = attaque;
        this.defense = defense;
        this.source_illustration = `appercu/${this.nom}.png`;
    }

    appliquerEffet() {
        console.log(`Effet appliqué pour la carte ${this.nom}`);
    }

    renderListItem() {
        const li = document.createElement('li');
        li.style.listStyle = "none"; 
        li.style.border = "1px solid #ccc";
        li.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        li.draggable = true;
        li.style.cursor = "grab";

        const uniqueId = `${this.nom}-${Date.now()}`;
        li.dataset.cardId = uniqueId;
        li.dataset.cardName = this.nom;
        li.dataset.zone = "zone-main";

        li.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData("text/plain", `${this.nom}-${Date.now()}`);
            e.dataTransfer.effectAllowed = "move";
        });

        if (this.source_illustration) {
            const img = document.createElement('img');
            img.src = this.source_illustration; 
            img.alt = this.nom;
            img.style.width = "180px";
            li.appendChild(img);
        }

        li.addEventListener('mouseover', () => {
            const previewZone = document.getElementById('hover-preview');
            previewZone.innerHTML = ''; 
            const bigImg = document.createElement('img');
            bigImg.src = this.source_illustration;
            bigImg.alt = this.nom;
            previewZone.appendChild(bigImg);
        });
    
        li.addEventListener('mouseout', () => {
            const previewZone = document.getElementById('hover-preview');
            previewZone.innerHTML = '';
        });

        return li;
    }
}

Carte.prototype.renderListItem = function () {
    const li = document.createElement('li');
    li.style.listStyle = "none";
    li.style.cursor = "grab";
    li.draggable = true;
  
    const uniqueId = `${this.nom}-${Date.now()}`;
    li.dataset.cardId = uniqueId;
    li.dataset.cardName = this.nom;
  
    const img = document.createElement('img');
    img.src = "appercu/default.png";
    img.alt = this.nom;
    img.style.width = "180px";
    li.appendChild(img);
  
    li.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData("text/plain", uniqueId);
        e.dataTransfer.effectAllowed = "move";
    });
  
    return li;
  };
  
  Carte.prototype.loadImage = async function (li) {
    const img = li.querySelector('img');
    const imagePath = await findImagePath(this.nom);
    img.src = imagePath;
  };


  async function drawRandomCardFromDeck() {
    const deckArray = window.zoneCardLists["zone-deck"];
    if (!deckArray || deckArray.length === 0) {
        alert("Le deck est vide !");
        return;
    }

    const randomIndex = Math.floor(Math.random() * deckArray.length);
    const cardName = deckArray.splice(randomIndex, 1)[0];
    const cardObj = window.allCards.find(c => c.nom === cardName);

    if (!cardObj) {
        console.warn(`Aucune carte nommée "${cardName}" trouvée.`);
        return;
    }

    window.zoneCardLists["zone-main"].push(`${cardName}-${Date.now()}`);

    const carte = new window.Carte(cardObj);
    const li = carte.renderListItem();

    const cardsContainer = document.getElementById('cards-container');
    cardsContainer.appendChild(li);

    await carte.loadImage(li);
    console.log(`Carte "${cardName}" piochée depuis le deck. Reste ${deckArray.length} cartes.`);
}

export{
    drawRandomCardFromDeck
}
window.Carte = Carte;
