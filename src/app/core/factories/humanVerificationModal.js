import _ from 'lodash';

/* @ngInject */
function humanVerificationModal($http, $rootScope, pmModal, User, networkActivityTracker) {
    function handleResult({ data = {} }) {
        return Promise.resolve(data);
    }
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/humanVerification.tpl.html'),
        /* @ngInject */
        controller: function(params, $scope) {
            const self = this;
            const unsubscribe = [];

            self.tokens = { captcha: '' };

            const promise = User.human()
                .then(handleResult)
                .then(({ VerifyMethods, Token }) => {
                    self.token = Token;
                    self.methods = VerifyMethods;
                    // NOTE this part need to change if we add other options
                    self.showCaptcha = _.includes(VerifyMethods, 'captcha');
                    self.verificator = 'captcha';
                });

            networkActivityTracker.track(promise);

            self.submit = () => {
                const promise = User.check({ Token: self.tokens[self.verificator], TokenType: self.verificator })
                    .then(handleResult)
                    .then(() => {
                        params.close(true);
                    })
                    .catch(() => {
                        params.close(true);
                    });
                networkActivityTracker.track(promise);
            };

            self.cancel = () => params.close(false);

            unsubscribe.push(
                $rootScope.$on('captcha.token', (event, token) => {
                    $scope.$applyAsync(() => {
                        self.tokens.captcha = token;
                    });
                })
            );

            self.$onDestroy = () => {
                unsubscribe.forEach((cb) => cb());
                unsubscribe.length = 0;
            };
        }
    });
}
export default humanVerificationModal;
