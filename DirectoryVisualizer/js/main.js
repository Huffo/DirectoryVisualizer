'use strict';

const filepaths = JSON.stringify([
    'marvel/black_widow/bw.png',
    'marvel/drdoom/the-doctor.png',
    'fact_marvel_beats_dc.txt',
    'dc/aquaman/mmmmmomoa.png',
    'marvel/black_widow/why-the-widow-is-awesome.txt',
    'dc/aquaman/movie-review-collection.txt',
    'marvel/marvel_logo.png',
    'dc/character_list.txt'
]);

/*
 *  groot
 *  |------ marvel
 *  |       |------- black_widow
 *  |       |        |---------- bw.png
 *  |       |        |---------- why-the-widow-is-awesome.txt
 *  |       |
 *  |       |------- drdoom 
 *  |       |        |---------- the-doctor.png
 *  |       |
 *  |       |------- marvel_logo.png
 *  |
 *  |------ fact_marvel_beats_dc.txt
 *  |
 *  |------ dc
 *          |------- aquaman
 *          |        |---------- mmmmmomoa.png
 *          |        |---------- movie-review-collection.txt
 *          |
 *          |------- dc/character_list.txt
 *
 */

function main() {
    const visualizerWidth = 800;
    const visualizerHeight = 460;
    const svgMarginRight = 250;
    const svgMarginLeft = 40;

    // Create and append svg to document
    let visualizer = d3.select('#visualizerDiv')
        .append('svg:svg')
        .attr('width', visualizerWidth)
        .attr('height', visualizerHeight)
        .append('svg:g')
        .attr('transform', 'translate(' + svgMarginLeft + ',0)');

    // Create hierarchy
    let root = d3.hierarchy(parseJSONFilepathsAsTree(), (d) => {
        return d.descendants;
    });

    // Check visualization mode
    let form = document.querySelector('#visualizationPickerForm');
    form.addEventListener('change', e => {
        switch (e.target.value) {
            case 'Cluster':
                displayCluster(root, [visualizerHeight, visualizerWidth - svgMarginRight]);
                update(visualizer);
                break;
            case 'Tree':
                displayTree(root, [visualizerHeight, visualizerWidth - svgMarginRight]);
                update(visualizer);
                break;
            default:
                displayCluster(root, [visualizerHeight, visualizerWidth - svgMarginRight]);
                update(visualizer);
                break;
        }
    });

    // Default visualization mode
    displayCluster(root, [visualizerHeight, visualizerWidth - svgMarginRight]);

    // Add the links/paths between nodes
    addPaths(visualizer, root);

    // Add nodes to svg
    addNodes(visualizer, root);

    // Add circle for each node
    addCircle(visualizer, root);

    // Add text with name for each node
    addText(visualizer, root);
} main();

/*** Returns an object containing objects, matching the directory tree ***/
function parseJSONFilepathsAsTree() {
    // A list of lists with split filepaths, where the first item will become parent to the second, the second to the third and so on
    let directoryItems = [];

    // The tree to be returned
    let directoryTree = { descendants: [] };

    let filepathList = JSON.parse(filepaths);

    /*** From a list recursively creates descendant objects to an ancestor object ***/
    function addDescendants(ancestor, descendantList) {
        // If descendantList is a valid array
        if (Array.isArray(descendantList) && descendantList.length && typeof descendantList[0] === 'string') {
            let existingDescendant = ancestor.descendants.find(descendant => descendant.name === descendantList[0]);
            // Add the first descendant if its not in ancestor.descendants, else use existing object
            if (!existingDescendant) {
                existingDescendant = { name: descendantList[0], descendants: [] };
                ancestor.descendants.push(existingDescendant);
            }
            // slice off descendant we just handled, and recursively add its following descendants
            addDescendants(existingDescendant, descendantList.slice(1));
        }
    }

    // split each filepath into usable arrays
    // i.e. 'marvel/black_widow/bw.png' will become [ 'marvel', 'black_widow', 'bw.png' ]
    filepathList.forEach(item => directoryItems.push(item.split('/')));

    // Iterate over the item list and add each item to the tree
    directoryItems.forEach(item => {
        addDescendants(directoryTree, item);
    });
    
    return directoryTree;
}

/*** Returns a list of objects like { name : 'marvel', parent : 'root', children : ['black_widow', 'drdoom', 'marvel_logo.png' ] } ***/
function parseJSONFilepathsAsList() {
    // A list of lists with split filepaths, where the first item will become parent to the second, the second to the third and so on
    let directoryItems = [];

    // The list of objects to be returned
    let directoryList = [];

    let filepathList = JSON.parse(filepaths);

    function makeObject(parent, child) {
        // break recursion if invalid list
        if (!Array.isArray(child) || !child.length) {
            return;
        }

        // Add items not in list
        if (!directoryList.find(listItem => listItem.name === child[0])) {
            directoryList.push({ name: child[0], parent: parent, children: [] });
        }

        // Add this child as a child to its parent if not already present
        let parentObj = directoryList.find(listItem => listItem.name === parent);
        if (parentObj && !parentObj.children.find(objChild => objChild.name === child[0])) {
            parentObj.children.push(child[0]);
        } // else assume parent is root and is untracked
        makeObject(child[0], child.slice(1));
    }

    // split each filepath into usable arrays
    // i.e. 'marvel/black_widow/bw.png' will become [ 'marvel', 'black_widow', 'bw.png' ]
    filepathList.forEach(item => directoryItems.push(item.split('/')));

    // Iterate over the item list and add each item to the list
    directoryItems.forEach(item => {
        makeObject('root', item);
    });

    return directoryList;
}

function displayCluster(root, size) {
    let cluster = d3.cluster()
        .size(size);
    cluster(root);
}

function displayTree(root, size) {
    let tree = d3.tree()
        .size(size);
    tree(root);
}

function addPaths(svg, hierarchy) {
    const pathInflectionFirst = 50;
    const pathInflectionSecond = 150;
    const pathColor = '#aaa';
    const pathStyle = 'none';

    svg.selectAll('path')
        .data(hierarchy.descendants().slice(1))
        .enter()
        .append('svg:g')
        .classed('path', true)
        .attr('d', (d) => {
            // Set link/path curvature
            return `M${d.y}, ${d.x}`
                + `C${d.parent.y + pathInflectionFirst}, ${d.x}`
                + ` ${d.parent.y + pathInflectionSecond}, ${d.parent.x}`
                + ` ${d.parent.y}, ${d.parent.x}`;
        })
        .append('path')
        .attr('d', (d) => {
            // Set link/path curvature
            return `M${d.y}, ${d.x}`
                +  `C${d.parent.y + pathInflectionFirst}, ${d.x}`
                +  ` ${d.parent.y + pathInflectionSecond}, ${d.parent.x}`
                +  ` ${d.parent.y}, ${d.parent.x}`;
        })
        .style('fill', pathStyle)
        .attr('stroke', pathColor);
}

function addNodes(svg, hierarchy) {
    svg.selectAll('node')
        .data(hierarchy.descendants())
        .enter()
        .append('svg:g')
        .classed('node', true)
        .attr('transform', d => { return `translate(${d.y}, ${d.x})` })
        .on('click', d => { toggleNode(d); updateNode(d); });
}

function addText(svg, hierarchy) {
    const textColor = 'black';
    const textFont = 'helvetica';
    const textFontSize = 16;

    svg.selectAll('text')
        .data(hierarchy.descendants())
        .enter()
        .append('svg:g')
        .classed('text', true)
        .attr('transform', d => { return `translate(${d.y}, ${d.x})` })             // D3, seems to handle translations as 'translateTo'
        .append('text')
        .attr('transform', () => { return `rotate(10 10, 40) translate(-10 -10)` }) // CSS, seems to handle translations as 'translateBy', fairly uncertain but behaviour does seem different
        .attr('fill', textColor)
        .attr('font', textFont)
        .attr('font-size', textFontSize)
        .text(d => d.data.name);
}

function addCircle(svg, hierarchy) {
    const defRadius = 7;
    const defCircleFillColor = '#ff9a2e';       // TODO move to css
    const defCircleBorderColor = '#545454';
    const defBorderthickness = 5;
    
    svg.selectAll('circle')
        .data(hierarchy.descendants())
        .enter()
        .append('svg:g')
        .classed('circle', true)
        .attr('transform', d => { return `translate(${d.y}, ${d.x})` })
        .append('circle')
        .attr('r', defRadius)
        .style('fill', defCircleFillColor)
        .attr('stroke', defCircleBorderColor)
        .style('stroke-width', defBorderthickness);
}

function nodeEnter(root, layout) {

}

function nodeExit() {

}

function update(svg) {
    const animationDuration = 500;
    const pathInflectionFirst = 50; // TODO Duplicated const, find fix or go global
    const pathInflectionSecond = 150;

    let nodes = svg.selectAll('g')

    // Update the nodes…
    nodes.transition()
        .duration(animationDuration)
        .attr('transform', d => { return `translate(${d.y}, ${d.x})` });

    // Update the links
    svg.selectAll('path')       // TODO figure out why these elements are nesting, fix that and i can skip duplicating this code
        .transition()
        .duration(animationDuration)
        .attr('d', (d) => {
            // Set link/path curvature
            return `M${d.y}, ${d.x}`
                + `C${d.parent.y + pathInflectionFirst}, ${d.x}`
                + ` ${d.parent.y + pathInflectionSecond}, ${d.parent.x}`
                + ` ${d.parent.y}, ${d.parent.x}`;
        })
    svg.selectAll('g.path')
        .transition()
        .duration(animationDuration)
        .attr('d', (d) => {
            // Set link/path curvature
            return `M${d.y}, ${d.x}`
                + `C${d.parent.y + pathInflectionFirst}, ${d.x}`
                + ` ${d.parent.y + pathInflectionSecond}, ${d.parent.x}`
                + ` ${d.parent.y}, ${d.parent.x}`;
        })
}

function toggle() {
}
