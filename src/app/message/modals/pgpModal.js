/* @ngInject */
function pgpModal(downloadFile, pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/message/pgpModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { Header, Body } = params.message;
            this.content = `${Header}\n\r${Body}`;
            this.download = () => {
                const blob = new Blob([this.content], { type: 'data:text/plain;charset=utf-8;' });
                downloadFile(blob, 'pgp.txt');
            };
        }
    });
}
export default pgpModal;
