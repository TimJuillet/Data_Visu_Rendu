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

function updateYearOptions(genre) {
    try {
        const availableYears = Object.keys(genreData[genre] || {})
            .filter(year => Object.keys(genreData[genre][year]).length > 0)
            .sort();

        console.log(`Available years for ${genre}:`, availableYears);

        const yearSelect = d3.select("#yearSelect");
        yearSelect.selectAll("option").remove();
        
        yearSelect
            .selectAll("option")
            .data(availableYears)
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);

        if (availableYears.length > 0) {
            currentYear = availableYears[0];
            yearSelect.property("value", currentYear);
            updateBubbles();
        }
    } catch (error) {
        console.error("Error updating year options:", error);
    }
}

function updateBubbles() {
    try {
        // Nettoyer les bulles existantes
        bubbleGroup.selectAll("circle").remove();

        const yearData = genreData[currentGenre]?.[currentYear];
        if (!yearData) {
            console.error("No data for", currentGenre, currentYear);
            return;
        }

        console.log(`Updating bubbles for ${currentGenre} - ${currentYear}`, yearData);

        // Créer les données pour les bulles
        const bubbleData = Object.entries(yearData)
            .map(([country, value]) => ({
                country,
                value,
                coordinates: countryCorrections[country] || null
            }))
            .filter(d => d.coordinates !== null);

        // Calculate max value for scaling
        const maxValue = d3.max(bubbleData, d => d.value);

        // Scale for bubble size
        const bubbleScale = d3.scaleSqrt()
            .domain([1, maxValue])
            .range([5, 50]);

        // Add new bubbles
        bubbleGroup.selectAll("circle")
            .data(bubbleData)
            .enter()
            .append("circle")
            .attr("cx", d => projection(d.coordinates)[0])
            .attr("cy", d => projection(d.coordinates)[1])
            .attr("r", d => bubbleScale(d.value))
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

        console.log("Bubbles updated successfully");
    } catch (error) {
        console.error("Error updating bubbles:", error);
    }
}

// Chargement des données avec d3.queue
d3.queue()
    .defer(d3.json, "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json")
    .defer(d3.json, "../../data/Timothee.json")
    .defer(d3.json, "../../data/Guillaume.json")
    .await(function(error, world, timotheeData, guillaumeData) {
        if (error) {
            console.error("Error loading data:", error);
            return;
        }

        console.log("Data loaded, processing...");

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

            console.log("Map drawn successfully");

            // 1. Traiter les données de Timothee
            timotheeData.forEach(entry => {
                if (entry.location?.country) {
                    artistData[entry.name] = entry.location.country;
                }
            });
            console.log("Processed artists:", Object.keys(artistData).length);

            // 2. Traiter les données de Guillaume
            Object.entries(guillaumeData).forEach(([key, value]) => {
                const match = key.match(/\('([^']+)',\s*'(\d+)'\)/);
                if (!match) return;

                const [, mainGenre, year] = match;
                console.log(`Processing ${mainGenre} - ${year}`);
                
                if (!genreData[mainGenre]) {
                    genreData[mainGenre] = {};
                }
                if (!genreData[mainGenre][year]) {
                    genreData[mainGenre][year] = {};
                }

                // Traiter les données des artistes (dans value[2])
                const artistReleases = value[2];
                if (artistReleases) {
                    Object.entries(artistReleases).forEach(([artist, releases]) => {
                        const country = artistData[artist];
                        if (country) {
                            if (!genreData[mainGenre][year][country]) {
                                genreData[mainGenre][year][country] = 0;
                            }
                            genreData[mainGenre][year][country] += releases;
                        }
                    });
                }
            });

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