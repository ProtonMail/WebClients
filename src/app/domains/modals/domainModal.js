import _ from 'lodash';

/* @ngInject */
function domainModal(dispatchers, pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/domain/domain.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { dispatcher } = dispatchers(['domainModal']);

            this.step = params.step;
            this.next = params.next;
            this.cancel = params.cancel;
            this.domain = params.domain;
            this.name = '';
            this.open = (type) => dispatcher.domainModal(type, { domain: params.domain });
            this.submit = () => (params.submit || _.noop)(this.name);
            this.beginsWith = (value = '') => {
                const { name = '' } = this;
                return name.substring(0, value.length) === value;
            };
        }
    });
}
export default domainModal;
