angular.module('proton.contact')
    .directive('contactPlaceholder', () => {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'templates/contact/contactPlaceholder.tpl.html'
        };
    });
