import test from "ava";
import * as _ from "underscore";

import { AATree } from "../src/aatree";

test("empty tree produces empty iterator", t => {
    const tree = new AATree();
    t.deepEqual(Array.from(tree.keys()), []);

    t.is(tree.find(0), undefined);
});

function numbersToTree(numbers: number[]): AATree<number, number> {
    return numbers.reduce((tree, n) => tree.insert(n, n), new AATree<number, number>());
}

function keyMatchesValues(t: any, numbers: number[], tree: AATree<number, number>): void {
    numbers.forEach(n => {
        t.is(tree.find(n), n);
    });
}

test("inserting increasing sequence of integers", t => {
    const numbers = _.range(0, 10000);
    const tree = numbersToTree(numbers);
    t.true(tree._maintainsInvariant());
    t.deepEqual(Array.from(tree.keys()), numbers);

    keyMatchesValues(t, numbers, tree);
});

test("inserting decreasing sequence of integers", t => {
    const numbers = _.range(0, 10000);
    const tree = numbersToTree([...numbers].reverse());
    t.true(tree._maintainsInvariant());
    t.deepEqual(Array.from(tree.keys()), numbers);

    keyMatchesValues(t, numbers, tree);
});

test("inserting random sequence of integers", t => {
    const numbers = _.range(0, 10000);
    const tree = numbersToTree(_.shuffle<number>(numbers));
    t.true(tree._maintainsInvariant());
    t.deepEqual(Array.from(tree.keys()), numbers);

    keyMatchesValues(t, numbers, tree);
});

test("remove all the even, then odd numbers", t => {
    const numbers = _.range(0, 5000);
    const tree = numbersToTree(_.shuffle<number>(numbers));
    const [evens, odds] = _.partition(numbers, x => x % 2 === 0);

    const trimmedTree = odds.reduce((tree, n) => tree.remove(n), tree);

    t.true(trimmedTree._maintainsInvariant());
    t.deepEqual(Array.from(trimmedTree.keys()), evens);

    const emptyTree = evens.reduce((tree, n) => tree.remove(n), trimmedTree);

    t.true(emptyTree._maintainsInvariant());
    t.deepEqual(Array.from(emptyTree.keys()), []);
});
