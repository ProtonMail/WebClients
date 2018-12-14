import invoiceList from './directives/invoiceList';
import invoiceSection from './directives/invoiceSection';
import invoicePrice from './filters/invoicePrice';
import invoiceInfo from './filters/invoiceInfo';
import invoiceModel from './factories/invoiceModel';

angular
    .module('proton.invoices', [])
    .directive('invoiceList', invoiceList)
    .directive('invoiceSection', invoiceSection)
    .filter('invoicePrice', invoicePrice)
    .filter('invoiceInfo', invoiceInfo)
    .factory('invoiceModel', invoiceModel);

export default angular.module('proton.invoices').name;
