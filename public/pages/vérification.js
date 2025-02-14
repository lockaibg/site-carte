document.getElementById('check-btn').addEventListener('click', async () => {
    const logElem = document.getElementById('log');
    logElem.textContent = "Démarrage de la vérification...\n";
  
    try {
      const cardsResponse = await fetch('/cards.json');
      if (!cardsResponse.ok) {
        logElem.textContent += "Erreur lors du chargement de cards.json.\n";
        return;
      }
      const cards = await cardsResponse.json();
  
      const usedImages = new Set();
      cards.forEach(card => {
        if (card.source_illustration) {
          const fileName = card.source_illustration.split('/').pop();
          usedImages.add(fileName);
        }
      });
      logElem.textContent += `Images utilisées dans cards.json : ${[...usedImages].join(', ')}\n`;
      const imagesListResponse = await fetch('/listImages.txt');
      if (!imagesListResponse.ok) {
        logElem.textContent += "Erreur lors du chargement de listImages.txt.\n";
        return;
      }
      const listText = await imagesListResponse.text();
      const allImages = listText.split(/\r?\n/).map(l => l.trim()).filter(line => line !== '');
      logElem.textContent += `Images trouvées dans illustrationCartes : ${allImages.join(', ')}\n`;
  
      for (const image of allImages) {
        if (!usedImages.has(image)) {
          logElem.textContent += `Suppression de l'image non utilisée : ${image}\n`;
          const deleteResponse = await fetch('/deleteImage', {
            method: 'DELETE', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: image })
          });
          if (deleteResponse.ok) {
            logElem.textContent += `Image ${image} supprimée avec succès.\n`;
          } else {
            logElem.textContent += `Erreur lors de la suppression de ${image}.\n`;
          }
        } else {
          logElem.textContent += `Image ${image} utilisée, aucune action effectuée.\n`;
        }
      }
  
      logElem.textContent += "Vérification terminée.";
    } catch (error) {
      logElem.textContent += "Erreur : " + error.message;
    }
  });
  