import creditCardType from 'credit-card-type';

/* @ngInject */
function paymentVerificationLogo() {
    const IMAGES = {
        'american-express': '/assets/img/american-express-safekey.svg',
        discover: '/assets/img/discover-protectbuy.svg',
        mastercard: '/assets/img/mastercard-securecode.svg',
        visa: '/assets/img/verified-by-visa.svg'
    };
    const DEFAULT_IMAGE = '/assets/img/3-d-secure.svg';

    return {
        replace: true,
        restrict: 'E',
        scope: { payment: '=' },
        template: '<img class="paymentVerificationLogo-img" />',
        link(scope, el) {
            const element = el[0];
            const { Details = {} } = scope.payment || {};
            const [{ type = '', niceType = '' } = {}] = creditCardType(Details.Number) || [];

            element.src = IMAGES[type] || DEFAULT_IMAGE;
            element.alt = niceType;
        }
    };
}
export default paymentVerificationLogo;
