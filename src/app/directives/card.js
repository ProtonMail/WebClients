angular.module('proton.card', [])

.directive('cardIcon', function (Payment) {
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

                // New value defined?
                if (angular.isDefined(newValue)) {
                    Payment.cardType(newValue)
                    .then(function(type) {
                        switch (type) {
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

                        scope.class = value;
                    });
                }

                scope.class = value;
            });
        }
    };
});
