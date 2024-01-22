import { BigInteger as BigIntegerInstance, ConcreteBigInteger } from '@openpgp/noble-hashes/esm/biginteger/interface';
import NativeBigInteger from '@openpgp/noble-hashes/esm/biginteger/native.interface';

export const littleEndianArrayToBigInteger = (arr: Uint8Array, BigInteger: ConcreteBigInteger) =>
    new BigInteger(arr.slice().reverse());

/**
 * We don't use the BigIntegerInterface wrapper from noble-hashes because:
 * - importing the instance results in it being shared with noble-hashes, which separately calls `setImplementation()`
 *  on load, causing it to throw due to duplicate initialization.
 * - even duplicating the interface code here to keep a separate instance requires handing a race-conditions the first time
 * `getBigInteger` is called, when the code needs to check if the implementation is set, and initialize it if not.
 * Ultimately, the interface provides no advantages and it's only needed because of TS.
 */
const detectBigInt = () => typeof BigInt !== 'undefined';
let BigInteger: ConcreteBigInteger;
export async function getBigInteger() {
    if (BigInteger) {
        return BigInteger;
    }

    if (detectBigInt()) {
        BigInteger = NativeBigInteger;
    } else {
        // FallbackBigInteger relies on large BN.js lib, which is also used by noble-hashes and noble-curves
        const { default: FallbackBigInteger } = await import('@openpgp/noble-hashes/esm/biginteger/bn.interface');
        BigInteger = FallbackBigInteger;
    }

    return BigInteger;
}

export { BigIntegerInstance };
