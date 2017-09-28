export interface OrderStats<K, V> {
    // TODO abstract class with slow default that use Javascript dynamism
    of(key: K, value: V, left: OrderStats<K, V> | null, right: OrderStats<K, V> | null): OrderStats<K, V>;
}
