import test from "ava";
import * as _ from "underscore";

import { AATree } from "../src/aatree";
import { OrderStats } from "../src/orderstats";

function isPrime(n: number) {
    for (let i = 2, s = Math.sqrt(n); i <= s; i++) {
        if (n % i === 0) {
            return false;
        }
    }
    return n > 1;
}

test("search for nth element is always correct", t => {
    const numbers = _.range(0, 10000);
    const tree = _.shuffle<number>(numbers).reduce(
        (tree, n) => tree.insert(n, n),
        new AATree<number, number>(),
    );

    numbers.forEach(n => {
        const [k, v] = tree.nth(n)!;
        t.is(n, k);
        t.is(n, v);
    });
    t.is(tree.nth(1.5), undefined);
    t.is(tree.nth(99999999), undefined);

    // Remove odd numbers
    const [evens, odds] = _.partition(numbers, x => x % 2 === 0);
    const trimmedTree = odds.reduce((tree, n) => tree.remove(n), tree);

    _.range(0, 5000).forEach(n => {
        const [k, v] = trimmedTree.nth(n)!;
        t.is(n, k / 2);
        t.is(n, v / 2);
    });
});

class PrimeOrderStats implements OrderStats<number, number> {
    constructor(public primeCount: number) {}

    public of(key: number, value: number, left: PrimeOrderStats, right: PrimeOrderStats): PrimeOrderStats {
        return new PrimeOrderStats(
            (isPrime(value) ? 1 : 0) +
            (left ? left.primeCount : 0) +
            (right ? right.primeCount : 0),
        );
    }
}

test("order statistics on nth prime", t => {
    const numbers = _.range(0, 5);
    const tree = _.shuffle<number>(numbers).reduce(
        (tree, n) => tree.insert(n, n),
        new AATree<number, number>(AATree.defaultComparator, new PrimeOrderStats(0)),
    );

    const primes = numbers.filter(isPrime);
    console.log(tree);
    primes.forEach((prime, index) => {
        console.log(index);
        const [k, v] = tree.nthStat("primeCount", index)!;
        t.is(k, prime);
        t.is(v, prime);
    });
});
