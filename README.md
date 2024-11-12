# Data Visualisation - Rendu

## Membres du groupe
- Timothée JUILLET (IA-ID)
- Guillaume ARRIGONI (IA-ID)
- Sayf Eddine HALMI (IA-ID)
- Skander MEZIOU (IA-ID)
- Loris DRID (IHM)

## Contenu

- Le dossier 'Rapports' contient pour chaque membre, la partie suivante du travail :
```
The description of the project should include : 

    A paragraph describing the users.
    The list of visual tasks supported by users and the visualization goals.
    The list of (raw) attributes you will need from the WASABI dataset you are going to use.
    The informal description of the processing of the row data in order to make it to fit in the visualization technique. This might include calculated variables you must add in the process.
    The name of visualization technique and the name of the member of the group who is going to implement it. Associate the visualization technique with the visual goal.
    A visual mapping of variables available in your data set (after data processing) and the visual variable available in the visualization technique you have chosen.
```
- Dans public/data/processing/NOM_DU_MEMBRE, vous trouverez les fichiers de traitement des données pour chaque membre du groupe.
- Dans public/Visus/NOM_DU_MEMBRE, vous trouverez les fichiers de visualisation pour chaque membre du groupe.


## Workflow des données :

![Image du Workflow](Worklow%20visualisation.drawio.png)

## Travail réalisé :

### Timothée Juillet :

- Une bubble map indiquant d'ou viennent les genres par pays pour chaque année. 
- Mon processing a permis de créer le fichier 'Timothee.json' liant les artistes à leurs pays d'origine. Je le lis au fichier 'Guillaume.json' pour faire ma visualisation.
- J'ai également créé le fichier countryMapping.js. En effet les pays indiqué dans le dataset ne correspondaient pas toujours à ceux de la cartes, voir n'étaient pas des pays du tout. De cette maniere, si le pays d'un artiste est indiqué comme "Marseille" (ce qui arrive), la donnée sera bien compté pour la France.
- J'ai également créé ountryCorrection.js. Il correspond à la position de la bulle des pays sur la carte. Pour cela, j'ai d'abord calculé le centre des pays en me servant de la carte qui est un svg. J'ai affiché les points et vu que ca ne marchait pas pour certains pays comme la France a cause des territoires outre-mer. Pour les pays avec des erreurs, j'ai appliqué une correction manuelle. J'ai ensuite sauvegardé toutes les positions.
- Le fichier bubble.js correspond à la visualisation de la bubble map. seul que j'ai codé. Les version 2 et 3 correspondent à la bubble avec les liens vers les autres visualisations.
- La valeur des données est en général assez basse, cependant pour les valeurs les plus extrêmes comme le Rock aux Etat-Unis cette valeur s'envole à parfois plus de 5000. Comme relevé à l'oral, une échelle logarithmique aurait été interessante, cependant je n'ai simplement pas pensé à cette solution. Ma solution a donc été différente : J'ai limité la taille des bulles pour les valeurs de plus de 1000. De cette maniere les plus petites restent parfaitement visibles et les plus grosses (cas très rares) ne font pas la taille de la map.
- Ajout d'animations sur les bulles lors du changement des données.
- Ajout d'animation sur les bulles quand on passe la souris dessus, pour comprendre que l'on peut cliquer dessus.
- Vous pourrez remarquer dans le workflow des données que le merge on artist name entre Timothée et Guillaume est fait 2 fois, ce qui est sous optimal. Cela est du au fait que le traitement de mes données avai déjà était fait avec les deux fichiers, et que le fichier Guillaume2 a été créé ensuite. Comme tout changer m'aurait pris trop de temps puisque les structures des fichiers ne sont pas les mêmes, et que Guillaume2 ne map pas les locations vers les pays, j'ai préféré laisser cette redondance.
- Pour les données ne possédant pas du tout de pays, je les stock et indique leur pourcentage en bas à gauche de l'écran. Ce pourcentage est très faible.
- Pour finir j'ai travaillé avec Guillaume pour faire sa transition des bubble vers ses donuts.

### Guillaume ARRIGONI :

- J'ai créé deux représentations en diagramme en anneau (ou "donut"). La première représentation est accessible en cliquant sur une bulle de la carte de la visualisation de Timothée et permet d'afficher la répartition des sous-genres pour un pays, un genre, et une année donnés. La deuxième est accessible en cliquant sur l'année de la visualisation de Sayf et affiche la répartition des principaux genres pour tous les pays sur une année spécifique.
- Dans les deux représentations, il est possible de consulter le nombre exact de morceaux de musique dans chaque section en survolant cette dernière. Afin d'éviter une surcharge visuelle dans le diagramme en anneau, tous les segments représentant moins de 2 % sont regroupés dans une nouvelle section appelée "other". L'utilisateur peut cliquer sur cette section pour afficher l'ensemble des genres ou sous-genres qu’elle contient dans une nouvelle représentation en donut. Dans cette visualisation détaillée, les segments avec une proportion inférieure à 0,3 % sont eux aussi regroupés dans une section "other" qui, cette fois, n'est pas cliquable. Cela garantit une interface claire et lisible et permet de filtrer les informations trop spécifiques pour rester pertinentes à un niveau global.
- Mon travail est donc organisé dans le dossier Visus/Guillaume, qui contient la représentation en donut des sous-genres. Certains éléments se trouvent également dans le dossier bubble2 de Visu/Timothée, pour lier les clics vers différentes pages. J'ai également contribué aux fichiers dans le dossier Visu/Sayf, qui permettent d'afficher la deuxième représentation en donut des genres principaux.
- Pour le traitement des données, j'ai développé le code pour générer les fichiers Guillaume.json, Guillaume2.json, et inverseMapping.js. Le fichier Guillaume2.json est une amélioration de Guillaume.json, avec une meilleure structure et l'ajout de données de localisation. Cependant, puisque certains travaux avaient déjà été réalisés avec Guillaume.json par d'autres camarades, le projet inclut les deux versions de représentation. Le fichier inverseMapping.js permet d’obtenir, à partir du nom d’un pays dans la carte de Timothée, toutes les localisations contenues dans le dataset de Guillaume2.json. Le code pour générer les fichiers Guillaume.json et Guillaume2.json se trouve dans data/processing/Guillaume/dataProcessingWasabi.py, et le code pour générer inverseMapping.js est dans inverseCountryMappingJS.ipynb. 
- Toujours au niveau du traitement des données, j'ai également créer les sous genres à partir des genres principaux. Cet étape avait pour but de simplifier les filtres pour les utilisateurs de manières à ce qu'ils n'aient pas plusieurs fois des genres qui sont des Rock mais qui différent parce que certains sont Folklorique, Alternative, Soft ou Hard etc...


### Sayf Eddine Halmi :

- Un graphe multi-lignes indiquant l'évolution du nombre de genres par année.
- En partant du fichier Guillaume2.json, j'ai créé un fichier 'summary.csv' mieux adapté à mon besoin qui continent uniquement les information dont j'ai besoin : un tableau country|year|genre|nbSongs. C'est à partir de ce fichier que je crée mon graphe, en veillant à corriger les valeurs des pays à partir des données du fichier countryMapping.js. J'ai également ajouté des lignes qui correspondent à la somme de toutes les données sur les années et les genres afin de modéliser l'évolution global des genres à travers le temps.
- Ma visualisation est un graphe multi-lignes, j'ai utilisé la librairie d3.js pour la réaliser. J'ai également ajouté des tooltips pour rendre la visualisation plus dynamique. Par exemple, en passant la souris sur un point de donnée, on peut voir le nombre de chansons pour le pays, l'année et le genre correspondants. J'ai également ajouté une liaison au travail réalisé par Guillaume : un clic sur une année de l'axe x permet d'afficher un donut de la répatition des genres en % pour l'année en question.
- Dans cette visualisation on retrouve 3 filtres. Le premier est pour les pays, afin de ne pas surcharger le graphe le nombre de pays maximal pouvant être visualisé a été fixé à 5 (cette limite peut être ajustée ou supprimmée dans le code si on se rend compte par la suite qu'elle n'est pas utile). On peut également choisir de voir la/les courbes de somme de tous les pays en choisissant "World". Le deuxième est un filtre sur les genre, on peut choisir de voir un, plusieurs ou tous les genres. Et enfin un filtre sur le temps : l'intervalle dans lequel on cherche à visualiser les données (on essaie de garder des intervalles de tailles au moins 6 ans aussi souvent que possible).
- Afin de permettre des manipulations rapides, le filtre de genre dispose d'options Select All et Deselect All pour en faciliter l'usage.
- Pour l'intervalle de temps, j'ai ajouté une option d'auto-fit qui permet de choisir automatiquement l'intervalle de temps en fonction des données disponibles : de la première apparition à la plus récente pour les genres selectionnés dans les pays chosis.

### Skander Meziou 

- Un word Cloud qui indique la fréquence de chaque mot par genre 
- j'ai du extraire les donées directement depuis l'api afin d'obtenir les paroles qui n'etaient pas disponibles dans la base de données utilisée par mes camarades. j'ai donc crée un fichier db.sqlite qui contiens les paroles de toutes les musiques (je n'ai pas mis le fichier dans le repository en raison de sa taille mais le code pour le generer se trouve dans mon code python qui se trouve dans "Data_Visu_Rendu\public\data\processing\SkanderMeziou.ipynb")
- apres avoir extrait les donées j'ai traité le sqlite pour creer un fichier json qui contiens pour chaque genre et chaque date le nombre d'occurences de chaque mot, ce fichier s'appelle data_mots.json et se trouve dans le dossier data, j'ai aussi blacklisté des mots trop fréquents qui apparaissaient comme etant les plus frequents dans tout les genres de musiques et pour toutes les dates ( comme I, you, and, the, par exemple)
- une fois qu'on ouvre le wordCloud, on tombe sur un genre choisi par defaut parmis tout les sous genre correspondant au genre choisi dans la bubble map, la date correspond aussi si des chansons avec paroles correspondantes ont été trouvées. je laisse quand meme a l'utilisateur l'option de changer le genre, avec tout les sous genre correspondants au genre choisi apparaissant en bleu
- l'utilisateur peut aussi decider d'exclure des mots si il le désire si certains mots sont trop encombrants 


### Loris Drid

- Un stacked bar chart qui montre la popularité des artistes par genre. 
- J'ai fait mon propre processing, avec la récupération des artistes, avec la liste de leur album qui contiennent les genres et la liste des musiques, qui elles-mêmes contiennent un rank.Pour chaque artiste, on garde le(s) genre(s) et la moyenne des rank de ses musiques.Les données sont ensuite groupées par genre, on obtient donc pour chaque genre les artistes avec leur rank moyen.
- L'utilisateur peut sélectionner jusqu'à 10 genres en même temps, pour chaque genre les 5 artistes les plus populaires sont affichés.
- Au sein d'un genre, la barre est subdivisé en 5 segments représentant les 5 artistes avec les ranks les plus populaires, chaque segment possède une hauteur correspondant à la valeur du rank de l'artiste.
- Les valeurs cumulative des rank sont affichés en ordonnée, ce qui permet de voir la différence de popularité entre les genres pour le top 5.