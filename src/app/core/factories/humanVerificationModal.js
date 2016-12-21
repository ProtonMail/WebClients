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
        templateUrl: 'templates/modals/humanVerificationModal.tpl.html',
        controller(params) {
            const self = this;
            self.verifyMethods = [];
            const promise = User.human()
            .then(handleResult)
            .then(({ VerifyMethods, Token }) => {
                self.verifyMethods = VerifyMethods;
                self.token = Token;
            });
            networkActivityTracker.track(promise);
            self.submit = () => {
                const promise = User.check({ Token: self.token, TokenType: 'captcha' })
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
