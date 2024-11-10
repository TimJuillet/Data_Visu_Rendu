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

function hasDisplayableData(genre, year) {
    if (!genreData[genre] || !genreData[genre][year]) return false;
    
    const yearData = genreData[genre][year];
    const hasDisplayableCountries = Object.entries(yearData.byCountry).some(([country]) => {
        return countryCorrections[country] !== undefined;
    });
    
    return hasDisplayableCountries || yearData.unknownCount > 0;
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

        updateBubbles();

    } catch (error) {
        console.error("Error updating year slider:", error);
    }
}

function updateBubbles() {
    try {
        svg.selectAll(".legend").remove();

        const yearData = genreData[currentGenre]?.[currentYear];
        if (!yearData) {
            console.error("No data for", currentGenre, currentYear);
            return;
        }

        // Créer les données pour les bulles
        const bubbleData = Object.entries(yearData.byCountry)
            .map(([country, value]) => ({
                country,
                value,
                coordinates: countryCorrections[country] || null,
                id: country // Pour la correspondance des données pendant la transition
            }))
            .filter(d => d.coordinates !== null);

        // Échelle fixe commune pour les bulles et la légende
        const fixedScale = d3.scaleSqrt()
            .domain([1, 5000])
            .range([3, 70]);

        // Update existing and add new bubbles with transitions
        const circles = bubbleGroup.selectAll("circle")
            .data(bubbleData, d => d.id);

        // Remove old bubbles with transition
        circles.exit()
            .transition()
            .duration(1000)
            .attr("r", 0)
            .style("opacity", 0)
            .remove();

        // Add new bubbles
        const circlesEnter = circles.enter()
        .append("circle")
        .attr("cx", d => projection(d.coordinates)[0])
        .attr("cy", d => projection(d.coordinates)[1])
        .attr("r", 0) // Start with radius 0
        .style("fill", "red")
        .style("opacity", 0)
        .style("stroke", "white")
        .style("stroke-width", 1)
        .style("cursor", "pointer") // Ajoute la petite main au survol
        .on("mouseover", function(d) {
            // Mettre à jour le style du cercle survolé
            d3.select(this)
                .transition()
                .duration(200)
                .style("stroke", "black")
                .style("stroke-width", 3);
                
            // Afficher le tooltip
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`${d.country}<br/>${d.value} releases`)
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            // Remettre le style initial du cercle
            d3.select(this)
                .transition()
                .duration(200)
                .style("stroke", "white")
                .style("stroke-width", 1);
                
            // Cacher le tooltip
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("click", function(d) {
            const countryName = d.country.replace(/\s+/g, '-');
            const genre = encodeURIComponent(currentGenre);
            const year = currentYear;
            const url = `..\\Guillaume\\donut.html?country=${countryName}&genre=${genre}&year=${year}`;
            window.location.href = url;
        });

        // Merge enter + update selections and apply transitions
        circles.merge(circlesEnter)
            .transition()
            .duration(1000)
            .attr("cx", d => projection(d.coordinates)[0])
            .attr("cy", d => projection(d.coordinates)[1])
            .attr("r", d => fixedScale(Math.min(d.value, 1000)))
            .style("opacity", 0.6);

        // Valeurs pour la légende
        const valuesToShow = [1, 50, 300, 1000];

        // Paramètres de position pour la légende
        const legendGroup = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(20, ${height - 150})`);

        const xCircle = 60;
        const xLabel = 150;
        const yCircle = 100;

        // Ajouter le titre de la légende
        legendGroup.append("text")
            .attr("x", xCircle - 45)
            .attr("y", 20)
            .text("Number of releases")
            .style("font-size", "17px")
            .style("font-weight", "bold")
            .style("opacity", 0)
            .style("opacity", 1);

        // Ajouter les cercles de la légende
        legendGroup.selectAll("legend-circles")
            .data(valuesToShow)
            .enter()
            .append("circle")
            .attr("cx", xCircle)
            .attr("cy", d => yCircle - fixedScale(d))
            .attr("r", 0)  // Start with radius 0
            .style("fill", "none")
            .style("stroke", "black")
            .style("opacity", 0.8)
            .attr("r", d => fixedScale(d));

        // Ajouter les lignes de la légende
        legendGroup.selectAll("legend-lines")
            .data(valuesToShow)
            .enter()
            .append("line")
            .attr("x1", xCircle)
            .attr("x2", xLabel)
            .attr("y1", d => yCircle - fixedScale(d))
            .attr("y2", d => yCircle - fixedScale(d))
            .style("stroke", "black")
            .style("stroke-dasharray", "2,2")
            .style("opacity", 0)
            .attr("x1", d => xCircle + fixedScale(d))
            .style("opacity", 1);

        // Ajouter les labels de la légende
        legendGroup.selectAll("legend-labels")
            .data(valuesToShow)
            .enter()
            .append("text")
            .attr("x", xLabel + 5)
            .attr("y", d => yCircle - fixedScale(d))
            .text(d => d + "+")
            .style("font-size", "11px")
            .style("opacity", 0)
            .attr("alignment-baseline", "middle")
            .style("opacity", 1);

        // Ajouter l'information sur les données inconnues 
        legendGroup.append("text")
            .attr("x", xLabel + 60)
            .attr("y", yCircle - fixedScale(valuesToShow[1]) - 20)
            .text(`Releases from unknown countries: ${yearData.unknownCount}`)
            .style("font-size", "17px")
            .style("fill", "black")
            .style("opacity", 0)
            .style("opacity", 1);

        // Ajouter le total des releases 
        legendGroup.append("text")
            .attr("x", xLabel + 60)
            .attr("y", yCircle - fixedScale(valuesToShow[1]) + 0)
            .text(`Total releases: ${yearData.totalReleases}`)
            .style("font-size", "17px")
            .style("fill", "black")
            .style("opacity", 0)
            .style("opacity", 1);

        // Ajouter le pourcentage de données inconnues 
        const unknownPercentage = ((yearData.unknownCount / yearData.totalReleases) * 100).toFixed(1);
        legendGroup.append("text")
            .attr("x", xLabel + 60)
            .attr("y", yCircle - fixedScale(valuesToShow[1]) + 20)
            .text(`Unknown percentage: ${unknownPercentage}%`)
            .style("font-size", "17px")
            .style("fill", "black")
            .style("opacity", 0)
            .style("opacity", 1);

        // Update title with transition
        svg.selectAll(".map-title").remove();
        svg.append("text")
            .attr("class", "map-title")
            .attr("text-anchor", "end")
            .style("fill", "black")
            .attr("x", width - 40)
            .attr("y", height - 30)
            .attr("width", 90)
            .style("opacity", 0)
            .html(`${currentGenre} Releases (${currentYear})`)
            .style("font-size", width/60)
            .style("font-family", "Arial")
            .style("opacity", 1);

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

            // 1. Traiter les données de Timothee en utilisant le country_mapping
            timotheeData.forEach(entry => {
                if (entry.location?.country) {
                    const mappedCountry = country_mapping[entry.location.country];
                    if (mappedCountry) {
                        artistData[entry.name] = {
                            ...entry.location,
                            country: mappedCountry
                        };
                    }
                }
            });

            // 2. Traiter les données de Guillaume
            Object.entries(guillaumeData).forEach(([key, value]) => {
                const match = key.match(/\('([^']+)',\s*'(\d+)'\)/);
                if (!match) return;

                const [, mainGenre, year] = match;
                const totalReleases = value[0];
                const subGenres = value[1];
                const artistReleases = value[2];
                
                if (!genreData[mainGenre]) {
                    genreData[mainGenre] = {};
                }
                if (!genreData[mainGenre][year]) {
                    genreData[mainGenre][year] = {
                        byCountry: {},
                        unknownCount: 0,
                        totalReleases: totalReleases
                    };
                }

                let processedReleases = 0;
                let mappedArtists = 0;
                let unknownArtists = 0;
                
                if (artistReleases) {
                    Object.entries(artistReleases).forEach(([artist, releases]) => {
                        processedReleases += releases;
                        const artistLocation = artistData[artist];

                        if (!artistLocation || !artistLocation.country || 
                            !countryCorrections[artistLocation.country]) {
                            genreData[mainGenre][year].unknownCount += releases;
                            unknownArtists++;
                        } else {
                            const country = artistLocation.country;
                            if (!genreData[mainGenre][year].byCountry[country]) {
                                genreData[mainGenre][year].byCountry[country] = 0;
                            }
                            genreData[mainGenre][year].byCountry[country] += releases;
                            mappedArtists++;
                        }
                    });
                }

                // Si certaines releases n'ont pas été comptabilisées, les ajouter aux inconnues
                if (processedReleases < totalReleases) {
                    const difference = totalReleases - processedReleases;
                    genreData[mainGenre][year].unknownCount += difference;
                }
            });

            // Filtrer et trier les genres
            const availableGenres = Object.keys(genreData)
                .filter(genre => {
                    const hasData = Object.keys(genreData[genre]).some(year => 
                        hasDisplayableData(genre, year)
                    );
                    if (!hasData) {
                        console.log(`Genre ${genre} filtered out: no displayable data`);
                    }
                    return hasData;
                })
                .sort((a, b) => a.localeCompare(b, 'fr', {sensitivity: 'base'}));

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
            console.error("Error details:", error.stack);
        }
    });

// Handle window resize
window.addEventListener('resize', function() {
    location.reload();
});