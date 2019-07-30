/* @ngInject */
function humanVerificationModal(dispatchers, pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/humanVerification.tpl.html'),
        /* @ngInject */
        controller: function(params, $scope) {
            const self = this;
            const { on, unsubscribe } = dispatchers();

            self.methods = params.methods;
            self.token = params.token;
            self.tokens = { captcha: '' };
            self.tokenType = 'captcha';
            self.cancel = () => params.close(false);

            self.submit = () =>
                params.close({
                    Token: self.tokens[self.tokenType],
                    TokenType: self.tokenType
                });

            on('captcha.token', (event, { type, data }) => {
                if (type === 'token') {
                    $scope.$applyAsync(() => {
                        self.tokens.captcha = data;
                    });
                }
            });

            self.$onDestroy = () => {
                unsubscribe();
            };
        }
    });
}
export default humanVerificationModal;
