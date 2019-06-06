/* @ngInject */
function initials() {
    const getLetter = (name = '') => name.charAt(0).toUpperCase();

    const formatString = (input = '') => {
        const [name, name2 = ''] = input.split(' ');
        if (!name2) {
            return getLetter(name);
        }

        return `${getLetter(name)}${getLetter(name2)}`;
    };

    const formatSender = ({ Name = '', Address = '' } = {}) => {
        return formatString(Name || Address);
    };

    return (input) => {
        if (typeof input !== 'string') {
            return formatSender(input);
        }

        return formatString(input);
    };
}
export default initials;
