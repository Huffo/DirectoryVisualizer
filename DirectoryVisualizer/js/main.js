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

function makeD3Cluster() {
    const visualizerWidth = 800;
    const visualizerHeight = 460;
    const svgMarginRight = 250;
    const svgMarginLeft = 40;
    const svgPathInflectionFirst = 50;
    const svgPathInflectionSecond = 150;
    const circleFillColor = '#ff9a2e';
    const circleBorderColor = '#545454';
    const textColor = 'black';
    const textFont = 'helvetica';

    // Create and append svg to document
    let svg = d3.select('#visualizer')
        .append('svg')
        .attr('width', visualizerWidth)
        .attr('height', visualizerHeight)
        .append('g')
        .attr('transform', 'translate(' + svgMarginLeft + ',0)');

    // Create cluster layout
    let cluster = d3.cluster()
        .size([visualizerHeight, visualizerWidth - svgMarginRight]);

    // Add hierarchy to cluster
    let root = d3.hierarchy(parseJSONFilepathsAsTree(), (d) => {
        return d.descendants;
    });
    cluster(root);

    // Add the links/paths between nodes:
    svg.selectAll('path')
        .data(root.descendants().slice(1))
        .enter()
        .append('path')
        .attr('d', (d) => {
            // Set link/path curvature
            return 'M' + d.y + ',' + d.x
                + 'C' + (d.parent.y + svgPathInflectionFirst) + ',' + d.x
                + ' ' + (d.parent.y + svgPathInflectionSecond) + ',' + d.parent.x
                + ' ' + d.parent.y + ',' + d.parent.x;
        })
        .style('fill', 'none')
        .attr('stroke', '#ccc');

    // Add a circle for each node.
    svg.selectAll('g')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('transform', d => {
            return 'translate(' + d.y + ',' + d.x + ')'
        })
        .append('circle')
        .attr('r', 7)
        .style('fill', circleFillColor)
        .attr('stroke', circleBorderColor)
        .style('stroke-width', 5);

    svg.selectAll('g')
        .append('text')
        .attr('transform', 'rotate(10 10, 10) translate(-10 -10)')
        .attr('fill', textColor)
        .attr('font', textFont)
        .text(d => d.data.name);
} makeD3Cluster();
