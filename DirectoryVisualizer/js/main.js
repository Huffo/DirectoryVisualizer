'use strict';

const filepaths = JSON.stringify([
    "marvel/black_widow/bw.png",
    "marvel/drdoom/the-doctor.png",
    "fact_marvel_beats_dc.txt",
    "dc/aquaman/mmmmmomoa.png",
    "marvel/black_widow/why-the-widow-is-awesome.txt",
    "dc/aquaman/movie-review-collection.txt",
    "marvel/marvel_logo.png",
    "dc/character_list.txt"
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
function parseJSONDirectoryTreeAsTree() {
    // A list of lists with split filepaths, where the first item will become parent to the second, the second to the third and so on
    let directoryItems = [];

    // The tree to be returned
    let directoryTree = {};

    let filepathList = JSON.parse(filepaths);

    /*** From a list recursively creates child objects to a parent object ***/
    function addChildren(parent, children) {
        // If items is a valid array
        if (Array.isArray(children) && children.length) {
            // if the first item is not in the tree then add it to the tree
            if (!(children[0] in parent)) {
                parent[children[0]] = {};
            }
            // slice off the first item, and recursively add its children
            addChildren(parent[children[0]], children.slice(1));
        }
    }

    // split each filepath into usable arrays
    // i.e. "marvel/black_widow/bw.png" will become [ "marvel", "black_widow", "bw.png" ]
    filepathList.forEach(item => directoryItems.push(item.split('/')));

    // Iterate over the item list and add each item to the tree
    directoryItems.forEach(item => {
        addChildren(directoryTree, item);
    });
    
    return directoryTree;
} console.log(parseJSONDirectoryTreeAsTree());

/*** Returns a list of objects like { name : "marvel", parent : "root", children : ["black_widow", "drdoom", "marvel_logo.png" ] } ***/
function parseJSONDirectoryTreeAsList() {
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
    // i.e. "marvel/black_widow/bw.png" will become [ "marvel", "black_widow", "bw.png" ]
    filepathList.forEach(item => directoryItems.push(item.split('/')));

    // Iterate over the item list and add each item to the list
    directoryItems.forEach(item => {
        makeObject('root', item);
    });

    return directoryList;
} console.log(parseJSONDirectoryTreeAsList());