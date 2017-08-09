import * as Immutable from "immutable";
import * as _ from "underscore";
const createTree = require("functional-red-black-tree");

// Something about the typings of @collectable is broken
// import * as CollectableRBTree from "@collectable/red-black-tree"
const CollectableRBTree = require("@collectable/red-black-tree");

import { AATree } from "../src/aatree";

// Global variable in which to store things to make sure they stay alive
let keepAlive: any;

/*
 * Benchmarking helpers
 */

function profile(name: string, fn: () => void, repeats: number = 1) {
    console.time(name);
    for (let i = 0; i < repeats; i++) {
        fn();
    }
    console.timeEnd(name);
}

function measure(fn: () => void) {
    // Cleanup from previous runs
    keepAlive = null;
    global.gc();

    const { heapUsed } = process.memoryUsage();

    fn();

    global.gc();
    const mbs = (process.memoryUsage().heapUsed - heapUsed) / 1024 / 1024;
    console.log(`Memory usage: ${mbs.toFixed(3)} MB`);
}

function profileMeasure(name: string, fn: () => void) {
    measure(() => profile(name, fn));
}

/*
 * Tree creation helpers for all the different libraries
 */

function numbersToAATree(numbers: number[]): AATree<number, number> {
    return numbers.reduce((tree, n) => tree.insert(n, n), new AATree<number, number>());
}

function numbersToIMap(numbers: number[]): Immutable.Map<number, number> {
    return numbers.reduce((imap, n) => imap.set(n, n), Immutable.Map<number, number>());
}

function numbersToOMap(numbers: number[]): Immutable.OrderedMap<number, number> {
    return numbers.reduce((omap, n) => omap.set(n, n), Immutable.OrderedMap<number, number>());
}

function numbersToCRBTree(numbers: number[]) {
    return numbers.reduce((rbtree, n) => CollectableRBTree.set(n, n, rbtree),
            CollectableRBTree.emptyWithNumericKeys());
}

function numbersToFRBTree(numbers: number[]) {
    return numbers.reduce((rbtree, n) => rbtree.insert(n, n), createTree());
}

/*
 * Benchmarking code
 */

console.log("Running tree benchmarks...");

/*
 * Comparing inserting 100,000 integers
 */
function benchInsertion(numbers: number[]) {
    profileMeasure("AATree", () => {
        keepAlive = numbersToAATree(numbers);
    });

    profileMeasure("Immutable.Map", () => {
        keepAlive = numbersToIMap(numbers);
    });

    profileMeasure("Immutable.OrderedMap", () => {
        keepAlive = numbersToOMap(numbers);
    });

    profileMeasure("@collectable/red-black-tree", () => {
        keepAlive = numbersToCRBTree(numbers);
    });

    profileMeasure("functional-red-black-tree", () => {
        keepAlive = numbersToFRBTree(numbers);
    });
}
console.log("\nTest inserting 100 000 sorted integers");
benchInsertion(_.range(0, 100000));
console.log("\nTest inserting 100 000 reverse sorted integers");
benchInsertion(_.range(0, 100000).reverse());
console.log("\nTest inserting 100 000 shuffled integers");
benchInsertion(_.shuffle(_.range(0, 100000)));

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
}
console.log("\nTest searching with 10 000 sorted integers");
benchFind(_.range(0, 10000), 20);
console.log("\nTest searching with 10 000 reverse sorted integers");
benchFind(_.range(0, 10000).reverse(), 20);
console.log("\nTest searching with 10 000 shuffled integers");
benchFind(_.shuffle(_.range(0, 10000)), 20);

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
}
console.log("\nTest deleting 100 000 sorted integers");
benchRemoval(_.range(0, 100000));
console.log("\nTest deleting 100 000 reverse sorted integers");
benchRemoval(_.range(0, 100000).reverse());
console.log("\nTest deleting 100 000 shuffled integers");
benchRemoval(_.shuffle(_.range(0, 100000)));

/*
 * Comparing adding and removing on a 50,000 sized tree
 */
function benchAddRemove(numbers: number[]) {
    const aaTree = numbersToAATree(numbers.slice(0, numbers.length / 2));
    const addRemovePairs = _.zip(
        numbers.slice(0, numbers.length / 2), 
        numbers.slice(numbers.length / 2, numbers.length)
    ) as Array<[number, number]>;

    profile("AATree", () => {
        addRemovePairs.reduce((tree, [add, remove]) => tree.insert(add, add).remove(remove), aaTree);
    });

    const imap = numbersToIMap(numbers);
    profile("Immutable.Map", () => {
        addRemovePairs.reduce((imap, [add, remove]) => imap.set(add, add).remove(remove), imap);
    });

    const omap = numbersToOMap(numbers);
    profile("Immutable.OrderedMap", () => {
        addRemovePairs.reduce((omap, [add, remove]) => omap.set(add, add).remove(remove), omap);
    });

    const crbTree = numbersToCRBTree(numbers);
    profile("@collectable/red-black-tree", () => {
        addRemovePairs.reduce((crbTree, [add, remove]) =>
            CollectableRBTree.remove(remove, CollectableRBTree.set(add, add, crbTree))
        , crbTree);
    });

    const frbTree = numbersToFRBTree(numbers);
    profile("functional-red-black-tree", () => {
        addRemovePairs.reduce((frbTree, [add, remove]) => frbTree.insert(add, add).remove(remove), frbTree);
    });
}
console.log("\nTest deleting 100 000 sorted integers");
benchAddRemove(_.range(0, 100000));
console.log("\nTest deleting 100 000 reverse sorted integers");
benchAddRemove(_.range(0, 100000).reverse());
console.log("\nTest deleting 100 000 shuffled integers");
benchAddRemove(_.shuffle(_.range(0, 100000)));
