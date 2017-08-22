interface AANode<K, V> {
    key: K;
    value: V;
    left: AANode<K, V> | null;
    right: AANode<K, V> | null;
    level: number;
    size: number;
    orderStats: any;
}

type Comparator<K> = (a: K, b: K) => "lt" | "eq" | "gt";
type OrderStatsMap<K, V> = (k: K, v: V) => any;

function level<K, V>(node: AANode<K, V> | null): number {
    return node ? node.level : 0;
}

function size<K, V>(node: AANode<K, V> | null): number {
    return node ? node.size : 0;
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

function defaultComparator<K>(a: K, b: K) {
    if (a < b) {
        return "lt";
    } else if (a > b) {
        return "gt";
    } else {
        return "eq";
    }
}

export class AATree<K, V> {
    protected root: AANode<K, V> | null;
    protected comparator: Comparator<K>;
    protected orderStatsMap: OrderStatsMap<K, V>;

    constructor(comparator: Comparator<K> = defaultComparator,
                orderStatsMap: OrderStatsMap<K, V> = () => ({}),
                root: AANode<K, V> | null = null) {
        this.root = root;
        this.orderStatsMap = orderStatsMap;
        this.comparator = comparator;
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

        return new AATree(this.comparator, this.orderStatsMap, _insert(this.root));
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

        return new AATree(this.comparator, this.orderStatsMap, _remove(this.root));
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

    public iter(): IterableIterator<[K, V]> {
        return iter(this.root);
    }

    public *keys(): IterableIterator<K> {
        for (const kv of this.iter()) {
            const [key, _val] = kv;
            yield key;
        }
    }

    public orderStats() {
        if (this.root) {
            const orderStats: any = {};
            for (const stat in this.orderStatsMap) {
                if (this.orderStatsMap.hasOwnProperty(stat)) {
                    orderStats[stat] = (this.root as any)[stat];
                }
            }
            return orderStats;
        } else {
            return null;
        }
    }

    public _maintainsInvariant(): boolean {
        return maintainsInvariant(this.root);
    }

    private node<K, V>(key: K, value: V,
                       left: AANode<K, V> | null, right: AANode<K, V> | null,
                       level: number): AANode<K, V> {
        return { key, value, left, right, level, size: 1 + size(left) + size(right), orderStats: null };
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
