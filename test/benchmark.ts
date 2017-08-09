import * as Immutable from "immutable";
import * as _ from "underscore";
const createTree = require("functional-red-black-tree");

// Something about the typings of @collectable is broken
// import * as CollectableRBTree from "@collectable/red-black-tree"
const CollectableRBTree = require("@collectable/red-black-tree");

import { AATree } from "../src/aatree";

// Global variable in which to store things to make sure they stay alive
let keepAlive: any;

console.log("Running tree benchmarks...");

function profile(name: string, fn: () => void) {
    // Cleanup from previous runs
    keepAlive = null;
    global.gc();

    const { heapUsed } = process.memoryUsage();

    console.time(name);
    fn();
    console.timeEnd(name);

    global.gc();
    const mbs = (process.memoryUsage().heapUsed - heapUsed) / 1024 / 1024;
    console.log(`Memory usage: ${mbs.toFixed(3)} MB`);
}
/*
 * Comparing inserting 100,000 sorted integers
 */
function benchInsertion(numbers: number[]) {
    profile("AATree", () => {
        keepAlive = numbers.reduce((tree, val) => tree.insert(val, val),
            new AATree<number, number>());
    });

    profile("Immutable.Map", () => {
        keepAlive = numbers.reduce((map, val) => map.set(val, val),
            Immutable.Map<number, number>());
    });

    profile("Immutable.OrderedMap", () => {
        keepAlive = numbers.reduce((omap, val) => omap.set(val, val),
            Immutable.OrderedMap<number, number>());
    });

    profile("@collectable/red-black-tree", () => {
        keepAlive = numbers.reduce((rbtree, val) => CollectableRBTree.set(val, val, rbtree),
            CollectableRBTree.emptyWithNumericKeys());
    });

    profile("@functional-red-black-tree", () => {
        keepAlive = numbers.reduce((rbtree, val) => rbtree.insert(val, val),
            createTree());
    });
}
console.log("\nTest inserting 100 000 sorted integers");
benchInsertion(_.range(0, 100000));
console.log("\nTest inserting 100 000 reverse sorted integers");
benchInsertion(_.range(0, 100000).reverse());
console.log("\nTest inserting 100 000 shuffled integers");
benchInsertion(_.shuffle(_.range(0, 100000)));