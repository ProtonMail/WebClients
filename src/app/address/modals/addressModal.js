import { CONSTANTS } from '../../constants';
/* @ngInject */
function addressModal(
    authentication,
    pmModal,
    $rootScope,
    $state,
    networkActivityTracker,
    notification,
    Address,
    gettextCatalog,
    organizationModel,
    tools
) {
    const I18N = {
        ERROR_DECRYPT_ORG_KEY: gettextCatalog.getString('Cannot decrypt organization key', null, 'Error'),
        SUCCESS_ADD: gettextCatalog.getString('Address added', null, 'Info')
    };

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/addAddress.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { domains = [], organizationKey = null, members = [] } = params;
            const organization = organizationModel.get();
            const [{ DisplayName, Signature }] = authentication.user.Addresses || [];

            // NOTE DisplayName and Signature can be set to null
            this.model = { DisplayName: DisplayName || '', Signature: tools.replaceLineBreaks(Signature || '') };
            this.domain = domains[0];
            this.domains = domains;
            this.address = '';
            this.size = CONSTANTS.ENCRYPTION_DEFAULT;
            this.members = members;
            this.member = members[0];
            this.showAddMember = organization.HasKeys === 1 && $state.is('secured.domains');
            this.addMember = params.addMember;
            this.cancel = params.cancel;
            this.open = (name) => $rootScope.$broadcast(name, params.domain);
            this.submit = () => {
                if (this.member.Private === 0 && !organizationKey) {
                    return notification.error(I18N.ERROR_DECRYPT_ORG_KEY);
                }

                const { DisplayName, Signature } = this.model;
                const parameters = {
                    DisplayName,
                    Signature,
                    Local: this.address,
                    Domain: this.domain.DomainName,
                    MemberID: this.member.ID
                };

                const promise = Address.create(parameters).then((data = {}) => {
                    notification.success(I18N.SUCCESS_ADD);
                    params.submit(data.Address, this.member);
                });

                networkActivityTracker.track(promise);
            };
        }
    });
}
export default addressModal;
