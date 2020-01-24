export const mergeUint8Arrays = (arrays: Uint8Array[]) => {
    const length = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const chunksAll = new Uint8Array(length);
    let position = 0;
    for (const arr of arrays) {
        chunksAll.set(arr, position);
        position += arr.length;
    }
    return chunksAll;
};

export function areUint8Arrays(arr: any[]): arr is Uint8Array[] {
    return arr.every((el) => el instanceof Uint8Array);
}
