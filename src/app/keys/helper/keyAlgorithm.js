/* @ngInject */
const NON_ABBREVIATION_ALGS = ['elgamal'];
const ECC_ALGS = ['ecdh', 'ecdsa', 'eddsa'];

const describe = ({ algorithmName, bitSize }) => {
    const [name] = algorithmName.split('_');
    const formattedName = NON_ABBREVIATION_ALGS.includes(name)
        ? name.charAt(0).toUpperCase() + name.slice(1)
        : name.toUpperCase();
    const subType = ECC_ALGS.includes(name) ? '' : ` (${bitSize})`;
    return `${formattedName}${subType}`;
};

export default { describe };
