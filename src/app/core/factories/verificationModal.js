/* @ngInject */
function verificationModal(dispatchers, pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/domain/verification.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { dispatcher } = dispatchers(['domainModal']);

            this.domain = params.domain;
            this.step = params.step;
            this.open = (type) => dispatcher.domainModal(type, { domain: params.domain });
            this.submit = params.submit;
            this.next = () => {
                params.close();
                params.next();
            };
            this.close = params.close;
        }
    });
}
export default verificationModal;
