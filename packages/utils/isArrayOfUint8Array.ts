export default function isArrayOfUint8Array(arr: any[]): arr is Uint8Array<ArrayBuffer>[] {
    return arr.every((el) => el instanceof Uint8Array);
}
