// Get window dimensions
const width = window.innerWidth;
const height = window.innerHeight;

// Initialize data structures
let artistData = {};
let genreData = {};
let countryData = {};
let currentGenre = '';
let currentYear = '';

// The svg
const svg = d3.select("svg")
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

function drawMap(worldData) {
    try {
        mapGroup.selectAll("path")
            .data(worldData.features)
            .enter()
            .append("path")
            .attr("fill", "#b8b8b8")
            .attr("d", path)
            .style("stroke", "#fff")
            .style("stroke-width", 0.5)
            .style("opacity", .7);
    } catch (error) {
        console.error("Error drawing map:", error);
    }
}

function updateBubbles() {
    try {
        // Remove existing bubbles
        bubbleGroup.selectAll("circle").remove();

        if (!genreData[currentGenre] || !genreData[currentGenre][currentYear]) {
            console.error("No data for current selection:", currentGenre, currentYear);
            return;
        }

        // Calculate max value for scaling
        let maxValue = 0;
        Object.values(genreData[currentGenre][currentYear]).forEach(value => {
            maxValue = Math.max(maxValue, value);
        });

        // Scale for bubble size
        const bubbleScale = d3.scaleSqrt()
            .domain([1, maxValue])
            .range([5, 50]);

        // Add new bubbles
        Object.entries(genreData[currentGenre][currentYear]).forEach(([country, value]) => {
            const coords = countryCorrections[country] || getCountryCenter(country);
            if (coords) {
                const [x, y] = projection(coords);
                
                bubbleGroup.append("circle")
                    .attr("cx", x)
                    .attr("cy", y)
                    .attr("r", bubbleScale(value))
                    .style("fill", "red")
                    .style("opacity", 0.6)
                    .style("stroke", "white")
                    .style("stroke-width", 1)
                    .on("mouseover", function() {
                        tooltip.transition()
                            .duration(200)
                            .style("opacity", .9);
                        tooltip.html(`${country}<br/>${value} artists`)
                            .style("left", (d3.event.pageX + 10) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");
                    })
                    .on("mouseout", function() {
                        tooltip.transition()
                            .duration(500)
                            .style("opacity", 0);
                    });
            }
        });

        // Update title
        svg.selectAll(".map-title").remove();
        svg.append("text")
            .attr("class", "map-title")
            .attr("text-anchor", "end")
            .style("fill", "black")
            .attr("x", width - 40)
            .attr("y", height - 30)
            .attr("width", 90)
            .html(`${currentGenre} Artists (${currentYear})`)
            .style("font-size", width/60)
            .style("font-family", "Arial");
    } catch (error) {
        console.error("Error updating bubbles:", error);
    }
}

function getCountryCenter(country) {
    return countryCorrections[country] || null;
}

// Load data files using d3.queue
d3.queue()
    .defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
    .defer(d3.json, "../../data/Timothee.json")
    .defer(d3.json, "../../data/Guillaume.json")
    .await(function(error, worldData, timotheeData, guillaumeData) {
        if (error) {
            console.error("Error loading data:", error);
            return;
        }

        console.log("Data loaded successfully");
        
        // Process Timothee's data
        if (Array.isArray(timotheeData)) {
            timotheeData.forEach(artist => {
                if (artist.location && artist.location.country) {
                    artistData[artist.name] = artist.location.country;
                }
            });
        }

        // Process Guillaume's data
        Object.entries(guillaumeData).forEach(([key, value]) => {
            const cleanKey = key.replace(/[()'\s]/g, '');
            const [genre, year] = cleanKey.split(',');
            
            if (!genreData[genre]) {
                genreData[genre] = {};
            }
            if (!genreData[genre][year]) {
                genreData[genre][year] = {};
            }

            if (Array.isArray(value) && value[1]) {
                Object.entries(value[1]).forEach(([artist, count]) => {
                    const country = artistData[artist];
                    if (country) {
                        if (!genreData[genre][year][country]) {
                            genreData[genre][year][country] = 0;
                        }
                        genreData[genre][year][country] += count;
                    }
                });
            }
        });

        const genres = Object.keys(genreData);
        if (genres.length === 0) {
            console.error("No genres found in processed data");
            return;
        }

        const years = Object.keys(genreData[genres[0]] || {});
        if (years.length === 0) {
            console.error("No years found for first genre");
            return;
        }

        // Populate select dropdowns
        d3.select("#genreSelect")
            .selectAll("option")
            .data(genres)
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);

        d3.select("#yearSelect")
            .selectAll("option")
            .data(years)
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);

        // Set initial values
        currentGenre = genres[0];
        currentYear = years[0];

        // Draw initial map
        drawMap(worldData);
        updateBubbles();

        // Add event listeners
        d3.select("#genreSelect").on("change", function() {
            currentGenre = this.value;
            updateBubbles();
        });

        d3.select("#yearSelect").on("change", function() {
            currentYear = this.value;
            updateBubbles();
        });
    });

// Handle window resize
window.addEventListener('resize', function() {
    location.reload();
});