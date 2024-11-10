// Chargement des données avec d3.queue
d3.queue()
    .defer(d3.json, "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json")
    .defer(d3.json, "../../data/Guillaume2.json")
    .await(function(error, world, guillaumeData) {
        if (error) {
            console.error("Error loading data:", error);
            return;
        }

        console.log("Data loaded, processing...");

        try {
            const countries = topojson.feature(world, world.objects.countries);
            // Conversion de la chaîne JSON en objet JavaScript
            let jsonData = JSON.parse(guillaumeData);

            // Dictionnaire cible
            let result = {};

            // Transformation des données
            for (let pays in jsonData) {
                if(countries.includes(pays)){
                    result[pays] = {}; // Création de l'objet pour chaque pays
                    for (let genre in jsonData[pays]) {
                        for (let annee in jsonData[pays][genre]) {
                            let nbMusique = jsonData[pays][genre][annee][0]; // Le nombre de musiques est le premier élément du tableau
                            // Initialisation de l'année dans result[pays] si elle n'existe pas encore
                            if (!result[pays][annee]) {
                                result[pays][annee] = {};
                            }
                            // Ajout du genre et du nombre de musiques
                            result[pays][annee][genre] = nbMusique;
                        }
                    }
                }
            }


            // Filtrer les genres avec des données
            const availableGenres = Object.keys(genreData).filter(genre =>
                Object.keys(genreData[genre]).some(year =>
                    Object.keys(genreData[genre][year]).length > 0
                )
            );
            console.log("Available genres:", availableGenres);

            if (availableGenres.length === 0) {
                throw new Error("No genres found with data");
            }

            // Populate genre dropdown
            d3.select("#genreSelect")
                .selectAll("option")
                .data(availableGenres)
                .enter()
                .append("option")
                .text(d => d)
                .attr("value", d => d);

            // Set initial genre and year
            currentGenre = availableGenres[0];
            d3.select("#genreSelect").property("value", currentGenre);

            // Update year options and draw bubbles
            updateYearOptions(currentGenre);

            // Add event listeners
            d3.select("#genreSelect").on("change", function() {
                currentGenre = this.value;
                updateYearOptions(currentGenre);
            });

            d3.select("#yearSelect").on("change", function() {
                currentYear = this.value;
                updateBubbles();
            });

        } catch (error) {
            console.error("Error processing data:", error);
        }
    });

// Handle window resize
window.addEventListener('resize', function() {
    location.reload();
});