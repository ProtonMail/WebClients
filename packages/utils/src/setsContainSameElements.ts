export default function setsContainSameElements<T>(set1: Set<T>, set2: Set<T>) {
    if (set1.size !== set2.size) {
        return false;
    }

    for (const element of set1) {
        if (!set2.has(element)) {
            return false;
        }
    }

    return true;
}
