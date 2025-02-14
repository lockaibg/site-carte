const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const { WebSocketServer } = require('ws');

const app = express();
const server = require('http').createServer(app); 
const wss = new WebSocketServer({ server });


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json());

const activeGames = {};
const activeGameStates = {};
const clients = {};

function findGameWithOnePlayer() {
  for (const [idGame, gameData] of Object.entries(activeGames)) {
      if (gameData.players.length === 1) {
          return idGame;
      }
  }
  return null;
}

function generateGameId() {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
}

wss.on('connection', (ws, request) => {
  const params = new URLSearchParams(request.url.split('?')[1]);
  const idGame = params.get('idGame');
  const userCode = params.get('code');

  if (!idGame || !userCode) {
      ws.close();
      return;
  }

  console.log(`Client connecté : idGame=${idGame}, userCode=${userCode}`);

  clients[idGame] = clients[idGame] || {};
  clients[idGame][userCode] = ws;

  ws.on('close', () => {
      console.log(`Client déconnecté : idGame=${idGame}, userCode=${userCode}`);
      if (clients[idGame]) {
          delete clients[idGame][userCode];
          if (Object.keys(clients[idGame]).length === 0) {
              delete clients[idGame];
          }
      }
  });

  ws.on('message', (message) => {
    console.log("2");
      try {
          const parsedMessage = JSON.parse(message);
          console.log("3");
          if (parsedMessage.type === 'update-terrain') {
              console.log("5");
              const { idGame, userCode, terrainCards } = parsedMessage;
              handleTerrainUpdate(idGame, userCode, terrainCards);
              console.log("6");
          }
      } catch (error) {
          console.error("Erreur de traitement du message WebSocket :", error);
      }
  });
});

function handleTerrainUpdate(idGame, userCode, terrainCards) {
  if (!activeGames[idGame] || !clients[idGame]) return;

  const opponentCode = activeGames[idGame].players.find(code => code !== userCode);
  if (opponentCode && clients[idGame][opponentCode]) {
      const message = {
          type: 'terrain-update',
          userCode,
          terrainCards
      };
      clients[idGame][opponentCode].send(JSON.stringify(message));
  }

  activeGameStates[idGame] = activeGameStates[idGame] || {};
  activeGameStates[idGame].terrains = activeGameStates[idGame].terrains || {};
  activeGameStates[idGame].terrains[userCode] = terrainCards;

  console.log(`Terrain mis à jour pour ${userCode} :`, terrainCards);
}

app.post('/join-or-create-game', (req, res) => {
  const { userCode, deck } = req.body;

  if (!userCode || !deck) {
      return res.status(400).json({ error: 'userCode et deck sont requis' });
  }

  let idGame = findGameWithOnePlayer();
  if (idGame) {
      activeGames[idGame].players.push(userCode);
      activeGames[idGame].decks[userCode] = deck;
      activeGames[idGame].timestamp = Date.now();
      console.log(`Joueur ${userCode} rejoint la partie ${idGame}`);
      return res.status(200).json({ idGame, status: 'joined' });
      
  }

  idGame = generateGameId();
  activeGames[idGame] = {
      players: [userCode],
      decks: { [userCode]: deck },
      timestamp: Date.now()
  };
  console.log(`Nouvelle partie ${idGame} créée par ${userCode}`);
  res.status(200).json({ idGame, status: 'created' });
});

app.post('/end-game', (req, res) => {
    const { idGame } = req.body;
    if (!idGame || !activeGames[idGame]) {
        return res.status(400).json({ error: 'idGame invalide ou introuvable' });
    }

    delete activeGames[idGame];
    console.log(`Partie ${idGame} terminée.`);

    if (clients[idGame]) {
        for (const userCode in clients[idGame]) {
            clients[idGame][userCode].close();
        }
        delete clients[idGame];
    }

    res.status(200).json({ message: 'Partie supprimée' });
});


setInterval(() => {
    const now = Date.now();
    for (const [idGame, data] of Object.entries(activeGames)) {
        if (now - data.timestamp > 300000) { // 5 minutes sans activité
            delete activeGames[idGame];
            console.log(`Partie ${idGame} supprimée pour inactivité.`);
        }
    }
}, 60000); 

app.get('/cards.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'cards.json'));
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'public/illustrationCartes/');
  },
  filename: function (req, file, cb) {
      const originalName = file.originalname.split('.')[0]; 
      cb(null, `${originalName}-${Date.now()}.png`);
  }
});

const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, 'public')));

app.post('/add-card', upload.single('card-image'), (req, res) => {
  const { nom, effet, type, energie, attaque, defense, fond, replace } = req.body;

  if (!nom || !type || energie === undefined) {
    return res.status(400).json({ 
      error: "Les champs nom, type et energie sont obligatoires." 
    });
  }

  const energieNum = parseInt(energie, 10);
  const attaqueNum = parseInt(attaque, 10);
  const defenseNum = parseInt(defense, 10);

  let imagePath = "";
  if (req.file && req.file.filename) {
    imagePath = "illustrationCartes/" + req.file.filename;
  }

  const cardsPath = path.join(__dirname, 'cards.json');
  let cardsData = [];
  if (fs.existsSync(cardsPath)) {
    const fileContent = fs.readFileSync(cardsPath, 'utf8');
    cardsData = JSON.parse(fileContent);
  }

  let newCard = {
    source_illustration: imagePath,
    nom: nom.trim(),
    effet: effet.trim(),
    type: type.trim(),
    energie: energieNum,
    fond: fond
  };
if (replace === 'true') {
  newCard = {
    source_illustration: cardsData.find(c => c.nom.toLowerCase() === nom.toLowerCase()).source_illustration,
    nom: nom.trim(),
    effet: effet.trim(),
    type: type.trim(),
    energie: energieNum,
    fond: fond
  };
}

  if (!isNaN(attaqueNum)) {
    newCard.attaque = attaqueNum;
  }
  if (!isNaN(defenseNum)) {
    newCard.defense = defenseNum;
  }
  if (replace === 'true') {
    cardsData = cardsData.filter(c => c.nom.toLowerCase() !== nom.toLowerCase());
  }

  cardsData.push(newCard);

  fs.writeFileSync(cardsPath, JSON.stringify(cardsData, null, 2), 'utf8');

  res.json({ message: "La carte a été ajoutée avec succès !", card: newCard });
});

app.post('/upload-apercu', (req, res) => {
  try {
    // On s’attend à recevoir { fileName: 'xxx.png', image: 'data:image/png;base64,...' }
    const { fileName, image } = req.body;
     
    if (!fileName || !image) {
      return res.status(400).json({ error: "Paramètres manquants : fileName ou image" });
    }
 
    // Retirer l'entête dataURL si présente
    const base64Data = image.replace(/^data:image\/png;base64,/, '');
 
    // Déterminer le chemin de sortie
    const outputPath = path.join(__dirname, 'public', 'appercu', fileName);
 
    fs.writeFileSync(outputPath, base64Data, 'base64');

    console.log(`Aperçu enregistré dans: ${outputPath}`);
    return res.json({ message: "Aperçu enregistré avec succès dans appercu/." });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'aperçu :", error);
     return res.status(500).json({ error: "Erreur lors de l'enregistrement de l'aperçu." });
  }
});

app.post('/save-deck', (req, res) => {
  try {
    const { code, userCode, cards, nom } = req.body;
    if (!code || !cards || !Array.isArray(cards) || !nom) {
      return res.status(400).json({ error: "Paramètres invalides pour le deck." });
    }

    const deckPath = path.join(__dirname, 'deck.json');
    let deckData = [];
    if (fs.existsSync(deckPath)) {
      const fileContent = fs.readFileSync(deckPath, 'utf8');
      deckData = JSON.parse(fileContent);
    }

    const newDeck = { code, userCode, cards, nom }; 
    deckData.push(newDeck);

    fs.writeFileSync(deckPath, JSON.stringify(deckData, null, 2), 'utf8');

    return res.json({ message: "Deck enregistré avec succès.", deck: newDeck });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du deck :", error);
    return res.status(500).json({ error: "Erreur interne serveur" });
  }
});

app.get('/deck.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'deck.json'));
});
app.get('/utilisateur.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'utilisateur.json'));
});
app.get('/game-state', (req, res) => {
  const { idGame, userCode } = req.query;

  if (!idGame || !userCode) {
      return res.status(400).json({ error: 'idGame et userCode sont requis' });
  }

  const game = activeGames[idGame];
  const gameState = activeGameStates[idGame];

  if (!game || !gameState) {
      return res.status(404).json({ error: 'Partie introuvable.' });
  }

  const opponentCode = game.players.find(code => code !== userCode);
  const opponentHandCard = gameState.mains[opponentCode];

  console.log('Main actuelle de l\'adversaire :', opponentHandCard);

  res.status(200).json({ opponentHandCard });
});


const imagesDir = path.join(__dirname, 'public/illustrationCartes');
const listFile = path.join(imagesDir, 'listImages.txt');

app.get('/listImages.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/illustrationCartes/listImages.txt'));
});

function generateListImages() {
  fs.readdir(imagesDir, (err, files) => {
    if (err) {
      console.error("Erreur lors de la lecture du répertoire :", err);
      return;
    }
    // Filtrer les fichiers se terminant par .png (sans tenir compte de la casse)
    const pngFiles = files.filter(file => file.toLowerCase().endsWith('.png'));
    
    // Concaténer les noms de fichiers en insérant un saut de ligne entre chacun
    const content = pngFiles.join('\n');
    
    fs.writeFile(listFile, content, err => {
      if (err) {
        console.error("Erreur lors de l'écriture de listImages.txt :", err);
      } else {
        console.log("listImages.txt créé/mis à jour avec succès.");
      }
    });
  });
}

app.delete('/deleteImage', (req, res) => {
  const { fileName } = req.body;

  if (!fileName) {
    return res.status(400).json({ error: 'fileName est requis.' });
  }

  if (fileName.includes('/') || fileName.includes('\\')) {
    return res.status(400).json({ error: 'fileName invalide.' });
  }

  const filePath = path.join(imagesDir, fileName);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: 'Fichier non trouvé.' });
    }

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Erreur lors de la suppression du fichier :", err);
        return res.status(500).json({ error: 'Erreur lors de la suppression du fichier.' });
      }

      generateListImages();

      return res.json({ message: 'Fichier supprimé avec succès.' });
    });
  });
});


generateListImages();


app.get('/generate-list', (req, res) => {
  generateListImages();
  res.send("La liste des images a été régénérée.");
});



const usersFilePath = path.join(__dirname, 'utilisateur.json');

app.post('/saveUser', (req, res) => {
    const newUsers = req.body;

    fs.writeFile(usersFilePath, JSON.stringify(newUsers, null, 2), (err) => {
        if (err) {
            console.error("Erreur lors de l'enregistrement des utilisateurs :", err);
            return res.status(500).json({ message: "Erreur lors de l'enregistrement des utilisateurs." });
        }
        res.status(200).json({ message: "Utilisateur enregistré avec succès." });
    });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log("server démaré sur http://localhost:3000");
});