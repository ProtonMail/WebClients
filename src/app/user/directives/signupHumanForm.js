/* @ngInject */
function signupHumanForm(dispatchers) {
    return {
        replace: true,
        scope: {
            account: '='
        },
        templateUrl: require('../../../templates/user/signupHumanForm.tpl.html'),
        link(scope, el) {
            const { dispatcher } = dispatchers(['signup']);
            const onSubmit = (e) => {
                e.preventDefault();

                dispatcher.signup('humanform.submit', {
                    form: scope.account
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
