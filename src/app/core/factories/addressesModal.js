angular.module('proton.core')
.factory('addressesModal', (pmModal, CONSTANTS, addressModal, memberModal, $rootScope, organizationModel) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/address.tpl.html',
        controller(params) {
            // Variables
            const { domain, members, step, addressParams, memberParams, showMember = true } = params;
            const organization = organizationModel.get();

            this.keyPhase = CONSTANTS.KEY_PHASE;

            this.domain = domain;
            this.step = step;
            this.showMember = showMember && organization.HasKeys === 1 && this.keyPhase > 3;

            this.open = (name) => {
                $rootScope.$broadcast(name, params.domain);
            };

            // Functions
            this.getMember = (id) => {
                const index = _.findIndex(members, { ID: id });
                if (index !== -1) {
                    return members[index];
                }
                return {};
            };

            this.addAddress = () => {
                params.cancel();
                addressModal.activate(addressParams);
            };

            this.addMember = () => {
                params.cancel();
                memberModal.activate(memberParams);
            };

            this.next = () => {
                params.next();
            };

            this.close = () => {
                params.cancel();
            };
        }
    });
});
