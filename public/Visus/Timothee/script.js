// Get window dimensions
const width = window.innerWidth;
const height = window.innerHeight;

// Initialize data structures
let artistData = {};
let genreData = {};
let currentGenre = '';
let currentYear = '';

// The svg
const svg = d3.select("#my_dataviz")
    .attr("width", width)
    .attr("height", height);

// Create a group for the map and bubbles
const mapGroup = svg.append("g");
const bubbleGroup = svg.append("g");

// Add tooltip
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

// Map and projection
const projection = d3.geoMercator()
    .center([10, 20])
    .scale(width/7)
    .translate([width/2, height/2]);

// Path generator
const path = d3.geoPath()
    .projection(projection);

// Manual corrections for specific countries
const countryCorrections = {
    "United States of America": [-95, 40],
    "Canada": [-95, 55],
    "Russia": [100, 60],
    "France": [2, 47],
    "Norway": [10, 62],
    "Denmark": [10, 56],
    "United Kingdom": [-2, 54],
    "China": [105, 35],
    "Brazil": [-55, -10],
};

function hasDisplayableData(genre, year) {
    if (!genreData[genre] || !genreData[genre][year]) return false;
    
    return Object.entries(genreData[genre][year]).some(([country, value]) => {
        return value > 0 && (countryCorrections[country] !== undefined);
    });
}

function updateYearSlider(genre) {
    try {
        // Obtenir les années disponibles pour ce genre
        const availableYears = Object.keys(genreData[genre] || {})
            .filter(year => hasDisplayableData(genre, year))
            .map(Number)
            .sort((a, b) => a - b);

        console.log(`Available years for ${genre}:`, availableYears);

        if (availableYears.length === 0) {
            console.log(`No available years found for genre ${genre}`);
            return;
        }

        // Configurer le slider
        const slider = d3.select("#yearSlider");
        const yearDisplay = d3.select("#year-display");

        // Stockage des années disponibles dans un attribut du slider
        slider.node().availableYears = availableYears;

        // Définir la valeur initiale
        if (!currentYear || !availableYears.includes(Number(currentYear))) {
            currentYear = availableYears[0];
        }

        // Configurer le slider
        slider
            .attr("min", 0)
            .attr("max", availableYears.length - 1)
            .attr("step", 1)
            .attr("value", availableYears.indexOf(Number(currentYear)));

        // Mettre à jour l'affichage de l'année
        yearDisplay.text(currentYear);

        // Gestionnaire d'événements pour le slider
        slider.on("input", function() {
            const availableYears = this.availableYears;
            const index = parseInt(this.value);
            currentYear = availableYears[index];
            yearDisplay.text(currentYear);
            updateBubbles();
        });

        // Mettre à jour les bulles
        updateBubbles();

    } catch (error) {
        console.error("Error updating year slider:", error);
    }
}

function updateBubbles() {
    try {
        // Nettoyer les bulles existantes et la légende
        bubbleGroup.selectAll("circle").remove();
        svg.selectAll(".legend").remove();

        const yearData = genreData[currentGenre]?.[currentYear];
        if (!yearData) {
            console.error("No data for", currentGenre, currentYear);
            return;
        }

        // Créer les données pour les bulles
        const bubbleData = Object.entries(yearData)
            .map(([country, value]) => ({
                country,
                value,
                coordinates: countryCorrections[country] || null
            }))
            .filter(d => d.coordinates !== null);

        // Échelle fixe commune pour les bulles et la légende
        const fixedScale = d3.scaleSqrt()
            .domain([1, 300])  // Changé de 1000 à 300
            .range([5, 50]);

        // Add new bubbles en utilisant l'échelle fixe
        bubbleGroup.selectAll("circle")
            .data(bubbleData)
            .enter()
            .append("circle")
            .attr("cx", d => projection(d.coordinates)[0])
            .attr("cy", d => projection(d.coordinates)[1])
            .attr("r", d => fixedScale(Math.min(d.value, 300))) // Limite à 300
            .style("fill", "red")
            .style("opacity", 0.6)
            .style("stroke", "white")
            .style("stroke-width", 1)
            .on("mouseover", function(d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`${d.country}<br/>${d.value} releases`)
                    .style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Nouvelles valeurs pour la légende
        const valuesToShow = [1, 50, 300];

        // Paramètres de position pour la légende
        const legendGroup = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(20, ${height - 150})`);

        const xCircle = 60;
        const xLabel = 150;
        const yCircle = 100;

        // Ajouter le titre de la légende
        legendGroup.append("text")
            .attr("x", xCircle - 20)
            .attr("y", -10)
            .text("Number of releases")
            .style("font-size", "12px")
            .style("font-weight", "bold");

        // Ajouter les cercles de la légende
        legendGroup.selectAll("legend-circles")
            .data(valuesToShow)
            .enter()
            .append("circle")
            .attr("cx", xCircle)
            .attr("cy", d => yCircle - fixedScale(d))
            .attr("r", d => fixedScale(d))
            .style("fill", "none")
            .style("stroke", "black")
            .style("opacity", 0.8);

        // Ajouter les lignes de la légende
        legendGroup.selectAll("legend-lines")
            .data(valuesToShow)
            .enter()
            .append("line")
            .attr("x1", d => xCircle + fixedScale(d))
            .attr("x2", xLabel)
            .attr("y1", d => yCircle - fixedScale(d))
            .attr("y2", d => yCircle - fixedScale(d))
            .style("stroke", "black")
            .style("stroke-dasharray", "2,2");

        // Ajouter les labels de la légende
        legendGroup.selectAll("legend-labels")
            .data(valuesToShow)
            .enter()
            .append("text")
            .attr("x", xLabel + 5)
            .attr("y", d => yCircle - fixedScale(d))
            .text(d => d)
            .style("font-size", "11px")
            .attr("alignment-baseline", "middle");

        const unknownCount = yearData.unknownCount || 0;
        
        // Ajouter le texte des données inconnues
        legendGroup.append("text")
            .attr("x", xLabel + 60)  // Positionné à droite de la légende
            .attr("y", yCircle - fixedScale(valuesToShow[1]))  // Aligné avec le cercle du milieu
            .text(`Releases from unknown country: ${unknownCount}`)
            .style("font-size", "12px")
            .style("fill", "black");

        // Update title
        svg.selectAll(".map-title").remove();
        svg.append("text")
            .attr("class", "map-title")
            .attr("text-anchor", "end")
            .style("fill", "black")
            .attr("x", width - 40)
            .attr("y", height - 30)
            .attr("width", 90)
            .html(`${currentGenre} Releases (${currentYear})`)
            .style("font-size", width/60)
            .style("font-family", "Arial");

    } catch (error) {
        console.error("Error updating bubbles:", error);
    }
}

// Chargement des données
d3.queue()
    .defer(d3.json, "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json")
    .defer(d3.json, "../../data/Timothee.json")
    .defer(d3.json, "../../data/Guillaume.json")
    .await(function(error, world, timotheeData, guillaumeData) {
        if (error) {
            console.error("Error loading data:", error);
            return;
        }

        try {
            // Convertir les données du monde en features GeoJSON
            const countries = topojson.feature(world, world.objects.countries);
            
            // Dessiner la carte de base
            mapGroup.selectAll("path")
                .data(countries.features)
                .enter()
                .append("path")
                .attr("fill", "#b8b8b8")
                .attr("d", path)
                .style("stroke", "#fff")
                .style("stroke-width", 0.5)
                .style("opacity", .7);

            // 1. Traiter les données de Timothee
            timotheeData.forEach(entry => {
                if (entry.location?.country) {
                    artistData[entry.name] = entry.location.country;
                }
            });

            // 2. Traiter les données de Guillaume
            Object.entries(guillaumeData).forEach(([key, value]) => {
                const match = key.match(/\('([^']+)',\s*'(\d+)'\)/);
                if (!match) return;
            
                const [, mainGenre, year] = match;
                
                if (!genreData[mainGenre]) {
                    genreData[mainGenre] = {};
                }
                if (!genreData[mainGenre][year]) {
                    genreData[mainGenre][year] = {};
                    genreData[mainGenre][year].unknownCount = 0; // Initialiser le compteur unknown
                }
            
                // Traiter les données des artistes (dans value[2])
                const artistReleases = value[2];
                if (artistReleases) {
                    Object.entries(artistReleases).forEach(([artist, releases]) => {
                        const country = artistData[artist];
                        if (!country || country === "") {
                            // Ajouter au compteur unknown
                            genreData[mainGenre][year].unknownCount += releases;
                        } else if (countryCorrections[country]) {
                            if (!genreData[mainGenre][year][country]) {
                                genreData[mainGenre][year][country] = 0;
                            }
                            genreData[mainGenre][year][country] += releases;
                        }
                    });
                }
                                // Supprimer les années sans données affichables
                if (!hasDisplayableData(mainGenre, year)) {
                    delete genreData[mainGenre][year];
                }
            });

            // Filtrer les genres avec des données
            // Filtrer et trier les genres alphabétiquement
            const availableGenres = Object.keys(genreData)
                .filter(genre => 
                    Object.keys(genreData[genre]).some(year => 
                        Object.keys(genreData[genre][year]).length > 0
                    )
                )
                .sort((a, b) => a.localeCompare(b, 'fr', {sensitivity: 'base'})); // Tri alphabétique insensible à la casse

            if (availableGenres.length === 0) {
                throw new Error("No genres found with data");
            }

            console.log("Available sorted genres:", availableGenres);

            // Populate genre dropdown with sorted genres
            d3.select("#genreSelect")
                .selectAll("option")
                .data(availableGenres)
                .enter()
                .append("option")
                .text(d => d)
                .attr("value", d => d);

            // Set initial genre and update slider
            currentGenre = availableGenres[0];
            d3.select("#genreSelect").property("value", currentGenre);
            updateYearSlider(currentGenre);

            // Add event listener for genre change
            d3.select("#genreSelect").on("change", function() {
                currentGenre = this.value;
                updateYearSlider(currentGenre);
            });

        } catch (error) {
            console.error("Error processing data:", error);
        }
    });

// Handle window resize
window.addEventListener('resize', function() {
    location.reload();
});