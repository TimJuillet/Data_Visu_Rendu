// Afficher un indicateur de chargement pendant le chargement des données
function showLoader() {
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.textContent = 'Chargement...';
    document.body.appendChild(loader);
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.remove();
    }
}

// Fonction pour récupérer les paramètres de l'URL
function getUrlParams() {
    const params = {};
    const queryString = window.location.search.slice(1);
    const pairs = queryString.split('&');

    pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });

    return params;
}

// Récupérer les paramètres de l'URL
const urlParams = getUrlParams();
const defaultGenre = urlParams['genre'] || 'Tout'; // 'Tout' par défaut si aucun genre n'est spécifié
const defaultYear = urlParams['year'] || 'Tout'; // 'Tout' par défaut si aucune année n'est spécifiée

// Initialisation des variables pour la liste des mots exclus
let excludedWords = new Set();

// Fonction pour mettre à jour l'affichage des mots exclus
function updateExcludedWordsDisplay() {
    const excludedContainer = document.getElementById('excluded-words');
    excludedContainer.innerHTML = ''; // Vide l'affichage précédent

    excludedWords.forEach(word => {
        const wordElement = document.createElement('span');
        wordElement.textContent = word;
        wordElement.classList.add('excluded-word');
        wordElement.style.margin = '5px';
        wordElement.style.padding = '3px 8px';
        wordElement.style.border = '1px solid #ccc';
        wordElement.style.borderRadius = '10px';
        wordElement.style.backgroundColor = '#f9f9f9';
        wordElement.style.cursor = 'pointer';
        wordElement.onclick = () => {
            excludedWords.delete(word);
            updateExcludedWordsDisplay();
            updateWordCloud(); // Met à jour le word cloud directement
        };
        excludedContainer.appendChild(wordElement);
    });
}

// Charger le fichier JSON avec les données des mots
showLoader(); // Affiche le loader
console.time("Chargement des données JSON");
d3.json("../../data/data_mots.json").then(data => {
    console.timeEnd("Chargement des données JSON");
    hideLoader(); // Cache le loader après le chargement

    console.time("Initialisation de l'application");
    const genreSelect = document.getElementById('genre');
    const anneeSelect = document.getElementById('annee');

    // Utiliser un genre similaire si `defaultGenre` n'existe pas dans les données
    let currentGenre = defaultGenre;
    const similarGenres = Object.keys(data).filter(genre => genre.includes(defaultGenre));
    if (similarGenres.length > 0) {
        currentGenre = similarGenres[0];
    } else {
        currentGenre = 'Tout'; // Utiliser 'Tout' par défaut si aucun genre similaire n'est trouvé
    }

    // Vérifier si l'année par défaut existe dans les données pour le genre sélectionné
    let currentAnnee = defaultYear;
    if (currentGenre !== 'Tout' && !Object.keys(data[currentGenre] || {}).includes(defaultYear)) {
        currentAnnee = 'Tout'; // Choisir 'Tout' si l'année n'existe pas
    }

    // Remplir les options de genre et d'année
    console.time("Remplissage des options de genre et d'année");
    const genres = Object.keys(data);
    const anneesSet = new Set();

    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        if (genre === currentGenre) {
            option.selected = true; // Sélectionne l'option par défaut
        }
        genreSelect.appendChild(option);

        // Ajouter les années au set
        Object.keys(data[genre]).forEach(annee => anneesSet.add(annee));
    });

    // Ajouter l'option "Tout" au début
    const toutOptionGenre = document.createElement('option');
    toutOptionGenre.value = 'Tout';
    toutOptionGenre.textContent = 'Tout';
    if (currentGenre === 'Tout') {
        toutOptionGenre.selected = true;
    }
    genreSelect.insertBefore(toutOptionGenre, genreSelect.firstChild);

    // Remplir les options d'années
    const annees = Array.from(anneesSet).sort();
    annees.forEach(annee => {
        const option = document.createElement('option');
        option.value = annee;
        option.textContent = annee;
        if (annee === currentAnnee) {
            option.selected = true; // Sélectionne l'année par défaut
        }
        anneeSelect.appendChild(option);
    });

    // Ajouter l'option "Tout" pour les années
    const toutOptionAnnee = document.createElement('option');
    toutOptionAnnee.value = 'Tout';
    toutOptionAnnee.textContent = 'Tout';
    if (currentAnnee === 'Tout') {
        toutOptionAnnee.selected = true;
    }
    anneeSelect.insertBefore(toutOptionAnnee, anneeSelect.firstChild);

    // Mettre à jour les couleurs des options
    updateOptionBackgrounds(genreSelect, defaultGenre);
    updateOptionBackgrounds(anneeSelect, defaultYear);

    // Mettre à jour la couleur des sélecteurs
    updateSelectBackgrounds();

    console.timeEnd("Remplissage des options de genre et d'année");
    console.timeEnd("Initialisation de l'application");

    // Fonction pour mettre à jour les couleurs des options
    function updateOptionBackgrounds(selectElement, defaultValue) {
        const options = selectElement.options;
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            // Forcer la couleur de fond à blanc
            option.style.backgroundColor = 'white';
            // Vérifier si l'option correspond
            if (defaultValue !== 'Tout' && option.value.toLowerCase().includes(defaultValue.toLowerCase())) {
                option.style.backgroundColor = 'lightblue'; // Surligner les options correspondantes
            }
        }
    }

    // Fonction pour mettre à jour la couleur de fond des sélecteurs
    function updateSelectBackgrounds() {
        // Mettre à jour le genreSelect
        if (defaultGenre !== 'Tout' && genreSelect.value.toLowerCase().includes(defaultGenre.toLowerCase())) {
            genreSelect.style.backgroundColor = 'lightblue';
        } else {
            genreSelect.style.backgroundColor = 'white'; // Forcer à blanc si non correspondant
        }

        // Mettre à jour le anneeSelect
        if (defaultYear !== 'Tout' && anneeSelect.value.includes(defaultYear)) {
            anneeSelect.style.backgroundColor = 'lightblue';
        } else {
            anneeSelect.style.backgroundColor = 'white'; // Forcer à blanc si non correspondant
        }
    }

    // Fonction pour mettre à jour le Word Cloud
    function updateWordCloud() {
        console.time("Mise à jour du Word Cloud");
        const selectedGenre = genreSelect.value;
        const selectedAnnee = anneeSelect.value;
        let mots = {};

        console.log("Genre sélectionné :", selectedGenre);
        console.log("Année sélectionnée :", selectedAnnee);

        if (selectedGenre === 'Tout' && selectedAnnee === 'Tout') {
            // Combiner toutes les données
            for (const genre in data) {
                for (const annee in data[genre]) {
                    mots = combineWordCounts(mots, data[genre][annee]);
                }
            }
        } else if (selectedGenre === 'Tout') {
            // Combiner les données pour une année spécifique
            for (const genre in data) {
                if (data[genre][selectedAnnee]) {
                    mots = combineWordCounts(mots, data[genre][selectedAnnee]);
                }
            }
        } else if (selectedAnnee === 'Tout') {
            // Combiner les données pour un genre spécifique
            for (const annee in data[selectedGenre]) {
                mots = combineWordCounts(mots, data[selectedGenre][annee]);
            }
        } else {
            // Données pour un genre et une année spécifiques
            mots = data[selectedGenre][selectedAnnee] || {};
        }

        console.log("Nombre de mots trouvés :", Object.keys(mots).length);

        // Filtrer les mots exclus
        mots = Object.fromEntries(Object.entries(mots).filter(([word]) => !excludedWords.has(word)));

        // Afficher un message s'il n'y a pas de mots
        if (Object.keys(mots).length === 0) {
            d3.select("#wordcloud").selectAll("*").remove();
            d3.select("#wordcloud").append("p").text("Aucune donnée disponible pour cette sélection.").style("color", "red");
            console.timeEnd("Mise à jour du Word Cloud");
            return;
        }

        // Créer un tableau de mots avec leurs tailles
        const words = Object.keys(mots).map(word => ({ text: word, size: mots[word] }));
        console.log("Tableau de mots pour le Word Cloud :", words);

        // Limiter le nombre de mots pour améliorer la performance
        const limitedWords = words.sort((a, b) => b.size - a.size).slice(0, 500); // Trie les mots par fréquence décroissante

        // Recalculer la taille maximale après l'exclusion de mots
        const maxFrequency = d3.max(limitedWords, d => d.size);
        // Calculer la somme des occurrences et la moyenne pour estimer un facteur de normalisation
        const totalOccurrences = d3.sum(limitedWords, d => d.size);
        const averageSize = totalOccurrences / limitedWords.length;

        // Échelle pour normaliser la taille des mots afin que le word cloud reste cohérent en taille
        const normalizationFactor = 4; // Ajuste cette valeur pour modifier l'échelle globale du word cloud
        const sizeScale = d3.scaleLinear()
            .domain([1, maxFrequency])
            .range([2, (normalizationFactor / averageSize) * maxFrequency]); // Ajuster la taille max dynamiquement

        // Dessiner le Word Cloud
        d3.select("#wordcloud").selectAll("*").remove();
        console.log("Début de la création du Word Cloud");
        d3.layout.cloud()
            .size([800, 400]) // Changez ici pour ajuster la taille du word cloud
            .words(limitedWords.map(d => ({ ...d, size: sizeScale(d.size) }))) // Applique l'échelle de taille proportionnelle
            .padding(1)
            .rotate(() => ~~(Math.random() * 2) * 90)
            .font("Impact")
            .fontSize(d => d.size)
            .on("end", draw)
            .start();

        function draw(words) {
            console.log("Dessiner les mots :", words);
            d3.select("#wordcloud").append("svg")
                .attr("width", 800) // Changez ici pour ajuster la taille du word cloud
                .attr("height", 400) // Changez ici pour ajuster la taille du word cloud
                .append("g")
                .attr("transform", "translate(400,200)")
                .selectAll("text")
                .data(words)
                .enter().append("text")
                .style("font-size", d => d.size + "px")
                .style("font-family", "Impact")
                .style("fill", (d, i) => d3.schemeCategory10[i % 10])
                .attr("text-anchor", "middle")
                .attr("transform", d => "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")")
                .text(d => d.text)
                .on("click", function(event, d) {
                    excludedWords.add(d.text);
                    updateExcludedWordsDisplay();
                    updateWordCloud();
                });
            console.log("Fin de la création du Word Cloud");
        }

        console.timeEnd("Mise à jour du Word Cloud");
    }

    // Ajouter des événements aux sélecteurs
    genreSelect.addEventListener('change', () => {
        updateSelectBackgrounds();
        updateWordCloud();
    });
    anneeSelect.addEventListener('change', () => {
        updateSelectBackgrounds();
        updateWordCloud();
    });

    // Fonction utilitaire pour combiner des comptes de mots
    function combineWordCounts(obj1, obj2) {
        for (const key in obj2) {
            obj1[key] = (obj1[key] || 0) + obj2[key];
        }
        return obj1;
    }

    // Initialiser le Word Cloud
    updateWordCloud();
}).catch(error => {
    hideLoader();
    console.error("Erreur de chargement des données :", error);
});
