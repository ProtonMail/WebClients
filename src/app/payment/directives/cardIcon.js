/* @ngInject */
function cardIcon() {
    const getCardType = $.payment.cardType;

    const CLASS_TYPES = {
        amex: 'fa-cc-amex',
        dinersclub: 'fa-cc-diners-club',
        discover: 'fa-cc-discover',
        jcb: 'fa-cc-jcb',
        mastercard: 'fa-cc-mastercard',
        visa: 'fa-cc-visa',
        visaelectron: 'fa-cc-visa',
        maestro: 'fa-credit-card',
        forbrugsforeningen: 'fa-credit-card',
        dankort: 'fa-credit-card',
        unionpay: 'fa-credit-card',
        card: 'fa-credit-card'
    };

    /**
     * Default value comming from the lib is null :/
     */
    const getClassName = (type = 'card') => `cardIcon-container fa ${CLASS_TYPES[type || 'card']}`;

    return {
        replace: true,
        template: `<i class="cardIcon-container fa ${CLASS_TYPES.card}"></i>`,
        scope: {
            number: '='
        },
        link(scope, el) {
            scope.$watch('number', (newValue) => {
                el[0].className = getClassName(getCardType(newValue));
            });
        }
    };
}
export default cardIcon;
