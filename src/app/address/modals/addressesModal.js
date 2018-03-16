import _ from 'lodash';

/* @ngInject */
function addressesModal(pmModal, $rootScope, organizationModel, addressModel, memberActions) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/domain/address.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { domain, members, step, showMember = true } = params;
            const organization = organizationModel.get();

            this.domain = domain;
            this.step = step;
            this.showMember = showMember && organization.HasKeys === 1;
            this.next = params.next;
            this.close = params.cancel;

            this.open = (name) => {
                $rootScope.$broadcast(name, params.domain);
            };

            this.getMember = (ID) => _.find(members, { ID }) || {};

            this.addAddress = () => {
                params.cancel();
                addressModel.add(domain);
            };

            this.addMember = () => {
                params.cancel();
                memberActions.addFromDomain(domain);
            };
        }
    });
}
export default addressesModal;
