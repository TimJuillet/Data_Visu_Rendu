function getQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const country = urlParams.get('country');
    const genre = urlParams.get('genre');
    const year = urlParams.get('year');
    return { country, genre, year };
}

// Fonction pour dé-formater les valeurs
function formatCountry(country) {
    return country.replace(/-/g, ' '); // Remplacer les tirets par des espaces
}

window.onload = function() {
    const params = getQueryParams();

    // Dé-formater le pays et décoder le genre
    const country = formatCountry(params.country); // Récupérer le pays formaté
    const genre = decodeURIComponent(params.genre); // Décoder le genre (par exemple 'pop')
    const year = params.year; // L'année ne nécessite pas de dé-formatage
    console.log({ country, genre, year })
    document.getElementById("title").innerText = `Repartition of sub-genres of ${genre} in ${country} in ${year}`;
    updateChart(year, genre, country);
};
// Configuration initiale
var width = window.innerWidth,
    height = window.innerHeight,
    margin = 40;

var radius = Math.min(width, height) / 2 - margin;

var tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

var svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var modalWidth = Math.min(width * 0.8, 800);
var modalHeight = Math.min(height * 0.8, 600);
var modalRadius = Math.min(modalWidth, modalHeight) / 2 - margin;

var modalSvg = d3.select("#modal_dataviz")
    .append("svg")
    .attr("width", modalWidth)
    .attr("height", modalHeight)
    .append("g")
    .attr("transform", "translate(" + modalWidth / 2 + "," + modalHeight / 2 + ")");

var color = d3.scaleOrdinal(d3.schemeCategory10);
var currentData = null;
var otherData = null;
var cachedOtherData = null;
var originalPercentages = {};

function showTooltip(d, isOther = false) {
    const songs = d.data.value;

    tooltip
        .style("opacity", 1)
        .html(`${d.data.key}<br>${songs} music${songs > 1 ? 's' : ''}`)
        .style("left", (d3.event.pageX + 10) + "px")
        .style("top", (d3.event.pageY - 15) + "px");
}

function moveTooltip() {
    tooltip
        .style("left", (d3.event.pageX + 10) + "px")
        .style("top", (d3.event.pageY - 15) + "px");
}

function hideTooltip() {
    tooltip.style("opacity", 0);
}

function drawDonut(data, isOther = false, targetSvg = svg, chartRadius = radius) {
    targetSvg.selectAll("*").remove();

    var sortedData = d3.entries(data).sort((a, b) => b.value - a.value);
    var processedData = {};
    otherData = {};
    var totalValue = d3.sum(sortedData, d => d.value);

    const percentages = calculatePercentages(data);

    if (!isOther) {
        sortedData.forEach(d => {
            if (percentages[d.key] < 2) {
                otherData[d.key] = d.value;
                originalPercentages[d.key] = percentages[d.key];
            } else {
                processedData[d.key] = d.value;
            }
        });

        if (Object.keys(otherData).length > 0) {
            processedData["Other"] = d3.sum(Object.values(otherData));
            cachedOtherData = Object.assign({}, otherData);
        }
    } else {
        processedData = data;
    }

    currentData = processedData;

    var pie = d3.pie()
        .sort(null)
        .value(d => d.value);

    var data_ready = pie(d3.entries(processedData));

    var arc = d3.arc()
        .innerRadius(chartRadius * 0.5)
        .outerRadius(chartRadius * 0.8);

    var outerArc = d3.arc()
        .innerRadius(chartRadius * 0.9)
        .outerRadius(chartRadius * 0.9);

    // Création des secteurs
    var slices = targetSvg.selectAll('allSlices')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => color(d.data.key))
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.7)
        .on("mouseover", d => showTooltip(d, isOther))
        .on("mousemove", moveTooltip)
        .on("mouseleave", hideTooltip);

    if (!isOther) {
        slices.filter(d => d.data.key === "Other")
            .classed("clickable", true)
            .on("click", showModal);
    }

    // Ajout du total au centre
    targetSvg.append("text")
        .attr("class", "total-label")
        .attr("dy", "-0.5em")
        .text("Total");

    targetSvg.append("text")
        .attr("class", "total-label")
        .attr("dy", "0.7em")
        .text(totalValue.toLocaleString() + " musics");

    // Création des polylines
    targetSvg.selectAll('allPolylines')
        .data(data_ready)
        .enter()
        .append('polyline')
        .attr("stroke", "black")
        .style("fill", "none")
        .attr("stroke-width", 1)
        .attr('points', function(d) {
            var posA = arc.centroid(d);
            var posB = outerArc.centroid(d);
            var posC = outerArc.centroid(d);
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            posC[0] = chartRadius * 0.95 * (midangle < Math.PI ? 1 : -1);
            return [posA, posB, posC];
        });

    // Création des labels
    var labels = targetSvg.selectAll('allLabels')
        .data(data_ready)
        .enter()
        .append('text')
        .attr('class', 'slice-label')
        .attr('transform', function(d) {
            var pos = outerArc.centroid(d);
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            pos[0] = chartRadius * 0.99 * (midangle < Math.PI ? 1 : -1);
            return 'translate(' + pos + ')';
        })
        .style('text-anchor', function(d) {
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            return (midangle < Math.PI ? 'start' : 'end');
        })
        .on("mouseover", d => showTooltip(d, isOther))
        .on("mousemove", moveTooltip)
        .on("mouseleave", hideTooltip);

    labels.append('tspan')
        .text(function(d) {
            const labelText = d.data.key;
            const percentage = isOther
                ? originalPercentages[d.data.key].toFixed(1)
                : ((d.data.value / totalValue) * 100).toFixed(1);
            return `${labelText} - ${percentage}%`;
        })
        .attr('x', 0)
        .attr('dy', '0em');

    if (!isOther) {
        labels.filter(d => d.data.key === "Other")
            .classed("clickable", true)
            .on("click", showModal);
    }
}

function calculatePercentages(data) {
    const total = d3.sum(Object.values(data));
    const percentages = {};
    Object.entries(data).forEach(([key, value]) => {
        percentages[key] = (value / total) * 100;
    });
    return percentages;
}

function showModal() {
    document.getElementById('detailsModal').style.display = 'block';
    drawDonut(cachedOtherData || otherData, true, modalSvg, modalRadius);
}

function hideModal() {
    document.getElementById('detailsModal').style.display = 'none';
}

document.querySelector('.close-button').addEventListener('click', hideModal);

document.querySelector('.modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) {
        hideModal();
    }
});

function updateChart(year, genre, country) {

    if (!inverse_mapping[country]) {
        alert("Le pays sélectionné n'a pas de correspondances de régions.");
        return;
    }

    d3.json("..\\..\\data\\Guillaume2.json").then(function(data) {
        let genreData = {};
        inverse_mapping[country].forEach(region => {
            if (data[region] && data[region][genre] && data[region][genre][year]) {
                let regionData = data[region][genre][year][1];
                for (const subGenre in regionData) {
                    if (genreData[subGenre]) {
                        genreData[subGenre] += regionData[subGenre][0];
                    } else {
                        genreData[subGenre] = regionData[subGenre][0];
                    }
                }
            }
        });
        if (Object.keys(genreData).length > 0) {
            drawDonut(genreData);
        } else {
            alert("Aucune donnée trouvée pour les critères sélectionnés.");
        }
    }).catch(error => {
        console.error("Erreur lors du chargement des données:", error);
    });
}
