/* @ngInject */
function fixed() {
    return (input, number = 2) => input.toFixed(number);
}
export default fixed;
