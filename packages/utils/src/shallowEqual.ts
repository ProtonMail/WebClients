/**
 * Determine if two arrays are shallowy equal (i.e. they have the same length and the same elements)
 */
export default function shallowEqual<T>(a: T[], b: T[]) {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}
