/* @ngInject */
function domainModal(pmModal, $rootScope) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/domain/domain.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.step = params.step;
            this.next = params.next;
            this.cancel = params.cancel;
            this.domain = params.domain;
            this.name = '';

            this.open = (name) => {
                $rootScope.$broadcast(name, params.domain);
            };

            this.submit = () => (params.submit || _.noop)(this.name);
            this.beginsWith = (value = '') => {
                const { name = '' } = this;
                return name.substring(0, value.length) === value;
            };
        }
    });
}
export default domainModal;
