# Data Visualisation - Rendu

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
- Country correction correspond à la position de la bulle des pays sur la carte. Pour cela, j'ai d'abord calculé le centre des pays en me servant de la carte qui est un svg. J'ai affiché les points et vu que ca ne marchait pas pour certains pays comme la France a cause des territoires outre-mer. Pour les pays avec des erreurs, j'ai appliqué une correction manuelle. J'ai ensuite sauvegardé toutes les positions.
- Le fichier bubble.js correspond à la visualisation de la bubble map. seul que j'ai codé. Les version 2 et 3 correspondent à la bubble avant les liens vers les autres visualisations.
- Ajout d'animations sur les bulles lors du changement des données.
- Ajout d'animation sur les bulles quand on passe la souris dessus, pour comprendre que l'on peut cliquer dessus.

### Sayf Eddine Halmi :

- Un graphe multi-lignes indiquant l'évolution du nombre de genres par année.
- En partant du fichier Guillaume2.json, j'ai créé un fichier 'summary.csv' mieux adapté à mon besoin qui continent uniquement les information dont j'ai besoin : un tableau country|year|genre|nbSongs. C'est à partir de ce fichier que je crée mon graphe, en veillant à corriger les valeurs des pays à partir des données du fichier countryMapping.js. J'ai également ajouté des lignes qui correspondent à la somme de toutes les données sur les années et les genres afin de modéliser l'évolution global des genres à travers le temps.
- Ma visualisation est un graphe multi-lignes, j'ai utilisé la librairie d3.js pour la réaliser. J'ai également ajouté des tooltips pour rendre la visualisation plus dynamique. Par exemple, en passant la souris sur un point de donnée, on peut voir le nombre de chansons pour le pays, l'année et le genre correspondants. J'ai également ajouté une liaison au travail réalisé par Guillaume : un clic sur une année de l'axe x permet d'afficher un donut de la répatition des genres en % pour l'année en question.
- Dans cette visualisation on retrouve 3 filtres. Le premier est pour les pays, afin de ne pas surcharger le graphe le nombre de pays maximal pouvant être visualisé a été fixé à 5 (cette limite peut être ajustée ou supprimmée dans le code si on se rend compte par la suite qu'elle n'est pas utile). On peut également choisir de voir la/les courbes de somme de tous les pays en choisissant "World". Le deuxième est un filtre sur les genre, on peut choisir de voir un, plusieurs ou tous les genres. Et enfin un filtre sur le temps : l'intervalle dans lequel on cherche à visualiser les données (on essaie de garder des intervalles de tailles au moins 6 ans aussi souvent que possible).
- Afin de permettre des manipulations rapides, le filtre de genre dispose d'options Select All et Deselect All pour en faciliter l'usage.
- Pour l'intervalle de temps, j'ai ajouté une option d'auto-fit qui permet de choisir automatiquement l'intervalle de temps en fonction des données disponibles : de la première apparition à la plus récente pour les genres selectionnés dans les pays chosis.