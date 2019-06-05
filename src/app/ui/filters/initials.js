/* @ngInject */
function initials() {
    const getLetter = (name = '') => name.charAt(0).toUpperCase();
    return (input = '') => {
        const [name, name2 = ''] = input.split(' ');
        if (!name2) {
            return getLetter(name);
        }

        return `${getLetter(name)}${getLetter(name)}`;
    };
}
export default initials;
