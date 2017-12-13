/* @ngInject */
function strUtils() {
    const ucFirst = (input = '') => input.charAt(0).toUpperCase() + input.slice(1);
    return { ucFirst };
}
export default strUtils;
