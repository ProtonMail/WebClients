angular.module('proton.card', [])

.directive('cardIcon', (Payment) => {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/directives/card-icon.tpl.html',
        scope: { number: '=' },
        link(scope) {
            const americanExpress = 'fa-cc-amex';
            const dinersClub = 'fa-cc-diners-club';
            const discover = 'fa-cc-discover';
            const jcb = 'fa-cc-jcb';
            const mastercard = 'fa-cc-mastercard';
            const visa = 'fa-cc-visa';
            const card = 'fa-credit-card';

            scope.class = card;

            scope.$watch('number', (newValue) => {
                scope.class = card;

                // New value defined?
                if (angular.isDefined(newValue)) {
                    Payment.cardType(newValue)
                    .then((type) => {
                        switch (type) {
                            case 'visa':
                                scope.class = visa;
                                break;
                            case 'visaelectron':
                                scope.class = card;
                                break;
                            case 'mastercard':
                                scope.class = mastercard;
                                break;
                            case 'maestro':
                                scope.class = card;
                                break;
                            case 'forbrugsforeningen':
                                scope.class = card;
                                break;
                            case 'dankort':
                                scope.class = card;
                                break;
                            case 'amex':
                                scope.class = americanExpress;
                                break;
                            case 'discover':
                                scope.class = discover;
                                break;
                            case 'dinersclub':
                                scope.class = dinersClub;
                                break;
                            case 'jcb':
                                scope.class = jcb;
                                break;
                            case 'unionpay':
                                scope.class = card;
                                break;
                            default:
                                scope.class = card;
                                break;
                        }
                    });
                }
            });
        }
    };
});
