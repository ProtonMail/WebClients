angular.module('proton.user')
    .directive('usernamePassword', () => {

        return {
            replace: true,
            scope: {
                form: '=',
                model: '='
            },
            templateUrl: 'templates/user/usernamePassword.tpl.html'
        };
    });
