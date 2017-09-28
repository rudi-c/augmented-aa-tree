import { OrderStats } from "./orderstats";
export declare type Comparator<K> = (a: K, b: K) => "lt" | "eq" | "gt";
export declare class AATree<K, V> {
    static defaultComparator<K>(a: K, b: K): "lt" | "gt" | "eq";
    private root;
    private comparator;
    private orderStatsTemplate;
    private constructor();
    static empty<K, V>(comparator?: Comparator<K>, orderStatsTemplate?: OrderStats<K, V> | null): AATree<K, V>;
    size(): number;
    insert(key: K, value: V): AATree<K, V>;
    remove(key: K): AATree<K, V>;
    find(key: K): V | undefined;
    findIndexOf(key: K): number | undefined;
    findStatOf(key: K, stat: string): number | undefined;
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
