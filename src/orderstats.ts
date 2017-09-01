interface OrderStats<K, V> {
    of(key: K, value: V, left: OrderStats<K, V> | null, right: OrderStats<K, V> | null): OrderStats<K, V>;
}
