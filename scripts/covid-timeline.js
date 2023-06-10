// Red Color Pallete
const colors = [
    'rgb(250, 250, 250)',
    'rgb(239, 209, 202)',
    'rgb(223, 162, 145)',
    'rgb(207, 116, 89)',
    'rgb(191, 69, 32)',
    'rgb(175, 23, 16)',
    'rgb(139, 0, 0)',
    'rgb(100, 0, 0)',
  ]
   
  let naming_dict = {
    'total_cases': 'Total Cases',
    'new_cases': 'New Cases',
    'new_deaths': 'New Deaths',
    'total_deaths': 'Total Deaths',
    '7DMA': '1 Week Moving Average',
  }
   
  const formatDate = function(d) {
    let ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
    let mo = new Intl.DateTimeFormat('en', { month: 'short' }).format(d);
    let da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);
    return `${da} ${mo} ${ye}`;
  }
   
  document.addEventListener('DOMContentLoaded', function (event) {
    // Create a promise to load data
    Promise.all([
      d3.json('../data/world_countries.json'),
      d3.json('../data/data.json'),
      d3.json('../data/country-iso-map.json'),
      d3.json('../data/un.json'),
      d3.json('../data/uol.json'),
      d3.json('../data/g1.json')
  
    ]).then((res) => {
      console.log(res)
      // Dimensions
      const width = 1200
      const height = 600
      // SVG init
      const svg = d3
        .select('#chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
   
      // projection setup
      const projection = d3.geoRobinson()
        .scale(140) // The scale determines how much to magnify or reduce the features of the map
        .rotate([360, 0, 0]) // Center the map (Pacific Ocean?)
        .translate([width / 2, height / 2]) // translate the center of the map to center of the svg element
      const path = d3.geoPath().projection(projection) // Handles the projection
      // Map data
      const world = res[0]
      // New cases data
      let data = res[1]
      // Country ISO code map
      const isoMap = res[2]
      // UN news data
      const un = res[3]
      // UOL news data
      const uol = res[4]
      // G1 news data
      const g1 = res[5]
  
      const news_data = {
        'all': {...un, ...uol, ...g1},
        'un': un,
        'uol': uol,
        'g1': g1
      }
  
      let selectedSource = 'all'
      let selectedNewsData = news_data['all']
      let availableDates = Object.keys(selectedNewsData)
      availableDates.sort((a, b) => new Date(a) - new Date(b));
      availableDates = availableDates.filter(v => new Date(v) > new Date('2020-01-01'))
  
  
      // Create a dictionary to map iso codes to country names
      const isoDict = {}
      isoMap.forEach(v => { isoDict[v['alpha-3']] = v.name })
    
      // Color scale (we use threshold scale)
      const color = d3.scaleThreshold()
        .domain([1000, 10000, 50000, 100000, 250000, 500000, 1000000])
        .range(colors)
      
      // Get all dates (uniques and sorted)
      let dates = [...new Set(data.map(v => v.date))].sort((a, b) => new Date(a) - new Date(b));
      let maxDate = dates[dates.length - 1]
      let filterDate = new Date(maxDate);
      filterDate.setDate(filterDate.getDate() - 4);
      dates = dates.filter(v => new Date(v) < filterDate)
      let selectedDate = dates[0]
   
   
      // Get selected option from the dropdown '#selectvar'
      const selectvar = document.getElementById('selectvar')
      let selectedVar = selectvar.value
   
      // Function to redraw the map based on the selected date
      const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('background-color', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('border-radius', '5px')
      .style('padding', '10px');
   
      // Function to open the modal
      function openModal(countryName) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        modal.style.display = 'block';
        modalTitle.textContent = countryName;
      }
   
      // Function to close the modal
      function closeModal() {
        const modal = document.getElementById('modal');
        modal.style.display = 'none';
      }
   
      const closeButton = document.getElementsByClassName('close')[0];
      closeButton.addEventListener('click', closeModal);
   
      function updateModalContent(countryName, seriesData) {
        const modalTitle = document.getElementById('modal-title');
        modalTitle.textContent = countryName;
      
        // Extract the date and value arrays from the series data
        const dates = seriesData.map(data => new Date(data.date));
        const values = seriesData.map(data => data[selectedVar]);
      
        // Create the chart data object
        const chartData = {
          labels: dates,
          datasets: [
            {
              label: naming_dict[selectedVar],
              data: values,
              backgroundColor: 'rgb(139, 0, 0)',
              borderColor: 'rgb(139, 0, 0)',
              borderWidth: 1
            }
          ]
        };
      
        // Get the canvas element and initialize the chart
        document.querySelector("#chart-holder").innerHTML =  '<canvas id="modal-chart"></canvas>'
        const chartCanvas = document.getElementById('modal-chart');
   
        const chartContext = chartCanvas.getContext('2d');
        const barChart = new Chart(chartContext, {
          type: 'bar',
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
              x: {
                type: 'time',
                time: {
                  unit: 'day'
                },
                ticks: {
                  source: 'labels'
                }
              },
              y: {
                beginAtZero: true
              }
            }
          }
        });
   
   
      }
      
      function updateSelectedDateNews() {
        const newsTitleAnchor = document.getElementById('title-anchor')
        const newsCarousel = document.getElementById('news-carousel')
        // check if selectedDate is in availableDates
        if (!availableDates.includes(selectedDate) || selectedNewsData[selectedDate].length == 0) {
          newsTitleAnchor.textContent = 'No news for this date'
          newsTitleAnchor.href = '#'
          newsCarousel.style.backgroundImage = 'none'
          return
        }
        newsTitleAnchor.textContent =  selectedNewsData[selectedDate][0].source+': ' + selectedNewsData[selectedDate][0].content
        newsTitleAnchor.href = selectedNewsData[selectedDate][0].news_url
        newsCarousel.style.backgroundImage = `url(${selectedNewsData[selectedDate][0].media})`
        newsCarousel.style.backgroundSize = 'cover'
        newsCarousel.style.backgroundRepeat = 'no-repeat'
      }
      let newsModeBool = false
      // const newsMode = document.getElementById('news-mode-toggle')
      // let newsModeBool = newsMode.checked
      // newsModeBool = false
      // newsMode.addEventListener('click', () => {
      //   // newsModeBool = newsMode.checked
      //   newsModeBool = false
      //   if (play) {
      //     document.getElementById('play').click()
      //   }
      //   if (newsModeBool) {
      //     document.getElementById('news-carousel').style.display = 'block'
      //     document.getElementById('news-source').style.display = 'block'
      //     document.getElementById('minus').style.display = 'none'
      //     document.getElementById('plus').style.display = 'none'
      //     document.getElementById('overview').style.display = 'none'
      //     document.getElementById('steps').textContent = 'Start News Animation'
          
      //   }
      //   else {
      //     document.getElementById('news-carousel').style.display = 'none'
      //     document.getElementById('news-source').style.display = 'none'
      //     document.getElementById('minus').style.display = 'block'
      //     document.getElementById('plus').style.display = 'block'
      //     document.getElementById('overview').style.display = 'block'
      //     document.getElementById('steps').textContent = `Steps: ${speed} days`
      //   }
      //   updateSelectedDateNews()
      // })
      
      // update the data based on the selected source
      document.getElementById('selectsource').addEventListener('change', () => {
        selectedSource = document.getElementById('selectsource').value
        selectedNewsData = news_data[selectedSource]
        availableDates = Object.keys(selectedNewsData)
        availableDates.sort((a, b) => new Date(a) - new Date(b));
        // remove dates before 2020-01-01
        availableDates = availableDates.filter(v => new Date(v) > new Date('2020-01-01'))
    
        updateSelectedDateNews()
      })
   
      function redraw () {
        svg.selectAll('g.countries').remove()
        const dataByID = {}
        const dataByDate = data.filter(v => v.date === selectedDate)
        dataByDate.forEach(v => { dataByID[v.iso_code] = v[selectedVar] })
        svg
          .append('g')
          .attr('class', 'countries')
          .selectAll('path')
          .data(world.features)
          .enter()
          .append('path')
          .attr('d', path)
          .style('fill', d => dataByID[d.id] ? color(dataByID[d.id]) : colors[0])
          .style('stroke', '#646464')
          .style('opacity', 0.8)
          .style('stroke-width', 1.5)
          .on('mouseover', (event, d) => {
            tooltip.transition().duration(200).style('opacity', 0.9);
            tooltip.html(`${isoDict[d.id]}: ${dataByID[d.id] ? dataByID[d.id] : 0}`)
              .style('left', `${event.pageX}px`)
              .style('top', `${event.pageY - 28}px`);
            d3.select(event.target)
              .style('stroke', '#000')
              .style('stroke-width', 2)
              .style('opacity', 1);
          })
          .on('mouseout', (event, d) => {
            tooltip.transition().duration(300).style('opacity', 0);
            d3.select(event.target)
              .style('stroke', '#646464')
              .style('stroke-width', 1.5)
              .style('opacity', 0.8);
          })
          .on('click', (event, d) => {
            openModal(isoDict[d.id]);
            // Retrieve the series data for the clicked country and update the modal content
            const seriesData = data.filter(v => v.iso_code === d.id);
            updateModalContent(isoDict[d.id], seriesData);
          });
        
      }
      redraw()
   
      // Function to add the top 10 countries with the most cumulative cases to the 'toplist' ul
      function addTopList () {
        const topList = document.getElementById('toplist')
        topList.innerHTML = ''
        const dataByDate = data.filter(v => v.date === selectedDate)
        dataByDate.sort((a, b) => b[selectedVar] - a[selectedVar])
        dataByDate.slice(0, 10).forEach(v => {
          const li = document.createElement('li')
          li.textContent = `${isoDict[v.iso_code]}: ${v[selectedVar]}`
          topList.appendChild(li)
        })
      }
      addTopList()
   
      document.getElementById('date').textContent = formatDate(new Date(selectedDate))
      document.getElementById('variable').textContent = naming_dict[selectedVar]
   
      let tickIndex = 0
      const slider = d3
        .sliderHorizontal()
        .max(dates.length - 1)
        .tickValues(Array.from(dates.keys()))
        .step(1)
        .height(30)
        .width(400)
        .tickFormat(tick => ++tickIndex == (dates.length-1) || tickIndex == 1 ? dates[tick-1] : null)
        .displayFormat(tick => dates[tick-1])
        .default(0)
        .on('onchange', tick => {
          
          selectedDate = dates[tick-1]
          document.getElementById('date').textContent = formatDate(new Date(selectedDate+'T00:00'))
          redraw()
          addTopList()
          if (newsModeBool && !play) updateSelectedDateNews()
        })
      
      let speed=1;
      const legend = svg.append('g')
        .attr('class', 'legendQuant')
        .attr('transform', 'translate(1000,50)')
   
      legend.call(d3.legendColor()
        .orient('vertical')
        .shapeWidth(60)
        .labelFormat(d3.format('i'))
        .labels(d3.legendHelpers.thresholdLabels)
        .scale(color))
   
      selectvar.addEventListener('change', (event) => {
        selectedVar = event.target.value
        switch (selectedVar) {
          case 'new_cases':
            color.domain([1000, 10000, 50000, 100000, 250000, 500000, 1000000])
            break
          case 'total_cases':
            color.domain([10000, 100000, 500000, 1000000, 2500000, 5000000, 10000000])
            break
          case 'new_deaths':
            color.domain([100, 1000, 5000, 10000, 25000, 50000, 100000])
            break
          case 'total_deaths':
            color.domain([1000, 10000, 50000, 100000, 250000, 500000, 1000000])
            break
          case '7DMA':
            color.domain([1000, 10000, 50000, 100000, 250000, 500000, 1000000])
   
        }
        document.getElementById('variable').textContent = naming_dict[selectedVar]
   
        redraw()
        addTopList()
        legend.call(d3.legendColor()
          .orient('vertical')
          .shapeWidth(60)
          .labelFormat(d3.format('i'))
          .labels(d3.legendHelpers.thresholdLabels)
          .scale(color))
   
      })
    
      let play = false;
      d3.selectAll('#play').on("click", async () => {
        if(play) {
          play = false;
          document.getElementById('play').textContent = 'Play';
          if (newsModeBool) document.getElementById('steps').textContent = 'Start News Animation'
        } else {
          play = true;
          document.getElementById('play').textContent = 'Stop';
          if (newsModeBool) document.getElementById('steps').textContent = 'Stop News Animation'
  
        }
        if (newsModeBool) {
          // iterate over the 'availableDates' and update the slider
          // for (let i = dates.indexOf(slider.value()); i < availableDates.length; i++) {
          while(slider.value() < 1194 & play) {
            selectedDate = dates[slider.value()];
            let dateIndex = availableDates.indexOf(selectedDate);
            slider.value(slider.value() + 1);
            if(slider.value() >= 1193) {
              play = false;
              document.getElementById('play').textContent = 'Play';
              slider.value(1)
              break;
            }
            if (dateIndex == -1) continue;
            updateSelectedDateNews();
            await new Promise(r => setTimeout(r, 1500));
          }
  
          
        }
  
        if (!newsModeBool) {
          while(slider.value() < 1200 & play) {
            slider.value(slider.value() + speed);
            await new Promise(r => setTimeout(r, 75));
            if(slider.value() >= 1200) {
              play = false;
              document.getElementById('play').textContent = 'Play';
              slider.value(0)
              break;
            }
          }
        }
      })
   
      d3.selectAll('#minus').on('click', async () =>  {
        speed = Math.max(speed -1, 1)
        document.getElementById('steps').textContent = `Steps: ${speed} days`
   
      })
   
      d3.selectAll('#plus').on('click', async () =>  {
        speed = Math.min(speed + 1, 50)
        document.getElementById('steps').textContent = `Steps: ${speed} days`
      })
      svg
        .append('g')
        .attr('transform', `translate(${width/2 - 190}, ${height - 50})`)
        .call(slider)
   
    })
  })
   