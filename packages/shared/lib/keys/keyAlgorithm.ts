import { AlgorithmInfo } from '@proton/crypto';
import capitalize from '@proton/utils/capitalize';
import unique from '@proton/utils/unique';

import { KeyGenConfig } from '../interfaces';

const ECC_ALGS: Set<AlgorithmInfo['algorithm']> = new Set(['ecdh', 'ecdsa', 'eddsa']);

export const isRSA = (algorithmName: AlgorithmInfo['algorithm']) => algorithmName.toLowerCase().startsWith('rsa');
export const isECC = (algorithmName: AlgorithmInfo['algorithm']) => ECC_ALGS.has(algorithmName);

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
        case 'eddsa': // soon 'eddsaLegacy'
        case 'ecdsa':
        case 'ecdh':
            return `ECC (${capitalize(curve === 'ed25519' ? 'curve25519' : curve)})`;
        case 'ed25519':
        case 'x25519':
            return `ECC (Curve25519, new format)`;
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
        if (isECC(algorithm)) {
            return curve === keyGenConfig.curve;
        }

        if (isRSA(algorithm)) {
            return bits === keyGenConfig.rsaBits;
        }

        return false;
    });
};
