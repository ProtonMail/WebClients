/* @ngInject */
function legends() {
    return {
        replace: true,
        restrict: 'E',
        scope: { list: '=' },
        templateUrl: 'templates/ui/legends.tpl.html'
    };
}
export default legends;
