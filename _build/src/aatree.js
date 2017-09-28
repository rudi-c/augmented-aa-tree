"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function level(node) {
    return node ? node.level : 0;
}
function size(node) {
    return node ? node.size : 0;
}
function getStat(node, stat) {
    return node ? node.orderStats[stat] : 0;
}
function isSingle(node) {
    if (node === null) {
        return true;
    }
    else {
        return level(node) > level(node.right);
    }
}
function maintainsInvariant(node) {
    if (node === null) {
        return true;
    }
    else if (level(node) !== level(node.left) + 1) {
        return false;
    }
    else if (level(node) !== level(node.right) && level(node) !== level(node.right) + 1) {
        return false;
    }
    else if (node.right && level(node) <= level(node.right.right)) {
        return false;
    }
    else {
        return maintainsInvariant(node.left) && maintainsInvariant(node.right);
    }
}
function last(node) {
    if (node.right === null) {
        return [node.key, node.value];
    }
    else {
        return last(node.right);
    }
}
function* iter(node) {
    if (node === null) {
        return;
    }
    else {
        yield* iter(node.left);
        yield [node.key, node.value];
        yield* iter(node.right);
    }
}
function nth(node, n) {
    if (node === null) {
        return undefined;
    }
    else {
        const leftSize = size(node.left);
        if (n === leftSize) {
            return [node.key, node.value];
        }
        else if (n < leftSize) {
            return nth(node.left, n);
        }
        else {
            return nth(node.right, n - leftSize - 1);
        }
    }
}
function nthStat(node, stat, x) {
    if (node === null) {
        return undefined;
    }
    else {
        const weight = getStat(node, stat);
        const leftWeight = getStat(node.left, stat);
        const rightWeight = getStat(node.right, stat);
        const own = weight - leftWeight - rightWeight;
        if (x < leftWeight) {
            return nthStat(node.left, stat, x);
        }
        else if (x === leftWeight + own - 1) {
            return [node.key, node.value];
        }
        else {
            return nthStat(node.right, stat, x - leftWeight - own);
        }
    }
}
class AATree {
    constructor(comparator = AATree.defaultComparator, orderStatsTemplate = null, root = null) {
        this.root = root;
        this.orderStatsTemplate = orderStatsTemplate;
        this.comparator = comparator;
    }
    static defaultComparator(a, b) {
        if (a < b) {
            return "lt";
        }
        else if (a > b) {
            return "gt";
        }
        else {
            return "eq";
        }
    }
    size() {
        return size(this.root);
    }
    insert(key, value) {
        const self = this;
        function _insert(node) {
            if (node == null) {
                return self.node(key, value, null, null, 1);
            }
            else {
                switch (self.comparator(key, node.key)) {
                    case "eq":
                        return self.node(node.key, value, node.left, node.right, node.level);
                    case "lt":
                        return self.split(self.skew(self.node(node.key, node.value, _insert(node.left), node.right, node.level)));
                    case "gt":
                        return self.split(self.skew(self.node(node.key, node.value, node.left, _insert(node.right), node.level)));
                    default:
                        throw new Error("TODO");
                }
            }
        }
        return new AATree(this.comparator, this.orderStatsTemplate, _insert(this.root));
    }
    remove(key) {
        const self = this;
        function _remove(node) {
            if (node === null) {
                return null;
            }
            else {
                switch (self.comparator(key, node.key)) {
                    case "eq":
                        if (node.left === null) {
                            return node.right;
                        }
                        else if (node.right === null) {
                            return node.left;
                        }
                        else {
                            const [lastKey, lastValue] = last(node.left);
                            return self.adjust(self.node(lastKey, lastValue, self.deleteLast(node.left), node.right, node.level));
                        }
                    case "lt":
                        return self.adjust(self.node(node.key, node.value, _remove(node.left), node.right, node.level));
                    case "gt":
                        return self.adjust(self.node(node.key, node.value, node.left, _remove(node.right), node.level));
                    default:
                        throw new Error("TODO");
                }
            }
        }
        return new AATree(this.comparator, this.orderStatsTemplate, _remove(this.root));
    }
    find(key) {
        const self = this;
        function _find(node) {
            if (node === null) {
                return undefined;
            }
            else {
                switch (self.comparator(key, node.key)) {
                    case "eq":
                        return node.value;
                    case "lt":
                        return _find(node.left);
                    case "gt":
                        return _find(node.right);
                    default:
                        throw new Error("TODO");
                }
            }
        }
        return _find(this.root);
    }
    findIndexOf(key) {
        const self = this;
        function _find(node, nodesOnTheLeftSide) {
            if (node === null) {
                return undefined;
            }
            else {
                switch (self.comparator(key, node.key)) {
                    case "eq":
                        return nodesOnTheLeftSide + size(node.left);
                    case "lt":
                        return _find(node.left, nodesOnTheLeftSide);
                    case "gt":
                        return _find(node.right, nodesOnTheLeftSide + size(node.left) + 1);
                    default:
                        throw new Error("TODO");
                }
            }
        }
        return _find(this.root, 0);
    }
    findStatOf(key, stat) {
        const self = this;
        function _find(node, weightOnTheLeftSide) {
            if (node === null) {
                return undefined;
            }
            else {
                const leftAndOwn = getStat(node, stat) - getStat(node.right, stat);
                switch (self.comparator(key, node.key)) {
                    case "eq":
                        return weightOnTheLeftSide + leftAndOwn;
                    case "lt":
                        return _find(node.left, weightOnTheLeftSide);
                    case "gt":
                        return _find(node.right, weightOnTheLeftSide + leftAndOwn);
                    default:
                        throw new Error("TODO");
                }
            }
        }
        return _find(this.root, 0);
    }
    // Zero-indexed nth
    nth(n) {
        return nth(this.root, n);
    }
    nthStat(stat, x) {
        return nthStat(this.root, stat, x);
    }
    // Use Array.from(tree.iter()) to get an array
    iter() {
        return iter(this.root);
    }
    *keys() {
        for (const kv of this.iter()) {
            const [key, _val] = kv;
            yield key;
        }
    }
    _maintainsInvariant() {
        return maintainsInvariant(this.root);
    }
    node(key, value, left, right, level) {
        return {
            key, value, left, right, level,
            size: 1 + size(left) + size(right),
            orderStats: this.orderStatsTemplate &&
                this.orderStatsTemplate.of(key, value, left && left.orderStats, right && right.orderStats),
        };
    }
    deleteLast(node) {
        if (node.right === null) {
            return node.left;
        }
        else {
            return this.adjust(this.node(node.key, node.value, node.left, this.deleteLast(node.right), node.level));
        }
    }
    split(node) {
        if (node.right && node.right.right &&
            node.right.level === node.level &&
            node.right.right.level === node.level) {
            return this.node(node.right.key, node.right.value, this.node(node.key, node.value, node.left, node.right.left, node.level), node.right.right, node.level + 1);
        }
        else {
            return node;
        }
    }
    skew(node) {
        if (node.left && node.left.level === node.level) {
            return this.node(node.left.key, node.left.value, node.left.left, this.node(node.key, node.value, node.left.right, node.right, node.level), node.left.level);
        }
        else {
            return node;
        }
    }
    adjust(node) {
        if (level(node.right) >= level(node) - 1 &&
            level(node.left) >= level(node) - 1) {
            return node;
        }
        else if (level(node) > level(node.right) + 1) {
            // Right child is two levels below the node
            if (isSingle(node.left)) {
                return this.skew(this.node(node.key, node.value, node.left, node.right, node.level - 1));
            }
            else {
                const nleft = node.left;
                return this.node(nleft.right.key, nleft.right.value, this.node(nleft.key, nleft.value, nleft.left, nleft.right.left, nleft.level), this.node(node.key, node.value, nleft.right.right, node.right, node.level - 1), node.level);
            }
        }
        else {
            // Left child is two levels below the node
            if (isSingle(node)) {
                return this.split(this.node(node.key, node.value, node.left, node.right, node.level - 1));
            }
            else {
                const nleft = node.left;
                const nright = node.right;
                const a = nright.left;
                const nrightLevel = isSingle(a) ? nright.level - 1 : nright.level;
                return this.node(a.key, a.value, this.node(node.key, node.value, node.left, a.left, node.level - 1), this.split(this.node(nright.key, nright.value, a.right, nright.right, nrightLevel)), a.level + 1);
            }
        }
    }
}
exports.AATree = AATree;
