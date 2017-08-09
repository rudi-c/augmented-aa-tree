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
 * Comparing inserting 100,000 sorted integers
 */
function benchInsertion(numbers: number[]) {
    profileMeasure("AATree", () => {
        keepAlive = numbers.reduce((tree, val) => tree.insert(val, val),
            new AATree<number, number>());
    });

    profileMeasure("Immutable.Map", () => {
        keepAlive = numbers.reduce((map, val) => map.set(val, val),
            Immutable.Map<number, number>());
    });

    profileMeasure("Immutable.OrderedMap", () => {
        keepAlive = numbers.reduce((omap, val) => omap.set(val, val),
            Immutable.OrderedMap<number, number>());
    });

    profileMeasure("@collectable/red-black-tree", () => {
        keepAlive = numbers.reduce((rbtree, val) => CollectableRBTree.set(val, val, rbtree),
            CollectableRBTree.emptyWithNumericKeys());
    });

    profileMeasure("@functional-red-black-tree", () => {
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

/*
 * Comparing finding within 10,000 sorted integers
 */
function benchFind(numbers: number[], repeats: number) {
    const aaTree = numbers.reduce((tree, val) => tree.insert(val, val),
        new AATree<number, number>());
    profile("AATree", () => {
        numbers.forEach(n => {
            aaTree.find(n);
        });
    }, repeats);

    const imap = numbers.reduce((map, val) => map.set(val, val),
        Immutable.Map<number, number>());
    profile("Immutable.Map", () => {
        numbers.forEach(n => {
            imap.get(n);
        });
    }, repeats);

    const omap = numbers.reduce((omap, val) => omap.set(val, val),
        Immutable.OrderedMap<number, number>());
    profile("Immutable.OrderedMap", () => {
        numbers.forEach(n => {
            imap.get(n);
        });
    }, repeats);

    const crbTree = numbers.reduce((rbtree, val) => CollectableRBTree.set(val, val, rbtree),
        CollectableRBTree.emptyWithNumericKeys());
    profile("@collectable/red-black-tree", () => {
        numbers.forEach(n => {
            CollectableRBTree.get(n, crbTree);
        });
    }, repeats);

    const frbTree = numbers.reduce((rbtree, val) => rbtree.insert(val, val),
        createTree());
    profile("@functional-red-black-tree", () => {
        numbers.forEach(n => {
            frbTree.find(n);
        });
    }, repeats);
}
console.log("\nTest searching with 10 000 sorted integers");
benchFind(_.range(0, 10000), 20);
console.log("\nTest searching with 10 000 reverse sorted integers");
benchFind(_.range(0, 10000).reverse(), 20);
console.log("\nTest searching with 10 000 shuffled integers");
benchFind(_.shuffle(_.range(0, 10000)), 20);
