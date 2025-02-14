import { findCardById, findImagePath } from './utils.js';

const zoneCardLists = {
    'zone-champ': [],
    'zone-race': [],
    'zone-cimetiere': [],
    'zone-terrain': [],
    'zone-deck': [],
    'zone-main': []
};

window.zoneCardLists = zoneCardLists;

let ws; 

function setupWebSocket() {
    const idGame = new URLSearchParams(window.location.search).get('idGame');
    const userCode = new URLSearchParams(window.location.search).get('code');

    if (!idGame || !userCode) {
        console.error('WebSocket : idGame ou userCode manquant.');
        return;
    }

    ws = new WebSocket(`ws://${window.location.host}/?idGame=${idGame}&code=${userCode}`);
    window.ws = ws;
    ws.onopen = () => {
        console.log('WebSocket connecté.');
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'terrain-update') {
            updateOpponentTerrain(message.terrainCards);
        }
    };

    ws.onclose = () => {
        console.warn('WebSocket déconnecté.');
    };

    ws.onerror = (error) => {
        console.error('Erreur WebSocket :', error);
    };
}

function splitAtDash(input) {
    const [beforeDash, afterDash] = input.split("-");
    return { beforeDash, afterDash };
}
async function updateOpponentTerrain(terrainCards) {
    const opponentZone = document.getElementById('opponent-cards-container');
    opponentZone.innerHTML = '';

    for (const cardId of terrainCards) {
        const li = document.createElement('li');
        li.style.listStyle = "none";
        const cardNom = splitAtDash(cardId).beforeDash;
        const img = document.createElement('img');
        img.src = await findImagePath(cardNom); 
        img.alt = cardNom;
        img.style.width = "180px";
        li.appendChild(img);
        opponentZone.appendChild(li);
    }
}
function initZones() {
    const zones = document.querySelectorAll('.zone');
    zones.forEach(zone => {
        zone.removeEventListener('dragover', handleDragOver);
        zone.removeEventListener('drop', handleDrop);
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('drop', handleDrop);
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
}

async function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation(); 

    const cardId = e.dataTransfer.getData("text/plain");
    const draggedLi = document.querySelector(`li[data-card-id="${cardId}"]`);

    if (!draggedLi) {
        console.error(`Carte avec ID "${cardId}" introuvable.`);
        return;
    }

    let oldZone = draggedLi.dataset.zone || "zone-main";
    const newZone = e.currentTarget.classList.contains('zone') ? e.currentTarget.classList[1] : null;

    if (!newZone) return;

    zoneCardLists[oldZone] = zoneCardLists[oldZone] || [];
    zoneCardLists[newZone] = zoneCardLists[newZone] || [];

    zoneCardLists[oldZone] = zoneCardLists[oldZone].filter(id => id !== cardId);
    zoneCardLists[newZone].push(cardId);

    draggedLi.dataset.zone = newZone;
    e.currentTarget.appendChild(draggedLi);

    if (oldZone === "zone-cimetiere" || oldZone === "zone-race") {
        const modalList = document.getElementById('zone-modal-list');
        if (modalList) {
            const modalItem = modalList.querySelector(`li[data-card-id="${cardId}"]`);
            if (modalItem) {
                modalList.removeChild(modalItem);
            }
        }
    }

    console.log(`Carte déplacée de ${oldZone} : ${zoneCardLists[oldZone]} vers ${newZone} : ${zoneCardLists[newZone]}.`);

    if (newZone === 'zone-terrain' && window.ws && window.ws.readyState === WebSocket.OPEN) {
        
        const terrainCards = zoneCardLists['zone-terrain'];
        const idGame = new URLSearchParams(window.location.search).get('idGame');
        const userCode = new URLSearchParams(window.location.search).get('code');

        const message = {
            type: 'update-terrain',
            idGame,
            userCode,
            terrainCards,
        };

        window.ws.send(JSON.stringify(message));
    }
}

function refreshRaceBottom() {
    const raceZone = document.querySelector('.zone-race');
    if (!raceZone) return;

    raceZone.innerHTML = "";

    const raceList = zoneCardLists["zone-race"];
    if (raceList.length === 0) return;

    const bottomCardId = raceList[0];
    const cardObj = findCardById(bottomCardId);
    if (!cardObj) return;

    const carte = new window.Carte(cardObj);
    const li = carte.renderListItem();

    raceZone.appendChild(li);
    carte.loadImage(li);
}

function enableZoneClickToShowAllCards() {
    const cimeteryZone = document.querySelector('.zone-cimetiere');
    if (cimeteryZone) {
        cimeteryZone.addEventListener('click', () => {
            openZoneModal('zone-cimetiere');
        });
    }

    const raceZone = document.querySelector('.zone-race');
    if (raceZone) {
        raceZone.addEventListener('click', () => {
            openZoneModal('zone-race');
        });
    }
}

async function openZoneModal(zoneName) {
    const cards = zoneCardLists[zoneName];
    const modal = document.getElementById('zone-modal');
    const modalList = document.getElementById('zone-modal-list');
    modalList.innerHTML = '';

    for (const cardId of cards) {
        const li = document.createElement('li');
        li.style.listStyle = "none";
        li.style.cursor = "grab";
        li.draggable = true;
        li.dataset.cardId = cardId;
        li.dataset.zone = zoneName;

        const cardObj = findCardById(cardId);
        if (!cardObj) continue;

        const img = document.createElement('img');
        const imagePath = await findImagePath(cardObj.nom);
        img.src = imagePath;
        img.alt = cardObj.nom;
        img.style.width = "180px";

        li.appendChild(img);
        modalList.appendChild(li);

        li.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData("text/plain", cardId);
            e.dataTransfer.effectAllowed = "move";
        });
    }

    modal.style.display = "block";
}

function initModalClose() {
    const modal = document.getElementById('zone-modal');
    const closeBtn = document.getElementById('close-modal');
    const modalList = document.getElementById('zone-modal-list');

    const closeModal = () => {
        modal.style.display = "none";
        if (modalList) {
            modalList.innerHTML = "";
        }
    };

    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function disableDragFromZones() {
    const cimeteryZone = document.querySelector('.zone-cimetiere');
    const raceZone = document.querySelector('.zone-race');

    if (cimeteryZone) {
        cimeteryZone.addEventListener('dragstart', (e) => {
            e.preventDefault();
            console.warn("Drag interdit depuis la zone cimetière.");
        });
    }

    if (raceZone) {
        raceZone.addEventListener('dragstart', (e) => {
            e.preventDefault();
            console.warn("Drag interdit depuis la zone race.");
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    disableDragFromZones();
    initZones();
    enableZoneClickToShowAllCards();
    initModalClose();
    refreshRaceBottom();
    setupWebSocket();
});
window.initZones = initZones;
export {
    refreshRaceBottom,
    openZoneModal
};
