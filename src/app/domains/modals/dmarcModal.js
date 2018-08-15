/* @ngInject */
function dmarcModal(dispatchers, pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/domain/dmarc.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { dispatcher } = dispatchers(['domainModal']);

            this.domain = params.domain;
            this.step = params.step;
            this.open = (type) => dispatcher.domainModal(type, { domain: params.domain });
            this.verify = () => {
                params.verify();
            };
            this.close = () => {
                params.close();
            };
        }
    });
}
export default dmarcModal;
