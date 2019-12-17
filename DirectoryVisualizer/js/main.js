'use strict';

const filepaths = JSON.stringify([
    'marvel/black_widow/bw.png',
    'marvel/drdoom/the-doctor.png',
    'fact_marvel_beats_dc.txt',
    'dc/aquaman/mmmmmomoa.png',
    'marvel/black_widow/why-the-widow-is-awesome.txt',
    'dc/aquaman/movie-review-collection.txt',
    'marvel/marvel_logo.png',
    'dc/character_list.txt',
    //'test/test/test/test/test/test/test/test.txt',
    //'test/test/test/test/test/test/test.txt',
    //'test/test/test/test/test/test.txt',
    //'test/test/test/test/test.txt',
    //'test/test/test/test.txt',
    //'test/test/test.txt',
    //'test/test.txt',
    //'test/test.txt',
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

const animationDuration = 500;

function main() {
    const svgMarginRight = 250;
    const svgMarginLeft = 40;

    // Create and append svg to document
    let visualizer = d3.select('#visualizerDiv')
        .append('svg:svg')
        .classed('visualizer', true)
        .append('svg:g')
        .attr('transform', 'translate(' + svgMarginLeft + ', 0)');

    // Create hierarchy
    let root = d3.hierarchy(parseJSONFilepathsAsTree(), (d) => {
        return d.descendants;
    });

    // Get svg rect right and top
    let visStyle = getComputedStyle(document.querySelector('.visualizer'));
    let visRight = visStyle.width.replace('px', '') - svgMarginRight;
    let visTop = visStyle.height.replace('px', '');

    // Check visualization mode
    let form = document.querySelector('#visualizationPickerForm');
    form.addEventListener('change', e => {
        switch (e.target.value) {
            case 'Cluster':
                displayCluster(root, [visTop, visRight]);
                updateLayout(visualizer);
                break;
            case 'Tree':
                displayTree(root, [visTop, visRight]);
                updateLayout(visualizer);
                break;
            default:
                displayCluster(root, [visTop, visRight]);
                updateLayout(visualizer);
                break;
        }
    });

    // Default visualization mode
    displayCluster(root, [visTop, visRight]);

    createNodes('#visualizerDiv', root);

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

function addPaths(svgId, parentClass) {
    d3.select(svgId)
        .selectAll(parentClass)
        .append('path')
        .classed('path', true)
        .attr('d', (d) => {
            if (d && d.parent) {
                // Set curve inflection points to some nice percentages of the path distance
                let pathInflectionFirst = 0.3 * (d.y - d.parent.y);
                let pathInflectionSecond = 0.6 * (d.y - d.parent.y);
                // Set link/path curvature
                return `M0, 0`
                    + `C${d.parent.y - d.y + pathInflectionFirst}, 0`
                    + ` ${d.parent.y - d.y + pathInflectionSecond}, ${d.parent.x - d.x}`
                    + ` ${d.parent.y - d.y + 9.5}, ${d.parent.x - d.x}`;    // + 9.5 because i havent figured out how to set the endpoint of the path to render before the parent circle, 9.5 represents radius + border
            }
        });
}

function createNodes(svgId, root) {
    console.log(d3.select(svgId));
    // Add nodes to svg
    d3.select(svgId)
        .select('g')
        .selectAll('.node')
        .data(root.descendants())
        .enter()
        .append('svg:g')
        .attr('id', 'nodeGroup')    // TODO set an actual identifier
        .classed('node', true)
        .on('click', d => { updateNode(d); })
        .attr('transform', d => { return `translate(${d.y}, ${d.x})` });

    // Add the links/paths between nodes
    addPaths(svgId, '.node');

    // Add circle for each node
    addCircles(svgId, '.node');

    // Add text with name for each node
    addText(svgId, '.node');
}

function addText(svgId, parentClass) {
    d3.select(svgId)
        .selectAll(parentClass)
        .append('text')
        .classed('text', true)
        .text(d => d.data.name);
}

function addCircles(svgId, parentClass) {
    const radius = 7;

    d3.select(svgId)
        .selectAll(parentClass)
        .append('circle')
        .classed('circle', true)
        .attr('r', radius);
}

function updateLayout(svg) {
    // Update the nodes
    svg.selectAll('g')
        .transition()
        .duration(animationDuration)
        .attr('transform', d => { return `translate(${d.y}, ${d.x})` });

    // Update the links
    svg.selectAll('path')
        .transition()
        .duration(animationDuration)
        .attr('d', (d) => {
            if (d && d.parent) {
                // Set curve inflection points to some nice percentages of the path distance
                let pathInflectionFirst = 0.3 * (d.y - d.parent.y);
                let pathInflectionSecond = 0.6 * (d.y - d.parent.y);
                // Set link/path curvature
                return `M0, 0`
                    + `C${d.parent.y - d.y + pathInflectionFirst}, 0`
                    + ` ${d.parent.y - d.y + pathInflectionSecond}, ${d.parent.x - d.x}`
                    + ` ${d.parent.y - d.y + 9.5}, ${d.parent.x - d.x}`;
            }
        }
    );
}


// **** BROKEN STUFF - WORK IN PROGRESS **** //
function updateNode(node) {
    //enterNodes('#visualizerDiv', node);
    //exitNodes('#visualizerDiv', node);
}

function enterNodes(svgId, node) {
    // Add nodes to svg
    d3.select(svgId)
        .selectAll('.node')
        .data(node.descendants())
        .enter()
        .append('svg:g')
        .attr('id', 'nodeGroup')    // TODO set an actual identifier
        .classed('node', true)
        .on('click', d => { toggleNode(d); updateNode(d); })
        .attr('transform', d => { console.log(d); return `translate(${d.y}, ${d.x})` });
    
    // Add the links/paths between nodes
    addPaths(svgId, '.node');
    
    // Add circle for each node
    addCircles(svgId, '.node');
    
    // Add text with name for each node
    addText(svgId, '.node');
}

function exitNodes(svgId, node) {
    // Add nodes to svg
    d3.select(svgId)
        .selectAll('.node')
        .data(node.descendants())
        .exit()
        .transition()
        .duration(animationDuration)
        .attr('transform', function (d) { console.log(d); return `translate(${d.parent.y}, ${d.parent.x})`; })
        .remove();
}
