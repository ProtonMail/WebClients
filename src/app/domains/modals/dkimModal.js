/* @ngInject */
function dkimModal(dispatchers, pmModal) {
    const ACTIVE = 0;
    const PENDING = 1;
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/domain/dkim.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { dispatcher } = dispatchers(['domainModal']);
            const { Keys = [] } = params.domain || {};

            this.domain = params.domain;
            this.domainKeys = Keys.filter(({ State }) => [ACTIVE, PENDING].includes(State));
            this.step = params.step;
            this.open = (type) => dispatcher.domainModal(type, { domain: params.domain });
            this.next = () => {
                params.next();
            };
            this.close = () => {
                params.close();
            };
        }
    });
}
export default dkimModal;
