/* @ngInject */
function invoiceList() {
    return {
        scope: {
            model: '='
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/invoices/invoiceList.tpl.html')
    };
}
export default invoiceList;
