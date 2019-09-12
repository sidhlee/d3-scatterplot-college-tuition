# d3-scatterplot-college-tuition
Responsive scatter plot with color legend and regression line

## Lessons   

### When KOR characters are broken inside csv files, try xml version.  
  - xml uses utf-8 but a lot of plaintext data files(csv, json, etc..) that were encoded in Windows uses cp494(default) for KOR  
  - You can convert xml with vscode's "XML to JSON" extension, altough you might need to reshape the converted json 
    (i.e. converting strings into numbers, flattening arrays with a single value, converting units into actual numbers...)  

### `Promise.then` vs `async await`  
  - When you ajax/ fetch a data using Promise, you can access resolved value only inside `.then` callback.  
  - Using `async await`, you can access fetched data inside `async` function. 
    But aync functions wrap return value inside a promise, which means that you need to chain `.then` to the 
    returned value to access anything you do with the fetched data.
  - `async await` is NOT always better than `Promise.then`.
  - For fetching just one data, `Promise.then` gives more cleaner code.
  - `async await` is better when fetching multiple data that depend on each other.  
    You can `await` each data and store it into a variable, use them like you are in any other synchronous function.
    This makes it easier to see the code flow and removes unnecessary callbacks and many chained `.then`s.
  - Also in async functions, you can delegate all async and sync errors (expected/ unexpected) to `catch(e)` block and handle them from there.
  - Whereas if you use `Promise.then` use need to `.catch` for the rejected promise AND add catch block for all the unexpected non-promise errors.

### Structuring Components
  - Append `div` container to the body and nest `svg` inside the container. 
    This gives an option for later to add non-svg elements to the graph (e.g. tooltips, label and other HTML elements).
  - Only draw legend directly onto the svg when there is available space.
  
### `render()` on `'resize'`
  - Add an event-listener to the window and call render function on resize.
  - The render function must only modify attributes. DO NOT append or create new object inside render function. 
    (`Selection.call(axis)` and `Selection.call(tip)` works fine. Look under the hood when you get time.)
  - If you used `async await` to return `render` function (whether wrapped in an object or nor)  
    you can `.then` the returned promise to access the `render` function.
    
### Keep CJK word from breaking
  - Add `word-break: keep-all;` to the style.
  - Especially for the tooltip text.
  ```css
  .d3-tip {
    font-size: 1em;
    font-weight: light;
    /* prevent CJK word from breaking in the middle */
    word-break: keep-all; 
}  
  ```

### Regression Line
  - `simple-statistics.js`
  - `ss.linearRegression([[x0, y0], [x1, y1], [x2, y2], ...])` returns `{m: 0.3, b:217}`   
    where m is slope and b is y-intercept.
  - `ss.linearRegressionLine({m, b})` returns a line-drawing function that takes x and returns y.
  - Create an array = `[{x0: xStart, y0: yStart}, {x1: xEnd, y1: yEnd}]` with x and y scales. (To get the coordinates on the viewport from the data)
  - Append `path` element to the `chartWrapper` and `.datum(coordsArray)`.
  - Inside `render` function, update path generator and assign it to the `path` elements `d` attribute.
  ```js
  function renderRegressionLine() {
        
        line = d3.line() // d3's path generator
            .x(d => x0(d.x)) // scale functions (x0, y) ranges are updated to fit the viewport
            .y(d => y(d.y));

        d3.select(".regressionLine")
            .attr('d', line)
    }  
   ```
  

## TODOs  
  - Create custom SI prefix for KOR (만, 천, 백...).   
    Reference:  
    https://github.com/d3/d3-format#installing
    https://github.com/d3/d3-3.x-api-reference/blob/master/Localization.md#locale  
  - Separate data-prep logic from `init` function.  
    Fetching, re-shaping, filtering outliers, clustering, scanning, min/max, ...
  - Study more exmaples of creating legend to the d3 charts
  - Study different ways/best practices to acheive responsiveness on data-vis.
  
  
  

  
