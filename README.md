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

![Alt text](<Worklow visualisation.drawio.png>)

## Travail réalisé :

### Timothée Juillet :

- Une bubble map indiquant d'ou viennent les genres par pays pour chaque année. 
- Mon processing a permis de créer le fichier 'Timothee.json' liant les artistes à leurs pays d'origine. 
- J'ai également créé le fichier countryMapping.js. En effet les pays indiqué dans le dataset ne correspondaient pas toujours à ceux de la cartes, voir n'étaient pas des pays du tout. De cette maniere, si le pays d'un artiste est indiqué comme "Marseille" (ce qui arrive), la donnée sera bien compté pour la France.
- Country correction correspond à la position de la bulle des pays sur la carte. Pour cela, j'ai d'abord calculé le centre des pays en me servant de la carte qui est un svg. J'ai affiché les points et vu que ca ne marchait pas pour certains pays comme la France a cause des territoires outre-mer. Pour les pays avec des erreurs, j'ai appliqué une correction manuelle. J'ai ensuite sauvegardé toutes les positions.
- Le fichier bubble.js correspond à la visualisation de la bubble map. seul que j'ai codé. Les version 2 et 3 correspondent à la bubble avant les liens vers les autres visualisations.