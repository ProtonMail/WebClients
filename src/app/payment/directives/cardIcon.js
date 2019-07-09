/* @ngInject */
function cardIcon($compile) {
    const getCardType = $.payment.cardType;

    const SHAPES = {
        amex: '',
        dinersclub: '',
        discover: '',
        jcb: '',
        mastercard: '',
        visa: '',
        visaelectron: '',
        maestro: '',
        forbrugsforeningen: '',
        dankort: '',
        unionpay: '',
        card: ''
    };

    return {
        restrict: 'A',
        link(scope, el) {
            el[0].classList.add('cardIcon-container');
            scope.$watch('card.number', (value) => {
                const shape = SHAPES[getCardType(value)] || 'payments-type-card';
                const tpl = `<icon class="mauto" data-name="${shape}"></icon>`;
                el.html($compile(tpl)(scope));
            });
        }
    };
}
export default cardIcon;
