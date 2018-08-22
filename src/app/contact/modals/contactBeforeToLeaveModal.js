/* @ngInject */
function contactBeforeToLeaveModal(gettextCatalog, discardModal) {
    const I18N = {
        title: gettextCatalog.getString('Save Changes?', null, 'Title for contact modal'),
        message: gettextCatalog.getString(
            'There are unsaved changes to the contact you are editing. Do you want to save changes?',
            null,
            'Message for contact modal'
        )
    };

    const activate = ({ params }) => {
        return discardModal.activate({
            params: {
                I18N,
                cancel: discardModal.deactivate,
                ...params
            }
        });
    };

    const deactivate = discardModal.deactivate;

    return { activate, deactivate };
}
export default contactBeforeToLeaveModal;
