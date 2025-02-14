
const previewName = document.getElementById('preview-name');
const previewEffect = document.getElementById('preview-effect');
const previewType = document.getElementById('preview-type');
const previewEnergy = document.getElementById('preview-energy');
const previewAttack = document.getElementById('preview-attack');
const previewDefense = document.getElementById('preview-defense');
const previewIllustration = document.getElementById('preview-illustration');
const backgroundSelect = document.getElementById('card-background');
const fondCardImg = document.querySelector('.fond-card img');
const illustrationPosition = document.getElementById('illustration-position');
const illustrationScale = document.getElementById('illustration-scale');

const nameInput = document.getElementById('card-name');
const effectInput = document.getElementById('card-effect');
const typeInput = document.getElementById('card-type');
const energyInput = document.getElementById('card-energy');
const attackInput = document.getElementById('card-attack');
const defenseInput = document.getElementById('card-defense');
const imageInput = document.getElementById('card-image');
const params = new URLSearchParams(window.location.search);

    if (params.has('nom')) {
        nameInput.value = params.get('nom');
    }
    if (params.has('effet')) {
        effectInput.value = params.get('effet');
    }
    if (params.has('type')) {
        typeInput.value = params.get('type');
    }
    if (params.has('energie')) {
        energyInput.value = params.get('energie');
    }
    if (params.has('attaque')) {
        attackInput.value = params.get('attaque');
    }
    if (params.has('defense')) {
        defenseInput.value = params.get('defense');
    }
    if (params.has('fond')) {
        backgroundSelect.value = params.get('fond');
    }
    if (params.has('illustration')) {
        previewIllustration.src = params.get('illustration');
    }

    updatePreview();

function updatePreview() {
    previewName.textContent = nameInput.value;
    previewEffect.innerHTML = effectInput.value;
    previewType.textContent = typeInput.value;
    previewEnergy.textContent = energyInput.value;
    previewAttack.textContent = attackInput.value;
    previewDefense.textContent = defenseInput.value;
    if (imageInput.files && imageInput.files[0]) {
        previewIllustration.src = URL.createObjectURL(imageInput.files[0]);
    } else if(params.has('illustration')){
        previewIllustration.src = "../../" + params.get('illustration');
    }
    else {
        previewIllustration.src = "";
    }
    if(params.has('fond')){
        fondCardImg.src = "../../" + params.get('fond');
    }
    else{
        fondCardImg.src = "../../" + backgroundSelect.value;
    }
    console.log(fondCardImg)
    previewIllustration.style.transform = `translateX(-50%) scale(${illustrationScale.value / 100})`;
    previewIllustration.style.top = illustrationPosition.value + 'px';
    adjustFontSize();
}

[nameInput, imageInput, effectInput, typeInput, energyInput, attackInput, defenseInput].forEach(input => {
    input.addEventListener('input', updatePreview);
});
backgroundSelect.addEventListener('change', updatePreview);
illustrationPosition.addEventListener('input', updatePreview);
illustrationScale.addEventListener('input', updatePreview);

updatePreview();
const form = document.getElementById('card-form');

const saveJsonBtn = document.getElementById('save-json-btn');
const statusMessage = document.getElementById('status-message');

function validateRequiredFields() {
    if (!nameInput.value.trim()) {
        alert("Le champ 'Nom de la carte' est obligatoire.");
        return false;
    }
    if (!typeInput.value.trim()) {
        alert("Le champ 'Type' est obligatoire.");
        return false;
    }

    if (typeInput.value.trim().toLowerCase() !== "race") {
        if (!energyInput.value || isNaN(parseInt(energyInput.value))) {
            alert("Le champ 'Énergie' est obligatoire et doit être un nombre pour les cartes non RACE.");
            return false;
        }
    }

    return true;
}

function createCardObject() {
    let imagePath = "";
    if (imageInput.files && imageInput.files.length > 0) {

        imagePath = "illustrationCartes/" + imageInput.files[0].name;
    }

    const cardObj = {
        nom: nameInput.value.trim(),
        effet: effectInput.value.trim(),
        type: typeInput.value.trim(),
        energie: parseInt(energyInput.value),
        source_illustration: imagePath
    };
    
    const attackVal = parseInt(attackInput.value);
    if (!isNaN(attackVal)) {
        cardObj.attaque = attackVal;
    }

    const defenseVal = parseInt(defenseInput.value);
    if (!isNaN(defenseVal)) {
        cardObj.defense = defenseVal;
    }

    return cardObj;
}

saveJsonBtn.addEventListener('click', async () => {
    if (!validateRequiredFields()) {
        return;
    }

    const newCard = createCardObject();

    try {
        const formData = new FormData();
        formData.append('nom', newCard.nom);
        formData.append('effet', newCard.effet);
        formData.append('type', newCard.type);
        formData.append('energie', newCard.energie);
        formData.append('fond', backgroundSelect.value);
        if (newCard.attaque !== undefined) formData.append('attaque', newCard.attaque);
        if (newCard.defense !== undefined) formData.append('defense', newCard.defense);
        if (imageInput.files && imageInput.files.length > 0) {
            formData.append('card-image', imageInput.files[0]);
        }
        const existingResponse = await fetch('/cards.json');
        if (existingResponse.ok) {
            const existingCards = await existingResponse.json();
            const sameNameCard = existingCards.find(c => c.nom.toLowerCase() === newCard.nom.toLowerCase());
            if (sameNameCard) {
                const confirmReplace = confirm(`Une carte nommée "${newCard.nom}" existe déjà. Voulez-vous la remplacer ?`);
                if (!confirmReplace) {
                    return;
                } else {
                    formData.append('replace', 'true');
                }
            }
        }

        const response = await fetch('/add-card', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            statusMessage.textContent = "Erreur : " + (errorData.error || "Impossible d'ajouter la carte.");
            statusMessage.style.color = 'red';
        } else {
            const result = await response.json();
            statusMessage.textContent = "Carte ajoutée avec succès !";
            statusMessage.style.color = 'green';
            html2canvas(document.getElementById('card-preview'), {
                allowTaint: true,
                useCORS: true,
                logging: true,
                scale: 2, 
                backgroundColor: null
            }).then(canvas => {
                canvas.style.width = "auto";
                canvas.style.height = "auto";
            
                const link = document.createElement('a');
                link.download = `${newCard.nom}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                uploadApercuToServer(newCard.nom, canvas);
            });
        }
    } catch (error) {
        console.error(error);
        statusMessage.textContent = "Erreur de connexion au serveur.";
        statusMessage.style.color = 'red';
    }
});

async function uploadApercuToServer(cardName, canvas) {
    try {
      const dataURL = canvas.toDataURL('image/png');
      
      const fileName = cardName.replace(/\s+/g, '_') + '.png';
  
      const response = await fetch('/upload-apercu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: fileName,
          image: dataURL
        })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        console.error("Erreur du serveur :", errData.error);
      } else {
        const result = await response.json();
        console.log(result.message);
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi au serveur :", error);
    }
  }

function adjustFontSize() {
    const effectContainer = document.querySelector('.card-effect span');
    const container = document.querySelector('.card-effect');

    let fontSize = parseFloat(window.getComputedStyle(effectContainer).fontSize);

    while (effectContainer.scrollHeight > container.clientHeight && fontSize > 10) {
        fontSize -= 1;
        effectContainer.style.fontSize = fontSize + "px";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const userCode = localStorage.getItem('userCode'); 
    if (!userCode || userCode != "JP8J1NYV") {
        window.location.href = '../petitCoquinou.html';
    }
  });
