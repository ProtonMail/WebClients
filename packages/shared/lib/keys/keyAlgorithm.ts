import { AlgorithmInfo } from '@proton/crypto';
import unique from '@proton/utils/unique';
import capitalize from '@proton/utils/capitalize';
import { EncryptionConfig, SimpleMap } from '../interfaces';

const CUSTOM_FORMATTED_ALGS: SimpleMap<string> = { elgamal: 'ElGamal' };
const ECC_ALGS = new Set(['ecdh', 'ecdsa', 'eddsa']);

export const isRSA = (algorithmName = '') => algorithmName.toLowerCase().startsWith('rsa');
export const isECC = (algorithmName = '') => ECC_ALGS.has(algorithmName.toLowerCase());

export const getFormattedAlgorithmName = ({ algorithm = '', bits, curve }: AlgorithmInfo = { algorithm: '' }) => {
    // For RSA keys, the algorithm is one of 'rsaEncrypt', 'rsaSign' or 'rsaEncryptSign', for historical reason. We simply display 'RSA'.
    const name = isRSA(algorithm) ? 'rsa' : algorithm;

    if (isECC(name)) {
        // Keys using curve 25519 have different curve names (ed25519 or curve25519), which we unify under 'Curve25519'
        return `ECC (${capitalize(curve === 'ed25519' ? 'curve25519' : curve)})`;
    }

    const formattedName = CUSTOM_FORMATTED_ALGS[name] || name.toUpperCase();

    return `${formattedName} (${bits})`;
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

export const getAlgorithmExists = (algorithmInfos: AlgorithmInfo[] = [], encryptionConfig: EncryptionConfig) => {
    return algorithmInfos.some(({ algorithm, curve, bits }) => {
        if (isECC(algorithm)) {
            return curve === encryptionConfig.curve;
        }

        if (isRSA(algorithm)) {
            return bits === encryptionConfig.rsaBits;
        }

        return false;
    });
};
