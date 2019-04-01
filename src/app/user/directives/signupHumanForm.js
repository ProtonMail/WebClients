/* @ngInject */
function signupHumanForm(dispatchers) {
    return {
        replace: true,
        scope: {
            account: '='
        },
        templateUrl: require('../../../templates/user/signupHumanForm.tpl.html'),
        link(scope, el) {
            scope.verificator = '';
            const { dispatcher } = dispatchers(['signup']);
            const onSubmit = (e) => {
                e.preventDefault();
                scope.$applyAsync(() => {
                    // Creates a bug on IE 11 as the submit event doesn't want to stop when we tell him to :/
                    if (scope.verificator !== 'donation') {
                        dispatcher.signup('humanform.submit', scope.account);
                    }
                });
            };

            el.on('submit', onSubmit);

            scope.$on('$destroy', () => {
                el.off('submit', onSubmit);
            });
        }
    };
}
export default signupHumanForm;
