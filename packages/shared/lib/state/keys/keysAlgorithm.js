const NON_ABBREVIATION_ALGS = ['elgamal'];
const ECC_ALGS = ['ecdh', 'ecdsa', 'eddsa'];

export const isRSA = (algorithmName = '') => algorithmName.toLowerCase().startsWith('rsa');
export const isECC = (algorithmName = '') => ECC_ALGS.includes(algorithmName.toLowerCase());

export const describe = ({ algorithmName = '', bitSize = 0 } = {}) => {
    const [name] = algorithmName.split('_');

    if (isECC(name)) {
        const value = name === 'eddsa' ? 'ed25519' : name;
        return `ECC (${value})`;
    }

    const formattedName = NON_ABBREVIATION_ALGS.includes(name)
        ? name.charAt(0).toUpperCase() + name.slice(1)
        : name.toUpperCase();

    return `${formattedName} (${bitSize})`;
};
