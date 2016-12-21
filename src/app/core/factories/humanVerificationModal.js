angular.module('proton.core')
.factory('humanVerificationModal', ($http, pmModal, User, networkActivityTracker) => {
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
            self.verificator = 'captcha';
            self.tokens = {};
            const promise = User.human()
            .then(handleResult)
            .then(({ VerifyMethods, Token }) => {
                self.showCaptcha = _.contains(VerifyMethods, 'captcha');
                self.token = Token;
            });
            networkActivityTracker.track(promise);
            self.setCatpchaToken = (token) => self.tokens.captcha = token;
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
        }
    });
});
