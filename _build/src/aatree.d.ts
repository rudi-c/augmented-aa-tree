export interface AANode<K, V> {
    key: K;
    value: V;
    left: AANode<K, V> | null;
    right: AANode<K, V> | null;
    level: number;
    size: number;
    orderStats: OrderStats<K, V> | null;
}
export declare type Comparator<K> = (a: K, b: K) => "lt" | "eq" | "gt";
export declare class AATree<K, V> {
    static defaultComparator<K>(a: K, b: K): "lt" | "gt" | "eq";
    protected root: AANode<K, V> | null;
    protected comparator: Comparator<K>;
    protected orderStatsTemplate: OrderStats<K, V> | null;
    constructor(comparator?: Comparator<K>, orderStatsTemplate?: OrderStats<K, V> | null, root?: AANode<K, V> | null);
    size(): number;
    insert(key: K, value: V): AATree<K, V>;
    remove(key: K): AATree<K, V>;
    find(key: K): V | undefined;
    nth(n: number): [K, V] | undefined;
    nthStat(stat: string, x: number): [K, V] | undefined;
    iter(): IterableIterator<[K, V]>;
    keys(): IterableIterator<K>;
    _maintainsInvariant(): boolean;
    private node<K, V>(key, value, left, right, level);
    private deleteLast<K, V>(node);
    private split<K, V>(node);
    private skew<K, V>(node);
    private adjust<K, V>(node);
}
