angular.module('proton.user')
    .directive('signupHumanForm', ($rootScope) => {

        return {
            replace: true,
            scope: {
                account: '='
            },
            templateUrl: 'templates/user/signupHumanForm.tpl.html',
            link(scope, el) {

                const onSubmit = (e) => {
                    e.preventDefault();

                    $rootScope.$emit('signup', {
                        type: 'humanform.submit',
                        data: {
                            form: scope.account
                        }
                    });
                };

                el.on('submit', onSubmit);

                scope.$on('$destroy', () => {
                    el.off('submit', onSubmit);
                });
            }
        };
    });
