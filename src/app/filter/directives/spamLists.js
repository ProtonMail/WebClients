/* @ngInject */
function spamLists() {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/filter/spamLists.tpl.html'
    };
}
export default spamLists;
