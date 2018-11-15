/* @ngInject */
function contactGroupModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/contact/contactGroupModal.tpl.html'),
        /* @ngInject */
        controller: function(
            params,
            $scope,
            dispatchers,
            sanitize,
            networkActivityTracker,
            manageContactGroup,
            eventManager
        ) {
            const { on, unsubscribe } = dispatchers();

            const getDefault = (key) => (params.model || {})[key] || '';

            this.model = {
                ID: getDefault('ID') || undefined,
                name: getDefault('Name'),
                color: getDefault('Color'),
                Display: getDefault('Display') || undefined,
                contacts: (params.group || []).map(({ ID, Name, Email }) => ({
                    ID,
                    Name,
                    Email
                }))
            };

            on('manageContactGroup', (e, { type, data = {} }) => {
                if (type === 'remove.contact') {
                    $scope.$applyAsync(() => {
                        this.model.contacts = this.model.contacts.filter(({ ID }) => {
                            return ID !== data.contact.ID;
                        });
                    });
                }
            });

            const cleanInput = ({ ID = '', name = '', color = '', contacts = [] } = {}) => ({
                ID: sanitize.input(ID) || undefined,
                Name: sanitize.input(name),
                Color: sanitize.input(color),
                ContactIDs: contacts.map(({ ID }) => sanitize.input(ID))
            });

            this.create = (form) => {
                if (form.$invalid) {
                    return; // we display the information inside the form
                }

                const create = async (data) => {
                    await manageContactGroup.save(data);
                    params.close();
                    eventManager.call();
                };

                const data = cleanInput(this.model);
                networkActivityTracker.track(create(data));
            };

            this.$onDestroy = () => {
                unsubscribe();
            };
        }
    });
}
export default contactGroupModal;
