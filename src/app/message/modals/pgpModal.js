/* @ngInject */
function pgpModal(downloadFile, pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/message/pgpModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { Header, Body } = params.message;

            this.content = `${Header}\n\r${Body}`;
            this.cancel = params.cancel;
            this.download = () => {
                const blob = new Blob([this.content], { type: 'data:text/plain;charset=utf-8;' });
                const filename = 'pgp.txt';

                downloadFile(blob, filename);
            };
        }
    });
}
export default pgpModal;
