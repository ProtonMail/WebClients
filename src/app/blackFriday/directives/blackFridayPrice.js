/* @ngInject */
function blackFridayPrice() {
    return {
        restrict: 'E',
        replace: true,
        scope: { amount: '=', strike: '=', currency: '=' },
        templateUrl: 'templates/blackFriday/blackFridayPrice.tpl.html'
    };
}
export default blackFridayPrice;
