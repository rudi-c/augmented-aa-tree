import * as _ from "underscore";

import { 
    measure,
    numbersToAATree, 
    numbersToIMap, 
    numbersToOMap, 
    numbersToCRBTree, 
    numbersToFRBTree, 
    numbersToMap,
    numbersToSMap,
    profileMeasure,
} from "./helpers"

/*
 * Comparing inserting 100,000 integers
 */
function benchInsertion(numbers: number[]) {
    profileMeasure("AATree", () => {
        measure.keepAlive = numbersToAATree(numbers);
    });

    profileMeasure("Immutable.Map", () => {
        measure.keepAlive = numbersToIMap(numbers);
    });

    profileMeasure("Immutable.OrderedMap", () => {
        measure.keepAlive = numbersToOMap(numbers);
    });

    profileMeasure("@collectable/red-black-tree", () => {
        measure.keepAlive = numbersToCRBTree(numbers);
    });

    profileMeasure("functional-red-black-tree", () => {
        measure.keepAlive = numbersToFRBTree(numbers);
    });

    profileMeasure("Map", () => {
        measure.keepAlive = numbersToMap(numbers);
    });

    profileMeasure("SortedMap", () => {
        measure.keepAlive = numbersToSMap(numbers);
    });
}
console.log("\nTest inserting 100 000 sorted integers");
benchInsertion(_.range(0, 100000));
console.log("\nTest inserting 100 000 reverse sorted integers");
benchInsertion(_.range(0, 100000).reverse());
console.log("\nTest inserting 100 000 shuffled integers");
benchInsertion(_.shuffle(_.range(0, 100000)));
