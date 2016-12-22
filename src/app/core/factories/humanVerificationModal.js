angular.module('proton.core')
.factory('humanVerificationModal', ($http, $rootScope, pmModal, User, networkActivityTracker) => {
    function handleResult({ data = {} }) {
        if (data.Code === 1000) {
            return Promise.resolve(data);
        } else if (data.Error) {
            return Promise.reject(data.Error);
        }
        return Promise.reject('Error');
    }
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/humanVerification.tpl.html',
        controller(params) {
            const self = this;
            const unsubscribe = [];
            self.tokens = {
                captcha: ''
            };
            const promise = User.human()
            .then(handleResult)
            .then(({ VerifyMethods, Token }) => {
                self.token = Token;
                self.methods = VerifyMethods;
                // NOTE this part need to change if we add other options
                self.showCaptcha = _.contains(VerifyMethods, 'captcha');
                self.verificator = 'captcha';
            });
            networkActivityTracker.track(promise);
            self.submit = () => {
                const promise = User.check({ Token: self.tokens[self.verificator], TokenType: self.verificator })
                .then(handleResult)
                .then(() => {
                    params.close();
                })
                .catch(() => {
                    params.close();
                });
                networkActivityTracker.track(promise);
            };
            unsubscribe.push($rootScope.$on('captcha.token', (event, token) => {
                self.tokens.captcha = token;
            }));
            self.$onDestroy = () => {
                unsubscribe.forEach((cb) => cb());
                unsubscribe.length = 0;
            };
        }
    });
});
