import { SHA512, concatArrays, arrayToHexString } from 'pmcrypto';
import { Point, CURVE } from '@noble/ed25519';
import { CO_FACTOR, N, ptLen } from './constants';

/**
 * Convert an Uint8Array representing a scalar to a bigint instance, also swapping endianness
 */
const stringToScalar = (array: Uint8Array) => BigInt(`0x${arrayToHexString(array.reverse())}`);

/**
 * Converst a ptLen-octet Uint8Array to EC point, according to section 5.1.3 of rfc8032.
 * It returns null if the octet string does not convert to a valid EC point
 */
const stringToPoint = (array: Uint8Array) => {
    if (array.length !== ptLen) {
        throw new Error('Input length is inconsistent for conversion to point');
    }
    return Point.fromHex(array);
};

/**
 * Parse a VRF proof, according to section 5.4.4, ECVRF Decode Proof, of draft-irtf-cfrg-vrf-10
 */
const decodeProof = (pi: Uint8Array) => {
    if (pi.length !== 2 * ptLen + N) {
        throw new Error('Inconsistent proof length');
    }

    const Gamma = stringToPoint(pi.slice(0, ptLen));
    const c = stringToScalar(pi.slice(ptLen, ptLen + N));
    const s = stringToScalar(pi.slice(ptLen + N, 2 * ptLen + N));

    if (s >= CURVE.P) {
        throw new Error('Scalar from proof out of range');
    }

    return { Gamma, c, s };
};

/**
 * Hash strings to an EC point, according to section 5.4.1.1, ECVRF_hash_to_curve_try_and_increment, of
 * draft-irtf-cfrg-vrf-10. It is instantied for ECVRF-EDWARDS25519-SHA512-TAI according to section 5.5
 */
const hashToCurveTAI = async (alpha: Uint8Array, Y: Uint8Array) => {
    for (let ctr = 0x00; ctr <= 0xff; ctr++) {
        const hash = await SHA512(concatArrays([new Uint8Array([0x03, 0x01]), Y, alpha, new Uint8Array([ctr, 0x00])]));

        let H: Point;
        try {
            H = stringToPoint(hash.slice(0, ptLen));
        } catch (error: any) {
            continue;
        }

        if (!H.equals(Point.BASE)) {
            return H.multiply(CO_FACTOR);
        }
    }

    throw new Error('Hashing to curve failed to generate a valid point');
};

/**
 * Hash several points together, according to section 5.4.3, ECVRF Hash Points, of
 * draft-irtf-cfrg-vrf-10
 */
const hashPoints = async (...points: Point[]) => {
    const digest = await SHA512(
        concatArrays([new Uint8Array([0x03, 0x02]), ...points.map((p) => p.toRawBytes()), new Uint8Array([0x00])])
    );
    return stringToScalar(digest.slice(0, N));
};

/**
 * Hash the VRF proof, according to section 5.2, ECVRF Proof to Hash, of
 * draft-irtf-cfrg-vrf-10
 */
const proofToHash = async (Gamma: Point) =>
    SHA512(
        concatArrays([new Uint8Array([0x03, 0x03]), Gamma.multiply(CO_FACTOR).toRawBytes(), new Uint8Array([0x00])])
    );

/**
 * VRF verify a proof, according to section 5.3, ECVRF Verifying, of draft-irtf-cfrg-vrf-10
 */
export const vrfVerify = async (alpha: Uint8Array, pi: Uint8Array, vrfHexKey: Uint8Array) => {
    const Y = stringToPoint(vrfHexKey);
    const H = await hashToCurveTAI(alpha, vrfHexKey);
    const D = decodeProof(pi);
    const { Gamma, c, s } = D;

    const U = Point.BASE.multiply(s).subtract(Y.multiply(c));
    const V = H.multiply(s).subtract(Gamma.multiply(c));

    const cPrime = await hashPoints(H, Gamma, U, V);
    if (cPrime !== c) {
        throw new Error('Verification failed');
    }

    return proofToHash(Gamma);
};
