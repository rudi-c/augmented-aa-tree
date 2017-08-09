import * as Immutable from "immutable";
const createTree = require("functional-red-black-tree");

// Something about the typings of @collectable is broken
// import * as CollectableRBTree from "@collectable/red-black-tree"
const CollectableRBTree = require("@collectable/red-black-tree");

import { AATree } from "../src/aatree";

/*
 * Benchmarking helpers
 */

export function profile(name: string, fn: () => void, repeats: number = 1) {
    console.time(name);
    for (let i = 0; i < repeats; i++) {
        fn();
    }
    console.timeEnd(name);
}

export function measure(fn: () => void) {
    // Cleanup from previous runs
    measure.keepAlive = null;
    global.gc();

    const { heapUsed } = process.memoryUsage();

    fn();

    global.gc();
    const mbs = (process.memoryUsage().heapUsed - heapUsed) / 1024 / 1024;
    console.log(`Memory usage: ${mbs.toFixed(3)} MB`);
}

export function profileMeasure(name: string, fn: () => void) {
    measure(() => profile(name, fn));
}

export namespace measure {
    export let keepAlive: any;
}

// Global variable in which to store things to make sure they stay alive
measure.keepAlive = null;

/*
 * Tree creation helpers for all the different libraries
 */

export function numbersToAATree(numbers: number[]): AATree<number, number> {
    return numbers.reduce((tree, n) => tree.insert(n, n), new AATree<number, number>());
}

export function numbersToIMap(numbers: number[]): Immutable.Map<number, number> {
    return numbers.reduce((imap, n) => imap.set(n, n), Immutable.Map<number, number>());
}

export function numbersToOMap(numbers: number[]): Immutable.OrderedMap<number, number> {
    return numbers.reduce((omap, n) => omap.set(n, n), Immutable.OrderedMap<number, number>());
}

export function numbersToCRBTree(numbers: number[]) {
    return numbers.reduce((rbtree, n) => CollectableRBTree.set(n, n, rbtree),
            CollectableRBTree.emptyWithNumericKeys());
}

export function numbersToFRBTree(numbers: number[]) {
    return numbers.reduce((rbtree, n) => rbtree.insert(n, n), createTree());
}