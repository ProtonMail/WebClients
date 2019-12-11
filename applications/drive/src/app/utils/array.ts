export function mergeUint8Arrays(arrays: Uint8Array[], resultLength: number) {
    const chunksAll = new Uint8Array(resultLength);
    let position = 0;
    for (const arr of arrays) {
        chunksAll.set(arr, position);
        position += arr.length;
    }
    return chunksAll;
}
