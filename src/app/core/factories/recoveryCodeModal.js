angular.module('proton.core')
.factory('recoveryCodeModal', (pmModal) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/twofactor/recoveryCode.tpl.html',
        controller(params) {
            this.title = params.title;
            this.message = params.message;
            this.recoveryCodesFirstHalf = params.recoveryCodes.slice(0, 8);
            this.recoveryCodesSecondHalf = params.recoveryCodes.slice(8, 16);
            this.done = () => {
                if (angular.isDefined(params.done) && angular.isFunction(params.done)) {
                    params.done();
                }
            };
            this.download = () => {
                if (angular.isDefined(params.download) && angular.isFunction(params.download)) {
                    params.download();
                }
            };
            this.cancel = () => {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

        }
    });
});
