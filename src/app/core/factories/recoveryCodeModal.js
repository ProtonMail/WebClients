angular.module('proton.core')
.factory('recoveryCodeModal', (pmModal) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/twofactor/recoveryCode.tpl.html',
        controller(params) {
            this.recoveryCodesFirstHalf = params.recoveryCodes.slice(0, 8);
            this.recoveryCodesSecondHalf = params.recoveryCodes.slice(8, 16);
            this.download = () => {
                const blob = new Blob([params.recoveryCodes.join('\r\n')], { type: 'text/plain;charset=utf-8;' });
                window.saveAs(blob, 'protonmail_recovery_codes.txt');
            };
            this.done = () => {
                params.close();
            };
            this.cancel = () => {
                params.close();
            };
        }
    });
});
