/* @ngInject */
function capitalize() {
    return function(value = '') {
        if (value) {
            return value.toUpperCase().substring(0, 1) + value.toLowerCase().substring(1);
        }

        return value;
    };
}
export default capitalize;
