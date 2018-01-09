/* @ngInject */
function blackFridayPaid() {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/blackFriday/blackFridayPaid.tpl.html')
    };
}
export default blackFridayPaid;
