d3.json("top_artists_by_genre.json").then(data => {
    const svg = d3.select("#chart"),
          margin = {top: 40, right: 20, bottom: 100, left: 60},
          width = svg.node().getBoundingClientRect().width - margin.left - margin.right,
          height = +svg.attr("height") - margin.top - margin.bottom;

    const chart = svg.append("g")
                     .attr("transform", `translate(${margin.left},${margin.top})`);

    const genres = Object.keys(data).sort();  // Trier les genres par ordre lexicographique
    const colors = d3.scaleOrdinal(d3.schemeCategory10);

    // Configuration du sélecteur de genre
    const genreSelector = d3.select("#genre-selector")
                            .append("select")
                            .attr("multiple", true)
                            .attr("size", 10)
                            .attr("style", "width: 200px; max-height: 300px; overflow-y: auto;");

    genres.forEach(genre => {
        genreSelector.append("option")
                     .attr("value", genre)
                     .text(genre);
    });

    genreSelector.on("change", function() {
        const selectedGenres = Array.from(this.selectedOptions).map(option => option.value);
        if (selectedGenres.length > 10) {
            alert("Vous ne pouvez sélectionner que 10 genres au maximum.");
            this.options[this.selectedIndex].selected = false;
        }
        updateChart(selectedGenres);
    });

    function updateChart(selectedGenres) {
        // Nettoyer le graphique
        chart.selectAll("*").remove();

        if (selectedGenres.length === 0) return;

        // Préparer les données
        const stackedData = selectedGenres.map(genre => {
            const artists = data[genre]
                .sort((a, b) => a.average_rank - b.average_rank)
                .slice(0, 10);  // Limiter à 10 artistes par genre
            
            let cumulative = 0;
            const segments = artists.map(artist => {
                const start = cumulative;
                cumulative += artist.average_rank;
                return {
                    name: artist.name,
                    rank: artist.average_rank,
                    start: start,
                    end: cumulative
                };
            });
            
            return {
                genre: genre,
                segments: segments
            };
        });

        // Échelles
        const x = d3.scaleBand()
                    .domain(selectedGenres)
                    .range([0, width])
                    .padding(0.2);

        const maxTotal = d3.max(stackedData, d => 
            d3.max(d.segments, s => s.end)
        );

        const y = d3.scaleLinear()
                    .domain([0, maxTotal])
                    .range([height, 0]);

        // Axes
        chart.append("g")
             .attr("transform", `translate(0,${height})`)
             .call(d3.axisBottom(x).tickSize(0))
             .selectAll("text")
             .attr("transform", "rotate(-45)")
             .style("text-anchor", "end");

        chart.append("g")
             .call(d3.axisLeft(y));

        // Créer les barres empilées
        stackedData.forEach((genreData, genreIndex) => {
            chart.selectAll(`.bar-${genreIndex}`)
                 .data(genreData.segments)
                 .enter()
                 .append("rect")
                 .attr("x", x(genreData.genre))
                 .attr("y", d => y(d.end))
                 .attr("width", x.bandwidth())
                 .attr("height", d => y(d.start) - y(d.end))
                 .attr("fill", colors(genreIndex))
                 .attr("stroke", "white")
                 .attr("stroke-width", 0.5)
                 .append("title")
                 .text(d => `${d.name}\nRank: ${d.rank.toFixed(2)}`);

            // Ajouter le texte au centre des barres
            genreData.segments.forEach((segment, index) => {
                chart.append("text")
                     .attr("x", x(genreData.genre) + x.bandwidth() / 2)
                     .attr("y", y(segment.start) + (y(segment.end) - y(segment.start)) / 2)
                     .attr("text-anchor", "middle")
                     .attr("alignment-baseline", "middle")
                     .text(segment.name)
                     .style("fill", "white")
                     .style("font-size", "10px");
            });
        });
    }

    // Initialisation
    updateChart([]);
});
