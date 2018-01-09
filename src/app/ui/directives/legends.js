/* @ngInject */
function legends() {
    return {
        replace: true,
        restrict: 'E',
        scope: { list: '=' },
        templateUrl: require('../../../templates/ui/legends.tpl.html')
    };
}
export default legends;
