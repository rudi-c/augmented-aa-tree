import * as _ from "underscore";

import { 
    profile,
    numbersToAATree, 
    numbersToIMap, 
    numbersToOMap, 
    numbersToCRBTree, 
    numbersToFRBTree, 
    numbersToMap,
    numbersToSMap,
    profileMeasure,
} from "./helpers"

const CollectableRBTree = require("@collectable/red-black-tree");

/*
 * Comparing removing 100,000 numbers from tree
 */
function benchRemoval(numbers: number[]) {
    const aaTree = numbersToAATree(numbers);
    profile("AATree", () => {
        numbers.reduce((tree, n) => tree.remove(n), aaTree);
    });

    const imap = numbersToIMap(numbers);
    profile("Immutable.Map", () => {
        numbers.reduce((imap, n) => imap.remove(n), imap);
    });

    const omap = numbersToOMap(numbers);
    profile("Immutable.OrderedMap", () => {
        numbers.reduce((omap, n) => omap.remove(n), omap);
    });

    const crbTree = numbersToCRBTree(numbers);
    profile("@collectable/red-black-tree", () => {
        numbers.reduce((crbt, n) => CollectableRBTree.remove(n, crbt), crbTree);
    });

    const frbTree = numbersToFRBTree(numbers);
    profile("functional-red-black-tree", () => {
        numbers.reduce((frbt, n) => frbt.remove(n), frbTree);
    });

    const map = numbersToMap(numbers);
    profile("Map", () => {
        numbers.forEach(n => map.delete(n));
    });

    const smap = numbersToSMap(numbers);
    profile("SortedMap", () => {
        numbers.forEach(n => smap.delete(n));
    });
}
console.log("\nTest deleting 100 000 sorted integers");
benchRemoval(_.range(0, 100000));
console.log("\nTest deleting 100 000 reverse sorted integers");
benchRemoval(_.range(0, 100000).reverse());
console.log("\nTest deleting 100 000 shuffled integers");
benchRemoval(_.shuffle(_.range(0, 100000)));
