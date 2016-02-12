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
                scope.class = card;

                // New value defined?
                if (angular.isDefined(newValue)) {
                    Payment.cardType(newValue)
                    .then(function(type) {
                        switch (type) {
                            case 'Visa':
                            scope.class = visa;
                            break;
                            case 'MasterCard':
                            scope.class = mastercard;
                            break;
                            case 'American Express':
                            scope.class = americanExpress;
                            break;
                            case 'Discover':
                            scope.class = discover;
                            break;
                            case 'Diners Club':
                            scope.class = dinersClub;
                            break;
                            case 'JCB':
                            scope.class = jcb;
                            break;
                            case 'Unknown':
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
