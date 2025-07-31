import type { AlgorithmInfo } from '@proton/crypto';
import unique from '@proton/utils/unique';

import type { KeyGenConfig, KeyGenConfigV6 } from '../interfaces';

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

export const getFormattedAlgorithmName = ({ algorithm, bits, curve }: AlgorithmInfo, keyVersion: number) => {
    const versionSuffix = keyVersion === 6 ? '_V6' : '';
    switch (algorithm) {
        case 'elgamal':
            return `ElGamal${versionSuffix} (${bits})`;
        case 'dsa':
            return `DSA${versionSuffix} (${bits})`;
        case 'rsaEncrypt':
        case 'rsaEncryptSign':
        case 'rsaSign':
            return `RSA${versionSuffix} (${bits})`;
        case 'eddsaLegacy':
        case 'ecdsa':
        case 'ecdh':
            return `ECC${versionSuffix} (${formatCurveName(curve)})`;
        case 'ed25519':
        case 'x25519':
            return `ECC${versionSuffix} (Curve25519, new format)`;
        case 'ed448':
        case 'x448':
            return `ECC${versionSuffix} (Curve448, new format)`;
        case 'pqc_mldsa_ed25519':
        case 'pqc_mlkem_x25519':
            return `PQC${versionSuffix} (${algorithm.substring(4).toUpperCase()})`;
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
export const getFormattedAlgorithmNames = (algorithmInfos: AlgorithmInfo[] = [], keyVersion: number) => {
    const formattedAlgos = algorithmInfos.map((info) => getFormattedAlgorithmName(info, keyVersion));
    return unique(formattedAlgos).join(', ');
};

export const isKeyGenConfigV6 = (keyConfig: KeyGenConfig | KeyGenConfigV6): keyConfig is KeyGenConfigV6 =>
    !!keyConfig?.config?.v6Keys;

/**
 * Determine whether any of the given algorithmInfo matches the keyGenConfig
 */
export const getAlgorithmExists = (
    algorithmInfos: AlgorithmInfo[] = [],
    keyGenConfig: KeyGenConfig | KeyGenConfigV6
) => {
    return algorithmInfos.some(({ algorithm, curve, bits }) => {
        switch (algorithm) {
            case 'rsaEncrypt':
            case 'rsaEncryptSign':
            case 'rsaSign':
                return !isKeyGenConfigV6(keyGenConfig) && bits === keyGenConfig.rsaBits;
            case 'eddsaLegacy':
            case 'ecdsa':
            case 'ecdh':
                return !isKeyGenConfigV6(keyGenConfig) && curve === keyGenConfig.curve;
            case 'pqc_mldsa_ed25519':
            case 'pqc_mlkem_x25519':
                return isKeyGenConfigV6(keyGenConfig) && keyGenConfig.type === 'pqc';
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
