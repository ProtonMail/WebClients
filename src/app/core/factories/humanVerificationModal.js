angular.module('proton.core')
.factory('humanVerificationModal', ($http, pmModal, User) => {
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
            User.human()
            .then(handleResult)
            .then(({ VerifyMethods, Token }) => {
                self.verifyMethods = VerifyMethods;
                self.token = Token;
            });
            self.submit = () => {
                User.check({ Token: self.token, TokenType: 'captcha' })
                .then(handleResult)
                .then(() => {

                });
            };
        }
    });
});
