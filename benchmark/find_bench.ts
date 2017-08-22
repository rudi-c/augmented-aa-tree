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
 * Comparing finding within 10,000 integers
 */
function benchFind(numbers: number[], repeats: number) {
    const aaTree = numbersToAATree(numbers);
    profile("AATree", () => {
        numbers.forEach(n => aaTree.find(n));
    }, repeats);

    const imap = numbersToIMap(numbers);
    profile("Immutable.Map", () => {
        numbers.forEach(n => imap.get(n));
    }, repeats);

    const omap = numbersToOMap(numbers);
    profile("Immutable.OrderedMap", () => {
        numbers.forEach(n => imap.get(n));
    }, repeats);

    const crbTree = numbersToCRBTree(numbers);
    profile("@collectable/red-black-tree", () => {
        numbers.forEach(n => CollectableRBTree.get(n, crbTree));
    }, repeats);

    const frbTree = numbersToFRBTree(numbers);
    profile("functional-red-black-tree", () => {
        numbers.forEach(n => frbTree.find(n));
    }, repeats);

    const map = numbersToMap(numbers);
    profile("Map", () => {
        numbers.forEach(n => map.get(n));
    }, repeats);

    const smap = numbersToSMap(numbers);
    profile("SortedMap", () => {
        numbers.forEach(n => smap.get(n));
    }, repeats);
}
console.log("\nTest searching with 10 000 sorted integers");
benchFind(_.range(0, 10000), 50);
console.log("\nTest searching with 10 000 reverse sorted integers");
benchFind(_.range(0, 10000).reverse(), 50);
console.log("\nTest searching with 10 000 shuffled integers");
benchFind(_.shuffle(_.range(0, 10000)), 50);
