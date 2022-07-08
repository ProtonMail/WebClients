export default function isArrayOfUint8Array(arr: any[]): arr is Uint8Array[] {
    return arr.every((el) => el instanceof Uint8Array);
}
