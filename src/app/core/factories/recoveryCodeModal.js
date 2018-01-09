/* @ngInject */
function recoveryCodeModal(pmModal, downloadFile) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/twofactor/recoveryCode.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.recoveryCodesFirstHalf = params.recoveryCodes.slice(0, 8);
            this.recoveryCodesSecondHalf = params.recoveryCodes.slice(8, 16);
            this.download = () => {
                const blob = new Blob([params.recoveryCodes.join('\r\n')], { type: 'text/plain;charset=utf-8;' });
                const filename = 'protonmail_recovery_codes.txt';

                downloadFile(blob, filename);
            };
            this.done = () => {
                params.close();
            };
            this.cancel = () => {
                params.close();
            };
        }
    });
}
export default recoveryCodeModal;
