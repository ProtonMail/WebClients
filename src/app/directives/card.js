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


            scope.class = '';
        }
    };
});
