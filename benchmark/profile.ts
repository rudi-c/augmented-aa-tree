/*
 * Profiling code (only runs AATree code, not comparisons with other implementations)
 */

import * as _ from "underscore";

import {
    numbersToAATree,
    profile,
} from "./helpers";

function run(numbers: number[]) {
    profile("AATree", () => {
        numbersToAATree(numbers);
    });
}

console.log("\nTest inserting 100 000 sorted integers");
run(_.range(0, 100000));
console.log("\nTest inserting 100 000 reverse sorted integers");
run(_.range(0, 100000).reverse());
console.log("\nTest inserting 100 000 shuffled integers");
run(_.shuffle(_.range(0, 100000)));
