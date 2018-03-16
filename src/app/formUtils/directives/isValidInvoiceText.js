const REGEXP_LINES = /\r\n|\n|\r/;

/* @ngInject */
function isValidInvoiceText() {
    return {
        require: 'ngModel',
        restrict: 'A',
        link(scope, el, attr, ngModel) {
            ngModel.$validators.isValidInvoiceText = (input = '') => {
                const lines = (input || '').trim().split(REGEXP_LINES);

                // Max 5 lines ~ Same limit on the BE
                if (lines.length <= 8) {
                    // Max 40 char/lines~ Same limit on the BE
                    ngModel.$setValidity('isValidInvoiceTextLine', lines.every((line) => line.length <= 40));
                    return true;
                }
                return false;
            };
        }
    };
}
export default isValidInvoiceText;
