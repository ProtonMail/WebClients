import { normalizeEmail } from '../../../helpers/string';

/* @ngInject */
function messageResign(
    contactEmails,
    Contact,
    networkActivityTracker,
    gettextCatalog,
    notification,
    dispatchers,
    translator
) {
    const I18N = translator(() => ({
        SUCCES_MESSAGE: gettextCatalog.getString('Contact re-signed', null, 'Success')
    }));

    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/message/messageResign.tpl.html'),
        link(scope, el) {
            const { dispatcher } = dispatchers(['contacts']);
            const resign = () => {
                const normalizedEmail = normalizeEmail(scope.message.SenderAddress);
                const contactEmail = contactEmails.findEmail(normalizedEmail, normalizeEmail);
                const promise = Contact.get(contactEmail.ContactID)
                    .then((contact) => Contact.updateUnencrypted(contact))
                    .then(({ Contact, cards }) => dispatcher.contacts('contactUpdated', { contact: Contact, cards }))
                    .then(() => scope.message.clearTextBody(true))
                    .then(() => notification.success(I18N.SUCCES_MESSAGE))
                    .then(() => scope.$applyAsync(() => (scope.message.askResign = false)));
                networkActivityTracker.track(promise);
            };
            const resignButton = el[0].querySelector('.message-resign-button');
            resignButton.addEventListener('click', resign);
        }
    };
}
export default messageResign;
