/* 
   **scatter plot**
   xAxis = totalAdmission 
   yAxis = avgTuition
   color1 = national/public
   color2 = private
*/

const Chart = (function () {
    d3.json('./(2019) 대학별 평균등록금_20190905.json')
        .then(init); // I like promise.then in this project. looks cleaner.

    // (async () => {  
    //     init(await d3.json('./(2019) 대학별 평균등록금_20190905.json'));
    // })()

    let rem,
        x0, x1, y, color, xAxis, yAxis,
        svg, width, height, margin = {}, chartWrapper,
        header, tip,
        legend, legendColor, legendText, legendHeight,
        data, dots,
        linearRegression, linearRegressionLine, regressionPoints, line

    // color scheme
    const colorCode = {
        art: "orangeRed",
        outlier: "magenta"
    };

    const OUTLIER_BOUNDARY = 1e5;

    // BS4 breakpoints    
    const
        XS = 450,
        SM = 576,
        MD = 768,
        LG = 992,
        XL = 1200

    function init(json) {
        console.log(json);
        const docs = json.root["Row"];
        data = reformatDocs(docs);
        const dataWithoutOutliers = data.filter(doc => doc["입학정원합_명_"] < 1e5);

        const [xMin, xMax] = d3.extent(dataWithoutOutliers, d => d["입학정원합_명_"]);
        const [yMin, yMax] = d3.extent(data, d => d["평균등록금_원_"]);

        x0 = d3.scaleLinear()
            .domain([xMin - 500, xMax]);
        x1 = d3.scalePoint()
            .padding(2)
            .domain(["Other"]);

        y = d3.scaleLinear()
            .domain([yMin - 2e5, yMax]);
        color = d3.scaleOrdinal(["#4daf4a", "#377eb8"]); // www.colorbrewer2.org   

        const container = d3.select('body')
            .append('div')
            .attr('class', 'container');

        svg = container
            .append('svg')
            .attr('id', 'svg');

        header = svg.append('g')
            .attr('class', 'header')

        header.append('text')
            .attr('class', 'title')
            .attr('text-anchor', 'middle')
            .text("대학 입학정원별 평균등록금");

        chartWrapper = svg.append('g');
        chartWrapper.append('g').attr('class', 'x axis');
        chartWrapper.append('g').attr('class', 'x axis extension');
        chartWrapper.append('g').attr('class', 'y axis');

        tip = d3.tip().attr('class', 'd3-tip')
            .attr('id', 'tooltip')
            .html(d => {
                return (
                    `대학명: ${d["대학명"]}<br/>
                    학제: ${d["학제별"]}<br/>
                    설립: ${d["설립별"]}<br/>
                    입학정원: ${d["입학정원합_명_"]}</br>
                    평균등록금(백만원): ${d3.format(".1f")(d["평균등록금_원_"] / 1e6)}
                    `
                )
            })

        dots = chartWrapper.selectAll('circle').data(data)
            .enter().append('circle')
            .attr('class', 'dot')
            .classed('art', d => /예술/.test(d["대학명"]))


        // init legend    
        legend = svg.selectAll('.legend')
            .data([...color.range(), colorCode.art, colorCode.outlier])
            .enter().append('g')
            .attr('class', 'legend')

        legendColor = legend.append('rect')
            .style('fill', d => d);

        legendText = legend.append('text')
            .attr('text-anchor', 'end')
            .text((d, i) => {
                switch (i) {
                    case 0: return "국공립";
                    case 1: return "사립";
                    case 2: return "예술대학";
                    case 3: return "Outlier"
                }
            })

        // init regression line (without outlier)
        linearRegression = ss.linearRegression(dataWithoutOutliers.map( // here, m and b seem little bit off because of the large differences in axes unit.
            d => [d["입학정원합_명_"], d["평균등록금_원_"]])) // {m: 155.49478874251656, b: 4875760.606482712} (x & y axes have diff tick unit. 2k and 1M respectively)
        linearRegressionLine = ss.linearRegressionLine(linearRegression); // returns func that given x, returns y
        
        regressionPoints = (() => { // we only need 2 points to draw straight line
            const firstX = dataWithoutOutliers[
                d3.scan(dataWithoutOutliers, (a, b) => a["입학정원합_명_"] - b["입학정원합_명_"])];
            const lastX = dataWithoutOutliers[
                d3.scan(dataWithoutOutliers, (b, a) => a["입학정원합_명_"] - b["입학정원합_명_"])];
            const xCoords = [firstX, lastX];
            return xCoords.map(d => ({
                x: d["입학정원합_명_"],
                y: linearRegressionLine(d["입학정원합_명_"])
            })
            );
        })(); // [ {x: 50, y: 4883535.345919837}, {x: 21056, y: 8149858.87824514}]
        chartWrapper.append('path')
            .attr('class', 'regressionLine')
            .datum(regressionPoints) 
        // we will use scale funcitons to convert x & y values into actual x & y coords of the chart
        // when we render the regression line
        
        d3.select('.container') // append label
            .append('p')
            .attr('id', 'regression-line-label')
            .text('* One outlier value is dropped from the regression line.')


        render();
    }


    function render() { // no appending here

        updateDimensions(window.innerWidth);
        const md = window.innerWidth > MD;

        //TODO: convert SI locale to KOR (ex 20k => 2만)
        xAxis0 = d3.axisBottom(x0)
            .tickFormat(d3.format(".1s"));
        xAxis1 = d3.axisBottom(x1);

        yAxis = d3.axisLeft(y)
            .tickFormat(d3.format(".1s"))

        svg.select('.x.axis')
            .attr('transform', `translate(0, ${height})`)
            .call(xAxis0);
        svg.select('.x.axis.extension')
            .attr('transform', `translate(0, ${height})`)
            .call(xAxis1)

        svg.select('.y.axis')
            .call(yAxis)


        svg.call(tip);


        dots.attr('r', Math.round(width / 120))
            .attr('cx', d => {
                if ((d["입학정원합_명_"]) > OUTLIER_BOUNDARY) {
                    console.log("outlier!", d["입학정원합_명_"], x1(d["입학정원합_명_"]))
                    return x1("Other");
                }
                else {
                    return x0(d["입학정원합_명_"]);
                }
            })
            .attr('cy', d => y(d["평균등록금_원_"]))
            .style('fill', d => {
                if (/예술/.test(d["대학명"])) {
                    return colorCode.art;
                }
                else if (d["입학정원합_명_"] > OUTLIER_BOUNDARY) {
                    return colorCode.outlier;
                }
                else {
                    return color(d["설립별"]);
                }
            })
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);

        renderLabels();
        renderRegressionLine();
        renderLegend();
    }

    function updateDimensions(winWidth) {
        margin.top = 120;
        margin.right = 50;
        margin.left = 50;
        margin.bottom = 50;
        const outlierWidth = 50;
        rem = (winWidth < SM) ? 14 : 16;

        if (winWidth < XS) {
            width = 300
        }
        else if (winWidth < SM) {
            width = winWidth - margin.left - margin.right - outlierWidth;
        }
        else if (winWidth < LG) {
            width = winWidth * 0.9 - margin.left - margin.right - outlierWidth;
        }
        else {
            width = 800;
        }

        height = 0.8 * width // aspect ratio 10 * 7
        legendHeight = width / 30;

        svg.attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        header.attr('transform', `translate(${(width + margin.left + margin.right) / 2}, ${3 * rem})`)

        chartWrapper.attr('transform', `translate(${margin.left}, ${margin.top})`);

        x0.range([0, width]);
        x1.range([width, width + outlierWidth]);
        y.range([height, 0]);
    }

    function renderLabels() {
        const _labels = chartWrapper.selectAll('text.axisLabel');
        if (_labels['_groups'][0].length > 0) {
            d3.select('#xAxisLabel')
                .attr('x', width);
        }
        else {
            svg.select('.x.axis')
                .append('text') // axis label
                .text('입학정원(단위:천명)')
                .attr('id', 'xAxisLabel')
                .attr('class', 'axisLabel')
                .attr('fill', 'black')
                .attr('text-anchor', 'end')
                // .attr('transform', `translate(${width}, 35)`);
                .attr('x', width)
                .attr('y', 35);

            svg.select('.y.axis')
                .append('text') // axis label
                .text('평균등록금(단위:백만원)')
                .attr('id', 'yAxisLabel')
                .attr('class', 'axisLabel')
                .attr('fill', 'black')
                .attr('text-anchor', 'middle')
                .attr('transform', 'rotate(-90)')
                .attr('x', -5 * rem)
                .attr('y', -2 * rem);
        }
    }

    function renderRegressionLine() {
        
        line = d3.line() // d3's path generator
            .x(d => x0(d.x)) // scale functions (x0, y) ranges are updated to fit the viewport
            .y(d => y(d.y));

        d3.select(".regressionLine")
            .attr('d', line)
    }

    function renderLegend() {
        legend.attr('transform', (d, i) => {
            return `translate(${margin.left}, ${(height + margin.top) * 0.85 - i * legendHeight})`;
        });

        legendColor
            .attr('x', width - (legendHeight - 2))
            .attr('height', legendHeight - 2)
            .attr('width', legendHeight - 2)

        legendText
            .attr('x', width * 0.96)
            .attr('y', 13 * width / 500)
            .style('font-size', 16 * width / 500 + "px")


    }

    // get the field value out of enclosing array (All field values are arrays with single value in it)
    // parse stringified numbers and convert the numbers into actual value (remove si prefix)   
    function reformatDocs(docs) {
        return docs.map(doc => {
            return ({
                "학제별": doc["학제별"][0],
                "설립별": doc["설립별"][0],
                "대학명": doc["대학명"][0],
                "지역별": doc["지역별"][0],
                "입학정원합_명_": Number.parseInt(doc["입학정원합_명_"][0]),
                "평균입학금_원_": Number.parseFloat(doc["평균입학금_천원_"][0]) * 1000,
                "평균등록금_원_": Number.parseFloat(doc["평균등록금_천원_"][0]) * 1000
            })
        })
    }

    // returns an array of unique values of the given field of the given array
    // ex) uniqueValues (scores, subject) will return all the subject 
    // ["Math", "Science", "English", ...] 
    function uniqueValues(array, field) {
        return array.reduce((resArray, elem) => {
            // field values are expected to be an array of single value :(
            if (!resArray.includes(...elem[field])) resArray.push(...elem[field]);
            return resArray;
        }, []);
    }

    return { render: render };

})();


window.addEventListener('resize', Chart.render);