﻿'use strict';

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
const pathInflectionFirstPercentage = 0.3;
const pathInflectionSecondPercentage = 0.6;
const circleBorderRadius = 9.5; //represents radius + border of circle. used because i havent figured out how to set the endpoint of paths to render before the parent circle

let nodeGroupIdx = 0;

function main() {
    const svgMarginRight = 250;
    const svgMarginLeft = 40;

    // Create and append svg to document
    let visualizer = d3.select('#visualizerDiv')
        .append('svg:svg')
        .classed('visualizer', true)
        .append('svg:g')
        .classed('svgNodeHierarchy', true)
        .attr('transform', 'translate(' + svgMarginLeft + ', 0)');

    // Create hierarchy
    let defaultFileTree = parseJSONFilepathsAsTree(filepaths);
    let hierarchy = d3.hierarchy(defaultFileTree, (d) => {
        return d.descendants;
    });

    // Get svg rect right and top
    let visStyle = getComputedStyle(document.querySelector('.visualizer'));
    let visRight = visStyle.width.replace('px', '') - svgMarginRight;
    let visTop = visStyle.height.replace('px', '');

    // Check visualization mode
    let form = document.querySelector('#visualizationPickerForm');
    form.addEventListener('change', (e) => {
        switch (e.target.value) {
            case 'Cluster':
                displayCluster(hierarchy, [visTop, visRight]);
                updateLayout();
                break;
            case 'Tree':
                displayTree(hierarchy, [visTop, visRight]);
                updateLayout();
                break;
            default:
                displayCluster(hierarchy, [visTop, visRight]);
                updateLayout();
                break;
        }
    });

    // Set standard radio and visualization mode
    form.querySelector('#cluster').checked = true;
    displayCluster(hierarchy, [visTop, visRight]);

    let addNodeDiv = document.querySelector('#addNodeDiv');
    let input = addNodeDiv.querySelector('#addNodeInput');
    input.placeholder = 'enter new node name here';
    let inputButton = addNodeDiv.querySelector('#addNodeSubmit');
    inputButton.addEventListener('click', () => { addSingleNode(input.value); })

    createNodes(visualizer, hierarchy.descendants());

} main();

/*** Returns an object containing objects, matching the directory tree ***/
function parseJSONFilepathsAsTree(JsonFile) {

    if (!JsonFile) {
        console.log('Invalid JSON-file');
        return;
    }

    // A list of lists with split filepaths, where the first item will become parent to the second, the second to the third and so on
    let directoryItems = [];

    // The tree to be returned
    let directoryTree = { descendants: [] };

    let filepathList = JSON.parse(JsonFile);

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
    directoryItems.forEach((item) => {
        addDescendants(directoryTree, item);
    });
    
    return directoryTree;
}

/*** Sets the current D3 layout to Cluster ***/
function displayCluster(hierarchy, size) {
    let cluster = d3.cluster()
        .size(size);
    cluster(hierarchy);
}

/*** Sets the current D3 layout to Tree ***/
function displayTree(hierarchy, size) {
    let tree = d3.tree()
        .size(size);
    tree(hierarchy);
}

/*** Adds paths from node to parent ***/
function addPaths(nodes) {
   nodes.append('path')
        .classed('path', true)
        .attr('d', (d) => {
            if (d && d.parent) {
                // Set curve inflection points to some nice percentages of the path distance
                let pathInflectionFirst = pathInflectionFirstPercentage * (d.y - d.parent.y);
                let pathInflectionSecond = pathInflectionSecondPercentage * (d.y - d.parent.y);
                // Set link/path curvature, use y, x ordering to flip it on its side
                return `M0, 0`                                                              // Move from local 0
                    + `C${d.parent.y - d.y + pathInflectionFirst}, 0`                       // Curve towards parent
                    + ` ${d.parent.y - d.y + pathInflectionSecond}, ${d.parent.x - d.x}`
                    + ` ${d.parent.y - d.y + circleBorderRadius}, ${d.parent.x - d.x}`;
            }
        });
}

/*** Creates nodes according to the input d3.hierarchy ***/
function createNodes(svg, data) {
    // Add nodes to svg
    let nodes = svg.selectAll('.node')
        .data(data)
        .enter()
        .append('svg:g')
        .attr('id', (d) => {
            let name = `nodeGroup_${nodeGroupIdx}_${d.data.name || 'root'}`;
            ++nodeGroupIdx;
            return name;
        })
        .classed('node', true)
        .on('click', d => toggleChildnodesVisibility(d))
        .attr('transform', (d) => { return `translate(${d.y}, ${d.x})` });

    // Add the links/paths between nodes
    addPaths(nodes);

    // Add circle for each node
    addCircles(nodes);

    // Add text with name for each node
    addText(nodes);
}

/*** Appends the name of the node as text ***/
function addText(nodes) {
    nodes.append('text')
        .classed('text', true)
        .text(d => d.data.name);
}

/*** Appends a circle icon ***/
function addCircles(nodes) {
    const radius = 7;
    nodes.append('circle')
        .classed('circle', true)
        .attr('r', radius);
}

/*** Updates any node and path transitions after a layout change ***/
function updateLayout() {
    // Update the nodes
    d3.selectAll('.node')
        .transition()
        .duration(animationDuration)
        .attr('transform', (d) => { return `translate(${d.y}, ${d.x})` });

    // Update the links
    d3.selectAll('.path')
        .transition()
        .duration(animationDuration)
        .attr('d', (d) => {
            if (d && d.parent) {
                // Set curve inflection points to some nice percentages of the path distance
                let pathInflectionFirst = pathInflectionFirstPercentage * (d.y - d.parent.y);
                let pathInflectionSecond = pathInflectionSecondPercentage * (d.y - d.parent.y);
                // Set link/path curvature
                return `M0, 0`
                    + `C${d.parent.y - d.y + pathInflectionFirst}, 0`
                    + ` ${d.parent.y - d.y + pathInflectionSecond}, ${d.parent.x - d.x}`
                    + ` ${d.parent.y - d.y + circleBorderRadius}, ${d.parent.x - d.x}`;
            }
        }
    );
}

function toggleChildnodesVisibility(node) {
    let nodes = selectChildNodes(node);
    if (node.hideChildren) {
        nodes.classed('hidden', false)
            .transition()
            .duration(animationDuration)
            .attr('transform', (d) => { return `translate(${d.y}, ${d.x})` });

        nodes.selectAll('.path')
            .transition()
            .duration(animationDuration)
            .attr('d', (d) => {
                if (d && d.parent) {
                    // Set curve inflection points to some nice percentages of the path distance
                    let pathInflectionFirst = pathInflectionFirstPercentage * (d.y - d.parent.y);
                    let pathInflectionSecond = pathInflectionSecondPercentage * (d.y - d.parent.y);
                    // Set link/path curvature
                    return `M0, 0`
                        + `C${d.parent.y - d.y + pathInflectionFirst}, 0`
                        + ` ${d.parent.y - d.y + pathInflectionSecond}, ${d.parent.x - d.x}`
                        + ` ${d.parent.y - d.y + circleBorderRadius}, ${d.parent.x - d.x}`;
                }
            }
        );

        node.hideChildren = false;
    } else {
        // Remove nodes
        nodes.transition()
            .duration(animationDuration)
            .attr('transform', () => { return `translate(${node.y}, ${node.x})`; })
            .on("end", () => nodes.classed('hidden', true));

        nodes.selectAll('.path')
            .transition()
            .duration(animationDuration)
            .attr('d', (d) => {
                if (d && d.parent) {
                    // Set link/path curvature
                    return `M0, 0`
                        + ` C0, 0`
                        + ` 0, 0`
                        + ` ${circleBorderRadius}, 0`;
                }
            }
        );

        node.hideChildren = true;
    }
}

function selectChildNodes(parent) {
    return d3.selectAll('.node')
        .data(parent)
        .exit()
        .filter(d => {
            if (parent.descendants().slice(1).includes(d)) { // For some reason i get all existing elements and i just cant figure out why, so filter the ones i want
                return d;
            }
        }
    );
}

function addSingleNode(newNodeName) {
}