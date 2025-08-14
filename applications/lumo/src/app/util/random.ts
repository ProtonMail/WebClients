export function generateRandomU64(): bigint {
    const array = new Uint32Array(2);
    window.crypto.getRandomValues(array);
    // Combine the two 32-bit values into a single 64-bit value
    const randomU64 = (BigInt(array[0]) << 32n) | BigInt(array[1]);
    return randomU64;
}
