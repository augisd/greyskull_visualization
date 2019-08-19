//Variables

// 1. General
var margin = 120,
	height = 900 - 2 * margin,
	width = 1050 - 2 * margin,
	dataUrl = "https://docs.google.com/spreadsheets/d/1qG1ux4GQDoY7u99QxIHUGE-AzrQ6OPW1Cfzk_PVtDgw/export?format=csv&id=1qG1ux4GQDoY7u99QxIHUGE-AzrQ6OPW1Cfzk_PVtDgw&gid=0",
	mainLifts = ["Bench Press", "Yates Row", "Squat", "Overhead Press", "Chin ups", "Deadlift"],
	repCircles, exerciseLine, mainLiftData, bwData;

// 2. D3 specific
var parseDate = d3.timeParse("%d/%m/%Y"),
	xScale, yScale, xAxis, yAxis,
	liftColours = d3.scaleOrdinal()
	            	.domain(mainLifts)
	            	.range(d3.schemeCategory10),
	line = d3.line()
  			 .x(function(d) { return xScale(d["Date"]) + margin; })
  			 .y(function(d) { return yScale(d["Weight"]) + margin; }),

  	bwLine = d3.line()
  			 .x(function(d) { return xScale(d["Date"]) + margin; })
  			 .y(function(d) { return yScale(d["BW"]) + margin; })		 

//Main
	d3.csv(dataUrl).then(plot);
	createSvgContainer(width, height, margin);
	
//Functions

// 1. Master function
function plot(data) {
	convertData(data);
	createScales(data);
	addAxes();
	addGridlines();
	groupDataByMainLifts(data);
	groupDataByBw(data);
	drawLines(mainLiftData);
	drawLineLabels(mainLiftData);
	drawBwLine(bwData)
	drawCircles(data);
	drawReps(data);
	console.log((bwData))
}

// 1.1 Main functions (uses data)

function convertData(data) {
	data.forEach(function(d) {
		d["Date"] = parseDate(d["Date"])
		d["Body weight"] = +d["Body weight"]
		d["Weight"] = +d["Weight"]
		d["Set 1"] = +d["Set 1"]
		d["Set 2"] = +d["Set 2"]
		d["Set 3"] = +d["Set 3"]
		d["Total Weight"] = +d["Total Weight"]
	})
}
function createScales(data) {
	createXscale(data)
	createYscale(data)
}
function createXscale(data) {
	xScale = d3.scaleTime()
			   .domain([
			   			d3.min(data, function(d) {return d["Date"];}),
			   			d3.max(data, function(d) {return d["Date"];})
			    ])
			   .range([0, width])
}
function createYscale(data) {
	yScale = d3.scaleLinear()
			   .domain([
			   			d3.min(data, function(d) {return d["Weight"]}),
			   			d3.max(data, function(d) {return d["Weight"]})
			   	])
			   .range([height, 0])
}
function drawCircles(data) {
	repCircles = d3.select("svg")
				   .selectAll("circle")
				   .data(data.filter(function(d) {
					  	if ( mainLifts.includes(d["Exercise"]) ) { return d; }
				   }))
			  	   .enter()
			  	   .append("g")
				   .attr("class", "repCircle")

   	repCircles.append("circle")
		  	  .attr("cx", function(d) { return xScale(d["Date"]) + margin; })
		  	  .attr("cy", function(d) { return yScale(d["Weight"]) + margin; })
		  	  .attr("r", function(d) { return d["Set 3"] * 1.7;})
		  	  .attr("fill", function(d) { return liftColours(d["Exercise"]); })
}
function drawReps(data) {
	repCircles.append("text")
		  	  .attr("x", function(d) { return xScale(d["Date"]) + margin; })
		  	  .attr("y", function(d) { return yScale(d["Weight"]) + margin + d["Set 3"] / 2; })
		  	  .attr("text-anchor", "middle")
		  	  .text(function(d) { return d["Set 3"]; })
		  	  .style("font-size", function(d) { return String(d["Set 3"] * 0.1) + "em"; })
		  	  .style("font-family", "Helvetica")
		  	  .style("font-weight", "bold")
		  	  .style('fill', 'white')
}
function groupDataByMainLifts(data) {
	mainLiftData = d3.nest()
					 .key(function(d) { return d["Exercise"]; })
					 .entries(data.filter(function(d) {
					  	if ( mainLifts.includes(d["Exercise"]) ) { return d; }
				   	 }))
}
function groupDataByBw(data) {
	bwData = d3.nest()
			   .key(function(d) {return d["Date"];})
		       .rollup(function(values) {return values[0]["Body weight"]})
			   .entries(data)
			   .map(function(group) { return {
										      "Date": group.key,
										      "BW": group.value
										     }
										  })
}

function drawLines(data) {
	d3.select("svg")
	  .selectAll(".line")
	  .data(data)
	  .enter()
	  .append("path")
	  	.attr("class", "exerciseLine")
	  	.attr("fill", "none")
	  	.attr("stroke", function(d) { return liftColours(d.key); })
	  	.attr("stroke-width", 1.5)
	  	.attr("d", function(d) { return line(d.values); })
}
function drawLineLabels(data) {
	d3.select("svg")
	  .selectAll(".exerciseLabelLine")
	  .data(data)
	  .enter()
	  	.append("line")
	  	   .attr("class", "exerciseLabelLine")
	  	   .attr("stroke", function(d) { return liftColours(d.key); })
	  	   .attr("stroke-width", 1.5)
	  	   .attr("x1", function(d) { return xScale(d.values[d.values.length - 1]["Date"]) + margin; })
	  	   .attr("y1", function(d) { return yScale(d.values[d.values.length - 1]["Weight"]) + margin; })
	  	   .attr("x2", width + margin)
	  	   .attr("y2", function(d) { return yScale(d.values[d.values.length - 1]["Weight"]) + margin; })

	d3.select("svg")
	  .selectAll(".exerciseLabelText")
	  .data(data)
	  .enter()
	  	.append("text")
	  	.attr("x", width + margin + 20)
	  	.attr("y", function(d) { return yScale(d.values[d.values.length - 1]["Weight"]) + margin + 5; })
	  	.text(function(d) { return d.key; })
	  	.style("font-size", "0.8em")
	  	.style("font-family", "Helvetica")
	  	.style("fill", function(d) { return liftColours(d.key); })
}

function drawBwLine(data) {
	d3.select("svg")
	  .selectAll(".line")
	  .data(data)
	  .enter()
	  .append("path")
	  	.attr("class", "bwLine")
	  	.attr("fill", "none")
	  	.attr("stroke", "black")
	  	.attr("stroke-width", 1.5)
	  	.attr("d", function(d) { return bwLine(d); })
}

// 2. Helper functions (doesn't use data)
function createSvgContainer(width, height, margin) {
	d3.select("body")
	  .append("svg")
	  	.attr("height", height + 2 * margin)
	  	.attr("width", width + 2 * margin);
}
function addAxes() {
	addXaxis();
	addYaxis();
}
function addXaxis() {
	d3.select("svg")
	  .append("g")
	  	.attr("transform", "translate(" + margin + ", " + (height + margin) + ")")
	  	.call(d3.axisBottom().scale(xScale.nice()))
	  		.selectAll("text")
				.style("text-anchor", "end")
				.attr("transform", "rotate(-45)")
}
function addYaxis() {
	d3.select("svg")
	  .append("g")
	  	.attr("transform", "translate(" + margin + ", " + margin + ")")
	  	.call(d3.axisLeft().scale(yScale.nice()))	  	
}
function addGridlines() {
	addXgridLine();
	addYgridLine();
}
function addXgridLine() {
	d3.select("svg")
	  .append("g")
		  .attr("transform", "translate(" + margin + ", " + (height + margin) + ")")
		  .attr("class", "grid")
		  .call(d3.axisBottom().scale(xScale.nice()).tickSize(-height).tickFormat(""))
}
function addYgridLine() {
	d3.select("svg")
	  .append("g")
	  .attr("transform", "translate(" + margin + ", " + margin + ")")
	  .attr("class", "grid")
	  .call(d3.axisLeft().scale(yScale.nice()).tickSize(-width).tickFormat(""))	
}