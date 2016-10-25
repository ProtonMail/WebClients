angular.module('proton.core')
.factory('identityModal', (pmModal, authentication) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/identity.tpl.html',
        controller(params) {
            this.defaultDisplayName = authentication.user.DisplayName;
            this.defaultSignature = authentication.user.Signature;
            this.address = params.address;
            this.address.DisplayName = this.address.DisplayName || authentication.user.DisplayName;
            this.address.Signature = this.address.Signature || authentication.user.Signature;
            this.address.custom = true;

            this.confirm = function () {
                params.confirm(this.address);
            };

            this.cancel = function () {
                params.cancel();
            };
        }
    });
});
