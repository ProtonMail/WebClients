/* @ngInject */
function labelNameInput() {
    return {
        scope: {
            form: '=',
            model: '=',
            mode: '@'
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/labels/labelNameInput.tpl.html')
    };
}
export default labelNameInput;
