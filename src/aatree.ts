import { OrderStats } from "./orderstats";

export type Comparator<K> = (a: K, b: K) => "lt" | "eq" | "gt";

interface AANode<K, V> {
    key: K;
    value: V;
    left: AANode<K, V> | null;
    right: AANode<K, V> | null;
    level: number;
    size: number;
    orderStats: OrderStats<K, V> | null;
}

function level<K, V>(node: AANode<K, V> | null): number {
    return node ? node.level : 0;
}

function size<K, V>(node: AANode<K, V> | null): number {
    return node ? node.size : 0;
}

function getStat<K, V>(node: AANode<K, V> | null, stat: string): number {
    return node ? (node.orderStats! as any)[stat] : 0;
}

function isSingle<K, V>(node: AANode<K, V> | null): boolean {
    if (node === null) {
        return true;
    } else {
        return level(node) > level(node.right);
    }
}

function maintainsInvariant<K, V>(node: AANode<K, V> | null): boolean {
    if (node === null) {
        return true;
    } else if (level(node) !== level(node.left) + 1) {
        return false;
    } else if (level(node) !== level(node.right) && level(node) !== level(node.right) + 1) {
        return false;
    } else if (node.right && level(node) <= level(node.right.right)) {
        return false;
    } else {
        return maintainsInvariant(node.left) && maintainsInvariant(node.right);
    }
}

function last<K, V>(node: AANode<K, V>): [K, V] {
    if (node.right === null) {
        return [node.key, node.value];
    } else {
        return last(node.right);
    }
}

function *iter<K, V>(node: AANode<K, V> | null): IterableIterator<[K, V]> {
    if (node === null) {
        return;
    } else {
        yield *iter(node.left);
        yield [node.key, node.value];
        yield *iter(node.right);
    }
}

function nth<K, V>(node: AANode<K, V> | null, n: number): [K, V] | undefined {
    if (node === null) {
        return undefined;
    } else {
        const leftSize = size(node.left);
        if (n === leftSize) {
            return [node.key, node.value];
        } else if (n < leftSize) {
            return nth(node.left, n);
        } else {
            return nth(node.right, n - leftSize - 1);
        }
    }
}

function nthStat<K, V>(node: AANode<K, V> | null, stat: string, x: number): [K, V] | undefined {
    if (node === null) {
        return undefined;
    } else {
        const weight = getStat(node, stat);
        const leftWeight = getStat(node.left, stat);
        const rightWeight = getStat(node.right, stat);
        const own = weight - leftWeight - rightWeight;
        if (x < leftWeight) {
            return nthStat(node.left, stat, x);
        } else if (x === leftWeight + own - 1) {
            return [node.key, node.value];
        } else {
            return nthStat(node.right, stat, x - leftWeight - own);
        }
    }
}

export class AATree<K, V> {
    public static defaultComparator<K>(a: K, b: K) {
        if (a < b) {
            return "lt";
        } else if (a > b) {
            return "gt";
        } else {
            return "eq";
        }
    }

    private root: AANode<K, V> | null;
    private comparator: Comparator<K>;
    private orderStatsTemplate: OrderStats<K, V> | null;

    private constructor(comparator: Comparator<K> = AATree.defaultComparator,
                        orderStatsTemplate: OrderStats<K, V> | null = null,
                        root: AANode<K, V> | null) {
        this.root = root;
        this.orderStatsTemplate = orderStatsTemplate;
        this.comparator = comparator;
    }

    public static empty<K, V>(comparator: Comparator<K> = AATree.defaultComparator,
                              orderStatsTemplate: OrderStats<K, V> | null = null) {
        return new AATree<K, V>(comparator, orderStatsTemplate, null)
    }

    public size(): number {
        return size(this.root);
    }

    public insert(key: K, value: V): AATree<K, V> {
        const self = this;
        function _insert(node: AANode<K, V> | null): AANode<K, V> {
            if (node == null) {
                return self.node(key, value, null, null, 1);
            } else {
                switch (self.comparator(key, node.key)) {
                    case "eq":
                        return self.node(node.key, value, node.left, node.right, node.level);
                    case "lt":
                        return self.split(self.skew(self.node(
                            node.key, node.value, _insert(node.left), node.right, node.level)));
                    case "gt":
                        return self.split(self.skew(self.node(
                            node.key, node.value, node.left, _insert(node.right), node.level)));
                    default:
                        throw new Error("TODO");
                }
            }
        }

        return new AATree(this.comparator, this.orderStatsTemplate, _insert(this.root));
    }

    public remove(key: K): AATree<K, V> {
        const self = this;
        function _remove(node: AANode<K, V> | null): AANode<K, V> | null {
            if (node === null) {
                return null;
            } else {
                switch (self.comparator(key, node.key)) {
                    case "eq":
                        if (node.left === null) {
                            return node.right;
                        } else if (node.right === null) {
                            return node.left;
                        } else {
                            const [lastKey, lastValue] = last(node.left);
                            return self.adjust(self.node(lastKey, lastValue, self.deleteLast(node.left),
                                                         node.right, node.level));
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

    public find(key: K): V | undefined {
        const self = this;
        function _find(node: AANode<K, V> | null): V | undefined {
            if (node === null) {
                return undefined;
            } else {
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

    public findIndexOf(key: K): number | undefined {
        const self = this;
        function _find(node: AANode<K, V> | null, nodesOnTheLeftSide: number): number | undefined {
            if (node === null) {
                return undefined;
            } else {
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

    public findStatOf(key: K, stat: string): number | undefined {
        const self = this;
        function _find(node: AANode<K, V> | null, weightOnTheLeftSide: number): number | undefined {
            if (node === null) {
                return undefined;
            } else {
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
    public nth(n: number): [K, V] | undefined {
        return nth(this.root, n);
    }

    public nthStat(stat: string, x: number): [K, V] | undefined {
        return nthStat(this.root, stat, x);
    }

    // Use Array.from(tree.iter()) to get an array
    public iter(): IterableIterator<[K, V]> {
        return iter(this.root);
    }

    public *keys(): IterableIterator<K> {
        for (const kv of this.iter()) {
            const [key, _val] = kv;
            yield key;
        }
    }

    public _maintainsInvariant(): boolean {
        return maintainsInvariant(this.root);
    }

    private node<K, V>(key: K, value: V,
                       left: AANode<K, V> | null, right: AANode<K, V> | null,
                       level: number): AANode<K, V> {
        return {
            key, value, left, right, level,
            size: 1 + size(left) + size(right),
            orderStats: this.orderStatsTemplate &&
                this.orderStatsTemplate.of(key as any, value as any,
                    left && left.orderStats as any, right && right.orderStats as any) as any,
        };
    }

    private deleteLast<K, V>(node: AANode<K, V>): AANode<K, V> | null {
        if (node.right === null) {
            return node.left;
        } else {
            return this.adjust(this.node(node.key, node.value, node.left, this.deleteLast(node.right), node.level));
        }
    }

    private split<K, V>(node: AANode<K, V>): AANode<K, V> {
        if (node.right && node.right.right &&
            node.right.level === node.level &&
            node.right.right.level === node.level) {
            return this.node(node.right.key, node.right.value,
                this.node(node.key, node.value, node.left, node.right.left, node.level),
                node.right.right,
                node.level + 1);
        } else {
            return node;
        }
    }

    private skew<K, V>(node: AANode<K, V>): AANode<K, V> {
        if (node.left && node.left.level === node.level) {
            return this.node(node.left.key, node.left.value,
                node.left.left,
                this.node(node.key, node.value, node.left.right, node.right, node.level),
                node.left.level);
        } else {
            return node;
        }
    }

    private adjust<K, V>(node: AANode<K, V>): AANode<K, V> {
        if (level(node.right) >= level(node) - 1 &&
            level(node.left) >= level(node) - 1) {
            return node;
        } else if (level(node) > level(node.right) + 1) {
            // Right child is two levels below the node
            if (isSingle(node.left)) {
                return this.skew(this.node(node.key, node.value, node.left, node.right, node.level - 1));
            } else {
                const nleft = node.left!;
                return this.node(nleft.right!.key, nleft.right!.value,
                    this.node(nleft.key, nleft.value, nleft.left, nleft.right!.left, nleft.level),
                    this.node(node.key, node.value, nleft.right!.right, node.right, node.level - 1),
                    node.level);
            }
        } else {
            // Left child is two levels below the node
            if (isSingle(node)) {
                return this.split(this.node(node.key, node.value, node.left, node.right, node.level - 1));
            } else {
                const nleft = node.left!;
                const nright = node.right!;
                const a = nright.left!;
                const nrightLevel = isSingle(a) ? nright.level - 1 : nright.level;
                return this.node(a.key, a.value,
                    this.node(node.key, node.value, node.left, a.left, node.level - 1),
                    this.split(this.node(nright.key, nright.value, a.right, nright.right, nrightLevel)),
                    a.level + 1);
            }
        }
    }
}
