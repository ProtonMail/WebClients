angular.module('proton.contact')
    .directive('contactClear', () => {
        return {
            replace: true,
            templateUrl: 'templates/contact/contactClear.tpl.html'
        };
    });
