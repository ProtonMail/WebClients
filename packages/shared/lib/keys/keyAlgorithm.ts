import type { AlgorithmInfo } from '@proton/crypto';
import capitalize from '@proton/utils/capitalize';
import unique from '@proton/utils/unique';

import { KeyGenConfig } from '../interfaces';

export const getFormattedAlgorithmName = ({ algorithm, bits, curve }: AlgorithmInfo) => {
    switch (algorithm) {
        case 'elgamal':
            return `ElGamal (${bits})`;
        case 'dsa':
            return `DSA (${bits})`;
        case 'rsaEncrypt':
        case 'rsaEncryptSign':
        case 'rsaSign':
            return `RSA (${bits})`;
        case 'eddsaLegacy':
            return `ECC (Curve25519)`;
        case 'ecdsa':
        case 'ecdh':
            return `ECC (${capitalize(curve === 'curve25519Legacy' ? 'curve25519' : curve)})`;
        case 'ed25519':
        case 'x25519':
            return `ECC (Curve25519, new format)`;
        case 'ed448':
        case 'x448':
            return `ECC (Curve448, new format)`;
        default:
            return algorithm.toUpperCase(); // should never get here
    }
};

/**
 * Aggregate different algorithm information, returning a string including the list of unique key algo descriptors.
 * @param {AlgorithmInfo[]} algorithmInfos
 * @returns {String} formatted unique algorithm names. Different curves or key sizes result in separate entries, e.g.
 *      [{ name: 'rsa', bits: 2048 }, { name: 'rsa', bits: 4096 }] returns `RSA (2048), RSA (4096)`.
 */
export const getFormattedAlgorithmNames = (algorithmInfos: AlgorithmInfo[] = []) => {
    const formattedAlgos = algorithmInfos.map(getFormattedAlgorithmName);
    return unique(formattedAlgos).join(', ');
};

/**
 * Determine whether any of the given algorithmInfo matches the keyGenConfig
 */
export const getAlgorithmExists = (algorithmInfos: AlgorithmInfo[] = [], keyGenConfig: KeyGenConfig) => {
    return algorithmInfos.some(({ algorithm, curve, bits }) => {
        switch (algorithm) {
            case 'rsaEncrypt':
            case 'rsaEncryptSign':
            case 'rsaSign':
                return bits === keyGenConfig.rsaBits;
            case 'eddsaLegacy':
            case 'ecdsa':
            case 'ecdh':
                return curve === keyGenConfig.curve;
            case 'ed25519':
            case 'x25519':
            case 'ed448':
            case 'x448':
                return false; // key generation currently unsupported
            default:
                return false;
        }
    });
};
