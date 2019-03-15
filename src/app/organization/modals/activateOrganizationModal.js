/* @ngInject */
function activateOrganizationModal(pmModal, gettextCatalog, activateOrganizationKeys, translator) {
    const I18N = translator(() => ({
        1: {
            TITLE: gettextCatalog.getString('Key Activation', null, 'Title'),
            PROMPT: gettextCatalog.getString('Organization password:', null, 'Label'),
            MESSAGE: gettextCatalog.getString(
                'You must activate your organization private key with the backup organization key password provided to you by your organization administrator.',
                null,
                'Info'
            ),
            ALERT: gettextCatalog.getString(
                'Without activation you will not be able to create new users, add addresses to existing users, or access non-private user accounts.',
                null,
                'Info'
            ),
            SUCCESS_MESSAGE: gettextCatalog.getString('Organization keys activated', null, 'Info'),
            ERROR_MESSAGE: gettextCatalog.getString('Error activating organization keys', null, 'Error')
        },
        2: {
            TITLE: gettextCatalog.getString('Restore Administrator Privileges', null, 'Title'),
            PROMPT: gettextCatalog.getString('Organization password:', null, 'Label'),
            MESSAGE: gettextCatalog.getString(
                'Enter the Organization Password to restore administrator privileges. <a href="https://protonmail.com/support/knowledge-base/restore-administrator/" target="_blank">Learn more</a>',
                null,
                'Info'
            ),
            ALERT: gettextCatalog.getString(
                'If another administrator changed this password, you will need to ask them for the new Organization Password.',
                null,
                'Info'
            ),
            SUCCESS_MESSAGE: gettextCatalog.getString('Organization keys restored', null, 'Info'),
            ERROR_MESSAGE: gettextCatalog.getString('Error restoring organization keys', null, 'Error')
        },
        default: {
            TITLE: gettextCatalog.getString('Administrator Key Activation', null, 'Title'),
            PROMPT: gettextCatalog.getString('Enter activation passcode:', null, 'Info')
        }
    }));

    const getAlertClass = (keyStatus) => {
        if (keyStatus === 1) {
            return 'alert alert-warning';
        }
        return 'alert alert-danger';
    };

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/activateOrganization.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const context = I18N[params.keyStatus];

            this.inputCode = '';
            this.alertClass = getAlertClass(params.keyStatus);
            this.title = context.TITLE || I18N.default.TITLE;
            this.prompt = context.PROMPT || I18N.default.PROMPT;
            this.message = context.MESSAGE || '';
            this.alert = context.ALERT || '';
            this.showReset = params.keyStatus === 2;
            this.cancel = params.cancel;
            this.reset = params.reset;

            this.submit = () => {
                activateOrganizationKeys(context)
                    .reload(this.inputCode)
                    .then(params.submit);
            };
        }
    });
}
export default activateOrganizationModal;
