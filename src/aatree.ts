interface AANode<K, V> {
    key: K;
    value: V;
    left: AANode<K, V> | null;
    right: AANode<K, V> | null;
    level: number;
}

type Comparator<K> = (a: K, b: K) => "lt" | "eq" | "gt";

function split<K, V>(node: AANode<K, V>): AANode<K, V> {
    if (node.right && node.right.right &&
        node.right.level === node.level &&
        node.right.right.level === node.level) {
        return { ...node.right,
            left: { ...node, right: node.right.left },
            level: node.level + 1,
        };
    } else {
        return node;
    }
}

function skew<K, V>(node: AANode<K, V>): AANode<K, V> {
    if (node.left && node.left.level === node.level) {
        return { ...node.left, right: { ...node, left: node.left.right } };
    } else {
        return node;
    }
}

function insert<K, V>(root: AANode<K, V> | null, key: K, value: V, comparator: Comparator<K>): AANode<K, V> {
    function _insert(node: AANode<K, V> | null): AANode<K, V> {
        if (node == null) {
            return {
                key,
                value,
                left: null,
                right: null,
                level: 1,
            };
        } else {
            switch (comparator(key, node.key)) {
                case "lt":
                    return split(skew({ ...node, left: _insert(node.left) }));
                case "eq":
                    return { ...node, value };
                case "gt":
                    return split(skew({ ...node, right: _insert(node.right) }));
                default:
                    throw new Error("TODO");
            }
        }
    }

    return _insert(root);
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
    private root: AANode<K, V> | null;
    private comparator: Comparator<K>;

    constructor(comparator: Comparator<K> = defaultComparator,
                root: AANode<K, V> | null = null) {
        this.root = root;
        this.comparator = comparator;
    }

    public insert(key: K, value: V): AATree<K, V> {
        // TODO: remove need for `new`
        return new AATree(this.comparator, insert(this.root, key, value, this.comparator));
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
}

class AugmentedAATree<K, V> extends AATree<K, V> {
    private size: number;
}