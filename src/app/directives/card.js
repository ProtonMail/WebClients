angular.module('proton.card', [])

.directive('cardIcon', function ($window) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/directives/card-icon.tpl.html',
        scope: {number: '='},
        link: function(scope, element, attrs) {
            var americanExpress = 'fa-cc-amex';
            var dinersClub = 'fa-cc-diners-club';
            var discover = 'fa-cc-discover';
            var jcb = 'fa-cc-jcb';
            var mastercard = 'fa-cc-mastercard';
            var visa = 'fa-cc-visa';
            var card = 'fa-credit-card';

            scope.class = card;

            scope.$watch('number', function (newValue, oldValue) {
                var value = card;

                // Stripe defined?
                if (angular.isDefined($window.Stripe)) {
                    // New value defined?
                    if (angular.isDefined(newValue)) {
                        // Valid card number
                        if ($window.Stripe.card.validateCardNumber(newValue)) {
                            switch ($window.Stripe.card.cardType(newValue)) {
                                case 'Visa':
                                    value = visa;
                                    break;
                                case 'MasterCard':
                                    value = mastercard;
                                    break;
                                case 'American Express':
                                    value = americanExpress;
                                    break;
                                case 'Discover':
                                    value = discover;
                                    break;
                                case 'Diners Club':
                                    value = dinersClub;
                                    break;
                                case 'JCB':
                                    value = jcb;
                                    break;
                                case 'Unknown':
                                    value = card;
                                    break;
                                default:
                                    value = card;
                                    break;
                            }
                        }
                    }
                }

                scope.class = value;
            });
        }
    };
});
