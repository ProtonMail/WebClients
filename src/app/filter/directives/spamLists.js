/* @ngInject */
function spamLists() {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/filter/spamLists.tpl.html')
    };
}
export default spamLists;
