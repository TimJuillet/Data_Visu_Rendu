d3.csv("../../data/summary.csv").then(data => {
  // Convertir les données numériques
  data.forEach(d => {
    d.year = +d.year;
    d.nbSongs = +d.nbSongs;
  });

  // Obtenir la liste des pays et des genres uniques
  const countries = Array.from(new Set(data.map(d => d.country)));
  const genres = Array.from(new Set(data.map(d => d.genre)));

  // Remplir la liste déroulante des pays
  const countrySelect = d3.select("#country-select");
  countrySelect.selectAll("option:not([value='All'])")
               .data(countries)
               .enter()
               .append("option")
               .text(d => d)
               .attr("value", d => d);

  // Sélectionner "World" par défaut si "World" est dans la liste des pays
  countrySelect.property("value", "World");

  // Remplir la liste déroulante des genres et sélectionner tous les genres par défaut
  const genreSelect = d3.select("#genre-select");
  genreSelect.selectAll("option")
             .data(genres)
             .enter()
             .append("option")
             .text(d => d)
             .attr("value", d => d)
             .attr("selected", true); // Sélectionner tous les genres par défaut

  // Initialiser les champs d'entrée de l'intervalle d'années
  const years = Array.from(new Set(data.map(d => d.year)));
  const minYear = d3.min(years);
  const maxYear = d3.max(years);

  // Définir la plage d'années par défaut (2010 à 2013)
  const defaultStartYear = 2008;
  const defaultEndYear = 2013;

  // Appliquer les années par défaut dans les champs de saisie
  d3.select("#year-start").attr("value", defaultStartYear).attr("min", minYear).attr("max", maxYear);
  d3.select("#year-end").attr("value", defaultEndYear).attr("min", minYear).attr("max", maxYear);

  // Mettre à jour le graphique en fonction du pays, des genres, et de l'intervalle d'années sélectionnés
  countrySelect.on("change", updateChart);
  genreSelect.on("change", updateChart);
  const INTERV_WIDTH = 6;
  d3.select("#year-start").on("input", function() {
    d3.select("#year-end").attr("min", +this.value+ INTERV_WIDTH);
    updateChart();
  }).dispatch("input");
  d3.select("#year-end").on("input", function() {
    d3.select("#year-start").attr("max", +this.value-INTERV_WIDTH);
    updateChart();
  }).dispatch("input");

  // Si la case est cochée désactiver les champs année
    d3.select("#auto-fit").on("change", function() {
        d3.selectAll("#year-start, #year-end").attr("disabled", this.checked ? "disabled" : null);
        updateChart();
    });


  // Initialiser avec le premier pays de la liste, tous les genres, et l'intervalle d'années par défaut (2010-2013)
  updateChart();

  function updateChart() {
    // Récupérer le pays sélectionné
    const selectedCountries = Array.from(countrySelect.property("selectedOptions"), option => option.value);

    // Récupérer les genres sélectionnés
    const selectedGenres = Array.from(genreSelect.property("selectedOptions"), option => option.value);


    // Filtrer les données pour le pays, les genres,
    let filteredData = data.filter(d =>
      selectedCountries.includes(d.country) &&
      selectedGenres.includes(d.genre)
    );

    // Si la case auto-fit est cochée, ajuster la plage d'années pour inclure toutes les années avec des données
    if (d3.select("#auto-fit").property("checked")) {
      const interv_half = Math.ceil(INTERV_WIDTH/2);
      d3.select("#year-start").property("value", d3.min(filteredData, d => d.year - interv_half));
        d3.select("#year-end").property("value", d3.max(filteredData, d => d.year + interv_half));
    }

    // Récupérer les années de début et de fin de la plage sélectionnée
    const yearStart = +d3.select("#year-start").property("value");
    const yearEnd = +d3.select("#year-end").property("value");

    // Filtrer les données pour l'intervalle d'années sélectionné
    filteredData = filteredData.filter(d => d.year >= yearStart && d.year <= yearEnd);

    // Définir les échelles
    const x = d3.scaleTime()
                .domain([new Date(yearStart, 0), new Date(yearEnd, 0)])
                .range([0, width]);

    const y = d3.scaleLinear()
                .domain([0, d3.max(filteredData, d => d.nbSongs)])
                .range([height, 0]);

    // Supprimer les lignes existantes
    svg.selectAll("*").remove();

    // Ajouter les axes
    svg.append("g")
        .attr("class", "x-axis")
       .attr("transform", `translate(0,${height})`)
       .call(d3.axisBottom(x));

    svg.append("g")
       .call(d3.axisLeft(y));

    // on click X axis, show genre year
    svg.selectAll(".x-axis .tick text")
        .on("click", function(event, d) {
            showGenreDonut(d.getFullYear());
        });

    if (filteredData.length === 0) {
      svg.append("text")
          .attr("x", width / 2)
          .attr("y", height / 2)
          .attr("text-anchor", "middle")
          .text("No data available");
      return;
    }

    // group filteredData by genre and country
    const byGenreAndCountry = d3.group(filteredData, d => d.genre, d => d.country);

    // Tracer une ligne pour chaque genre sélectionné
    for (const country of selectedCountries) {
      for (const genre of selectedGenres) {
        // Filtrer les données pour le genre et compléter les années manquantes
        const genreData = byGenreAndCountry.get(genre)?.get(country) || [];
        genreData.sort((a, b) => a.year - b.year);

        const line = d3.line()
            .defined(d => d.nbSongs !== null) // Ignore les points sans données
            .x(d => x(new Date(d.year, 0)))
            .y(d => y(d.nbSongs));

        svg.append("path")
            .datum(genreData)
            .attr("fill", "none")
            .attr("stroke", d3.schemeCategory10[genres.indexOf(genre) % 10])
            .attr("stroke-width", 1.5)
            .attr("d", line);

        // show points if less than 20 years
        if (yearEnd - yearStart < 20) {
          const circleRad = 4;
            svg.selectAll("circle" + genres.indexOf(genre))
                .data(genreData)
                .enter()
                .append("circle")
                .attr("cx", d => x(new Date(d.year, 0)))
                .attr("cy", d => y(d.nbSongs))
                .attr("r", circleRad)
                .attr("fill", d3.schemeCategory10[genres.indexOf(genre) % 10])
                .on("mouseover", function(event, d) {
                    d3.select(this).attr("r", circleRad + 1);
                    tooltip.html(`Year: ${d.year}<br>Songs: ${d.nbSongs}<br>Genre: ${genre}<br>Country: ${country}`)
                        .style("left", (event.pageX + 28) + "px")
                        .style("top", (event.pageY - 28) + "px")
                        .style("opacity", 1);
                })
                .on("mouseout", function() {
                    d3.select(this).attr("r", circleRad);
                    tooltip.style("opacity", 0);
                });
        }

        // Ajouter une légende
        if (genreData.length > 0) {
          svg.append("text")
              .attr("x", width - 60)
              .attr("y", y(genreData[genreData.length - 1].nbSongs))
              .attr("fill", d3.schemeCategory10[genres.indexOf(genre) % 10])
              .text(`${genre}(${country})`);
        }
      }
    }
  }
});

function aggregateGenreData(data, year) {
    let genreData = {};

    // Parcourir toutes les régions (y compris Unknown)
    for (const region in data) {
        // Pour chaque genre dans la région
        for (const genre in data[region]) {
            if (data[region][genre][year]) {
                const subGenres = data[region][genre][year][1];
                // Ajouter les valeurs au genre principal
                if (!genreData[genre]) {
                    genreData[genre] = 0;
                }
                // Sommer toutes les valeurs des sous-genres
                for (const subGenre in subGenres) {
                    genreData[genre] += subGenres[subGenre][0];
                }
            }
        }
    }

    return genreData;
}
var width2 = window.innerWidth,
    height2 = window.innerHeight,
    margin2 = 40;
var modalWidth2 = Math.min(width2 * 0.9, 1000);
var modalHeight2 = Math.min(height2 * 0.9, 800);
var modalRadius2 = Math.min(modalWidth2, modalHeight2) / 2 - margin2;

function calculatePercentages(data) {
    const total = d3.sum(Object.values(data));
    const percentages = {};
    Object.entries(data).forEach(([key, value]) => {
        percentages[key] = (value / total) * 100;
    });
    return percentages;
}

function showOtherChart() {
    document.getElementById('detailsModal2').style.display = 'block';
    if (cachedOtherData2 && Object.keys(cachedOtherData2).length > 0) {
        drawDonut(cachedOtherData2, "modal_dataviz3", true);
    }
}

function hideModalOther() {
    document.getElementById('detailsModal2').style.display = 'none';
}

document.querySelector('.close-button2').addEventListener('click', function(e) {
  hideModalOther();
  hideModal();
})

document.querySelector('.back-button2').addEventListener('click', function(e) {
  hideModalOther();
})

document.querySelector('.modal-overlay2').addEventListener('click', function(e) {
    if (e.target === this) {
        hideModalOther();
    }
});

var tooltip2 = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

function showTooltip(d, isOther = false) {
    const songs = d.data.value;

    tooltip2
        .style("opacity", 1)
        .html(`${d.data.key}<br>${songs} musique${songs > 1 ? 's' : ''}`)
        .style("left", (d3.event.pageX + 10) + "px")
        .style("top", (d3.event.pageY - 15) + "px");
}

function moveTooltip() {
    tooltip2
        .style("left", (d3.event.pageX + 10) + "px")
        .style("top", (d3.event.pageY - 15) + "px");
}

function hideTooltip() {
    tooltip2.style("opacity", 0);
}
var color2 = d3.scaleOrdinal(d3.schemeCategory10);
var currentData2 = null;
var otherData2 = null;
var cachedOtherData2 = null;
var originalPercentages2 = {};

function drawDonut(data, targetDivId, isOther = false) {
    const targetDiv = d3.select(`#${targetDivId}`);
    targetDiv.selectAll("*").remove();

    const svg = targetDiv
        .append("svg")
        .attr("width", modalWidth2)
        .attr("height", modalHeight2)
        .append("g")
        .attr("transform", "translate(" + modalWidth2 / 2 + "," + modalHeight2 / 2 + ")");

    var sortedData = Object.entries(data).sort((a, b) => b[1] - a[1])
        .map(([key, value]) => ({ key, value }));
    var processedData = {};
    otherData2 = {};
    var totalValue = d3.sum(sortedData, d => d.value);

    const percentages = calculatePercentages(data);

    if (!isOther) {
        sortedData.forEach(d => {
            if (percentages[d.key] < 2) {
                otherData2[d.key] = d.value;
                originalPercentages2[d.key] = percentages[d.key];
            } else {
                processedData[d.key] = d.value;
            }
        });

        if (Object.keys(otherData2).length > 0) {
            processedData["Other"] = d3.sum(Object.values(otherData2));
            cachedOtherData2 = Object.assign({}, otherData2);
        }
    } else {
        sortedData.forEach(d => {
            if (percentages[d.key] < 0.8) {
                otherData2[d.key] = d.value;
                originalPercentages2[d.key] = percentages[d.key];
            } else {
                processedData[d.key] = d.value;
            }
        });

        if (Object.keys(otherData2).length > 0) {
            processedData["Other"] = d3.sum(Object.values(otherData2));
            originalPercentages2["Other"] = (processedData["Other"] / totalValue) * 100;
        }
    }

    currentData2 = processedData;

    var pie = d3.pie()
        .sort(null)
        .value(d => d.value);

    var data_ready = pie(Object.entries(processedData).map(([key, value]) => ({ key, value })));

    var arc = d3.arc()
        .innerRadius(modalRadius2 * 0.5)
        .outerRadius(modalRadius2 * 0.8);

    var outerArc = d3.arc()
        .innerRadius(modalRadius2 * 0.9)
        .outerRadius(modalRadius2 * 0.9);

    // Création des secteurs
    var slices = svg.selectAll('allSlices')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => color2(d.data.key))
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.7)
        .on("mouseover", d => showTooltip(d, isOther))
        .on("mousemove", moveTooltip)
        .on("mouseleave", hideTooltip);

    if (!isOther) {
        slices.filter(d => d.data.key === "Other")
            .classed("clickable", true)
            .on("click", showOtherChart);
    }

    // Ajout du total au centre
    svg.append("text")
        .attr("class", "total-label")
        .attr("text-anchor", "middle")
        .attr("font-size", "1.2em") // Augmenter la taille de la police
        .attr("font-weight", "bold") // Mettre le texte en gras
        .attr("dy", "-0.5em")
        .text("Total");

    svg.append("text")
        .attr("class", "total-label")
        .attr("text-anchor", "middle")
        .attr("font-size", "1.2em") // Augmenter la taille de la police
        .attr("font-weight", "bold") // Mettre le texte en gras
        .attr("dy", "0.7em")
        .text(totalValue.toLocaleString() + " musics");

    // Création des polylines
    svg.selectAll('allPolylines')
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
            posC[0] = modalRadius2 * 0.95 * (midangle < Math.PI ? 1 : -1);
            if (midangle - Math.PI/2 > 0 && midangle-Math.PI/2 < Math.PI) {
                posB[1] = 1*posB[1] + 40 * Math.exp(-10 * Math.abs(midangle  - Math.PI/2 - Math.PI/2));
                posC[1] = 1*posC[1] + 40 * Math.exp(-10 * Math.abs(midangle - Math.PI/2- Math.PI/2));
            } else {
                posB[1] = 1*posB[1] + 40 * Math.exp(-10 * Math.abs(midangle - Math.PI/2- Math.PI/2));
                posC[1] = 1*posC[1] + 40 * Math.exp(-10 * Math.abs(midangle- Math.PI/2 - Math.PI/2));
            }
            console.log(midangle, Math.abs(midangle - Math.PI/2) ,posA, posB, posC)
            return [posA, posB, posC];
        });

    // Création des labels
    var labels = svg.selectAll('allLabels')
        .data(data_ready)
        .enter()
        .append('text')
        .attr('class', 'slice-label')
        .attr('transform', function(d) {
            var pos = outerArc.centroid(d);
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            var offset = 0;
            if (Math.abs(midangle - Math.PI / 2) < 0.1 || Math.abs(midangle + Math.PI / 2) < 0.1) {
                offset = 30;
            }
            pos[0] = modalRadius2 * 0.99 * (midangle < Math.PI ? 1 : -1);
            if (midangle - Math.PI/2 > 0 && midangle-Math.PI/2 < Math.PI) {
                pos[1] = 1*pos[1] + 40 * Math.exp(-10 * Math.abs(midangle  - Math.PI/2 - Math.PI/2));
            } else {
                pos[1] = 1*pos[1] + 40 * Math.exp(-10 * Math.abs(midangle - Math.PI/2- Math.PI/2));
            }
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
                ? originalPercentages2[d.data.key].toFixed(1)
                : ((d.data.value / totalValue) * 100).toFixed(1);
            return `${labelText} - ${percentage}%`;
        })
        .attr('x', 0)
        .attr('dy', '0em');

    if (!isOther) {
        labels.filter(d => d.data.key === "Other")
            .classed("clickable", true)
            .on("click", showOtherChart);
    }
}


function hideModal() {
    document.getElementById('detailsModal').style.display = 'none';
}

document.querySelectorAll('.close-button').forEach(button => {
    button.addEventListener('click', hideModal);
});

document.getElementById('detailsModal').addEventListener('click', function(e) {
    if (e.target === this) {
hideModalOther();
        hideModal();
    }
});


function showGenreDonut(year) {
      hideModalOther();
    document.getElementById('detailsModal').style.display = 'block';
    d3.json("..\\..\\data\\Guillaume2.json").then(data =>{
        const genreData = aggregateGenreData(data, year);

        if (Object.keys(genreData).length > 0) {
            drawDonut(genreData, "my_dataviz2", false);
        } else {
            alert("Aucune donnée trouvée pour l'année sélectionnée.");
        }
    });
}