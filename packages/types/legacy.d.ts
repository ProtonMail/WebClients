type LegacyMap<K, V> = Omit<Map<K, V>, 'getOrInsert' | 'getOrInsertComputed' | 'set'> & {
    set: (key: K, value: V) => LegacyMap<K, V>;
};
