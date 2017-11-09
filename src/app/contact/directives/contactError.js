angular.module('proton.contact')
    .directive('contactError', () => {
        return {
            replace: true,
            templateUrl: 'templates/contact/contactError.tpl.html'
        };
    });
