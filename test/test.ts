import test from "ava";
import * as _ from "underscore";

import { AATree } from "../src/aatree";

test("empty tree produces empty iterator", t => {
    const tree = new AATree();
    t.deepEqual(Array.from(tree.keys()), []);

    t.is(tree.find(0), undefined);
});

test("inserting increasing sequence of integers", t => {
    const numbers = _.range(0, 10000);
    const tree = numbers.reduce((tree, val) => tree.insert(val, val), new AATree<number, number>());
    t.deepEqual(Array.from(tree.keys()), numbers);

    numbers.forEach(n => {
        t.is(tree.find(n), n);
    });
});

test("inserting decreasing sequence of integers", t => {
    const numbers = _.range(0, 10000);
    const tree = numbers.reduceRight((tree, val) => tree.insert(val, val), new AATree<number, number>());
    t.deepEqual(Array.from(tree.keys()), numbers);

    numbers.forEach(n => {
        t.is(tree.find(n), n);
    });
});

test("inserting random sequence of integers", t => {
    const numbers = _.range(0, 10000);
    const tree = _.shuffle<number>(numbers)
        .reduce((tree, val) => tree.insert(val, val), new AATree<number, number>());
    t.deepEqual(Array.from(tree.keys()), numbers);

    numbers.forEach(n => {
        t.is(tree.find(n), n);
    });
});
