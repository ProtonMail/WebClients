angular.module('proton.user')
    .directive('usernameDomain', () => {

        return {
            replace: true,
            scope: {
                form: '=',
                model: '=',
                domains: '='
            },
            templateUrl: 'templates/user/usernameDomain.tpl.html'
        };
    });
