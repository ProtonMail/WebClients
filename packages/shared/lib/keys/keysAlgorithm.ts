import { algorithmInfo } from 'pmcrypto';
import { EncryptionConfig } from '../interfaces';

const NON_ABBREVIATION_ALGS = ['elgamal'];
const ECC_ALGS = ['ecdh', 'ecdsa', 'eddsa'];

export const isRSA = (algorithmName = '') => algorithmName.toLowerCase().startsWith('rsa');
export const isECC = (algorithmName = '') => ECC_ALGS.includes(algorithmName.toLowerCase());

export const describe = ({ algorithm = '', bits, curve }: algorithmInfo = { algorithm: '' }) => {
    const [name] = algorithm.split('_');

    if (isECC(name)) {
        return `ECC (${curve})`;
    }

    const formattedName = NON_ABBREVIATION_ALGS.includes(name)
        ? name.charAt(0).toUpperCase() + name.slice(1)
        : name.toUpperCase();

    return `${formattedName} (${bits})`;
};

export const getAlgorithmExists = (algorithmInfos: algorithmInfo[] = [], encryptionConfig: EncryptionConfig) => {
    return algorithmInfos.some(({ algorithm, curve, bits }) => {
        if (isECC(algorithm)) {
            return curve === encryptionConfig.curve;
        }

        if (isRSA(algorithm)) {
            return bits === encryptionConfig.numBits;
        }

        return false;
    });
};
