interface AANode<K, V> {
    key: K;
    value: V;
    left: AANode<K, V> | null;
    right: AANode<K, V> | null;
    level: number;
}

function AANode<K, V>(key: K, value: V,
                      left: AANode<K, V> | null, right: AANode<K, V> | null, level: number): AANode<K, V> {
    return { key, value, left, right, level };
}

type Comparator<K> = (a: K, b: K) => "lt" | "eq" | "gt";
type OrderStatsMap<K, V> = (k: K, v: V) => any;

function level<K, V>(node: AANode<K, V> | null): number {
    return node ? node.level : 0;
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

function split<K, V>(node: AANode<K, V>): AANode<K, V> {
    if (node.right && node.right.right &&
        node.right.level === node.level &&
        node.right.right.level === node.level) {
        return AANode(node.right.key, node.right.value,
            AANode(node.key, node.value, node.left, node.right.left, node.level),
            node.right.right,
            node.level + 1);
    } else {
        return node;
    }
}

function skew<K, V>(node: AANode<K, V>): AANode<K, V> {
    if (node.left && node.left.level === node.level) {
        return AANode(node.left.key, node.left.value,
            node.left.left,
            AANode(node.key, node.value, node.left.right, node.right, node.level),
            node.left.level);
    } else {
        return node;
    }
}

function adjust<K, V>(node: AANode<K, V>): AANode<K, V> {
    if (level(node.right) >= level(node) - 1 &&
        level(node.left) >= level(node) - 1) {
        return node;
    } else if (level(node) > level(node.right) + 1) {
        // Right child is two levels below the node
        if (isSingle(node.left)) {
            return skew(AANode(node.key, node.value, node.left, node.right, node.level - 1));
        } else {
            const nleft = node.left!;
            return AANode(nleft.right!.key, nleft.right!.value,
                AANode(nleft.key, nleft.value, nleft.left, nleft.right!.left, nleft.level),
                AANode(node.key, node.value, nleft.right!.right, node.right, node.level - 1),
                node.level);
        }
    } else {
        // Left child is two levels below the node
        if (isSingle(node)) {
            return split(AANode(node.key, node.value, node.left, node.right, node.level - 1));
        } else {
            const nleft = node.left!;
            const nright = node.right!;
            const a = nright.left!;
            const nrightLevel = isSingle(a) ? nright.level - 1 : nright.level;
            return AANode(a.key, a.value,
                AANode(node.key, node.value, node.left, a.left, node.level - 1),
                split(AANode(nright.key, nright.value, a.right, nright.right, nrightLevel)),
                a.level + 1);
        }
    }
}

function insert<K, V>(root: AANode<K, V> | null, key: K, value: V,
                      comparator: Comparator<K>, orderStatsMap: OrderStatsMap<K, V>): AANode<K, V> {
    function _insert(node: AANode<K, V> | null): AANode<K, V> {
        if (node == null) {
            return AANode(key, value, null, null, 1);
        } else {
            switch (comparator(key, node.key)) {
                case "eq":
                    return AANode(node.key, value, node.left, node.right, node.level);
                case "lt":
                    return split(skew(AANode(node.key, node.value, _insert(node.left), node.right, node.level)));
                case "gt":
                    return split(skew(AANode(node.key, node.value, node.left, _insert(node.right), node.level)));
                default:
                    throw new Error("TODO");
            }
        }
    }

    return _insert(root);
}

function find<K, V>(root: AANode<K, V> | null, key: K, comparator: Comparator<K>): V | undefined {
    function _find(node: AANode<K, V> | null): V | undefined {
        if (node === null) {
            return undefined;
        } else {
            switch (comparator(key, node.key)) {
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
    return _find(root);
}

function last<K, V>(node: AANode<K, V>): [K, V] {
    if (node.right === null) {
        return [node.key, node.value];
    } else {
        return last(node.right);
    }
}

function deleteLast<K, V>(node: AANode<K, V>): AANode<K, V> | null {
    if (node.right === null) {
        return node.left;
    } else {
        return adjust(AANode(node.key, node.value, node.left, deleteLast(node.right), node.level));
    }
}

function remove<K, V>(root: AANode<K, V> | null, key: K, comparator: Comparator<K>,
                      orderStats: OrderStatsMap<K, V>): AANode<K, V> | null {
    function _remove(node: AANode<K, V> | null): AANode<K, V> | null {
        if (node === null) {
            return null;
        } else {
            switch (comparator(key, node.key)) {
                case "eq":
                    if (node.left === null) {
                        return node.right;
                    } else if (node.right === null) {
                        return node.left;
                    } else {
                        const [lastKey, lastValue] = last(node.left);
                        return adjust(AANode(lastKey, lastValue, deleteLast(node.left), node.right, node.level));
                    }
                case "lt":
                    return adjust(AANode(node.key, node.value, _remove(node.left), node.right, node.level));
                case "gt":
                    return adjust(AANode(node.key, node.value, node.left, _remove(node.right), node.level));
                default:
                    throw new Error("TODO");
            }
        }
    }
    return _remove(root);
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
        // TODO: remove need for `new`
        return new AATree(this.comparator, this.orderStatsMap,
            insert(this.root, key, value, this.comparator, this.orderStatsMap));
    }

    public remove(key: K): AATree<K, V> {
        return new AATree(this.comparator, this.orderStatsMap,
            remove(this.root, key, this.comparator, this.orderStatsMap));
    }

    public find(key: K): V | undefined {
        return find(this.root, key, this.comparator);
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
}
