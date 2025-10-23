# site-carte
Site uniquement en localhost => invite de commande : node server.js pour le lancer puis http://localhost:3000.
(installer node.js et node ws)


Le code n'est pas commenté parceque je suis tout seul sur le projet.

pour visiter le site : 
étape 1 : créer un compte sur la page connexion.html
étape 2 : regarder les différentes pages du header
étape 3 : comme je voulais créer un site avec une partie utilisateur et une partie pour moi créer les cartes les pages index.html planche.html et base.html ne sont pas accessibles par le header il faut donc taper leur lien dirrectement dans la barre de recherche. De plus il faut un compte administrateur pour y accéder (le comptes lockai dans le json en est un donc il suffit de se connecter dessus).

Fonctionnement des pages : 
Administrateur
index.html : La première page du site permets de créer des cartes et de les enregistrer dans la base de donnée il suffit de remplire un nom et télécharger une image pour l'illustration et vous pourrez créer une carte.
base.html : retrouver toute la base de donnée des cartes enregistrer et accéder a leur page de modification en cliquant sur l'une d'elle.
planche.html : créer un fichier pdf avec les cartes que vous voulez pour les imprimer au bon format.

Publiques :
commencer.html : pour lancer une nouvelle partie : pour ça il faut avoir créer un deck dans deck.html.
deck.html : accédez à toute la base de cartes pour créer un deck et jouer.
connexion.html : se connecter.
play.html : lancer une partie (encore en cours de développement) deux comptes différents doivent exister sur le meme localhost au meme moment pour cela. L'un d'entre eux lance une partie via commencer.html le suivant peut faire de même et le serveur vas les envoyer tout deux sur un page relier entre les deux joueurs. le jeu peux commencer : déplacer par exemple une carte de votre mains vers le terrain, le joueur adverse vois la carte apparaitre sur son écran. (Les autres zones que la zone terrain ne sont pas encore gérés par le serveur.). autre possibilités : piocher une carte consulter les cartes dans son cimetière, dans sa zone race.
