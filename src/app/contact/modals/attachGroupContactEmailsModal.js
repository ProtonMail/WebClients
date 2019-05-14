/* @ngInject */
function attachGroupContactEmailsModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/contact/attachGroupContactEmailsModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.contacts = params.contacts.reduce((acc, contact) => {
                if (contact.Emails.length === 1) {
                    contact.Emails[0].isSelected = true;
                    acc.push(contact);
                }

                // Ignore contacts without emails
                if (contact.Emails.length > 1) {
                    acc.push(contact);
                }

                return acc;
            }, []);

            this.submit = () => {
                const emails = this.contacts.reduce((acc, { Emails = [] }) => {
                    const emails = Emails.filter((email) => email.isSelected);
                    acc.push(...emails);
                    return acc;
                }, []);

                params.submit({
                    attach: {
                        label: params.label,
                        emails
                    }
                });
            };
        }
    });
}
export default attachGroupContactEmailsModal;
