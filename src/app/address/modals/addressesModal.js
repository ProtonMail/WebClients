/* @ngInject */
function addressesModal(pmModal, CONSTANTS, $rootScope, organizationModel, addressModel, memberActions) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/address.tpl.html',
        /* @ngInject */
        controller: function(params) {
            const { domain, members, step, showMember = true } = params;
            const organization = organizationModel.get();

            this.keyPhase = CONSTANTS.KEY_PHASE;

            this.domain = domain;
            this.step = step;
            this.showMember = showMember && organization.HasKeys === 1 && this.keyPhase > 3;
            this.next = params.next;
            this.close = params.cancel;

            this.open = (name) => {
                $rootScope.$broadcast(name, params.domain);
            };

            this.getMember = (ID) => _.findWhere(members, { ID }) || {};

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
