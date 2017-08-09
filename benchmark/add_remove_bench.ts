import * as _ from "underscore";

import { 
    profile,
    numbersToAATree, 
    numbersToIMap, 
    numbersToOMap, 
    numbersToCRBTree, 
    numbersToFRBTree, 
    profileMeasure,
} from "./helpers"

const CollectableRBTree = require("@collectable/red-black-tree");

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