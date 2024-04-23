import type { AlgorithmInfo } from '@proton/crypto';
import unique from '@proton/utils/unique';

import { KeyGenConfig } from '../interfaces';

const formatCurveName = (curve: AlgorithmInfo['curve']) => {
    switch (curve) {
        case 'curve25519Legacy':
        case 'ed25519Legacy':
            return 'Curve25519';
        case 'nistP256':
        case 'nistP384':
        case 'nistP521':
            return curve.replace('nist', 'NIST ');
        case 'brainpoolP256r1':
        case 'brainpoolP384r1':
        case 'brainpoolP512r1':
            return curve.replace('brainpool', 'Brainpool ');
        default:
            return curve;
    }
};

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
        case 'ecdsa':
        case 'ecdh':
            return `ECC (${formatCurveName(curve)})`;
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
