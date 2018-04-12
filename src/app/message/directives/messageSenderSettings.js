import { SEND_TYPES } from '../../constants';

/* @ngInject */
function messageSenderSettings(
    networkActivityTracker,
    contactDetailsModel,
    contactEncryptionModal,
    sendPreferences,
    contactEditor,
    contactManager
) {
    const update = (contact = {}, email) => {
        const promise = contact.ID
            ? contactEditor.updateUnencrypted({ contact })
            : contactEditor.create({ contacts: [contact] });

        return promise
            .then(() => sendPreferences.get([email]))
            .then(({ [email]: { pinned, scheme } }) => ({ pinned, scheme }));
    };

    const showSettings = async (scope, { forceSender } = {}) => {
        const promise = networkActivityTracker.track(contactManager.loadKeys(scope.message, forceSender));
        const { keys: internalKeys, email, contact } = await promise;

        if (contact === false) {
            return;
        }

        const model = contactDetailsModel.extract({
            vcard: contact.vCard,
            field: 'EMAIL'
        });
        const item = model.find(({ value }) => value === email);

        contactEncryptionModal.activate({
            params: {
                email,
                model: item.settings,
                save(model) {
                    item.settings = model;
                    item.type = 'email';
                    const { vCard: newvcard } = contactDetailsModel.prepare({
                        model: { Emails: [item] }
                    });

                    contactManager.merge(contact.vCard, newvcard, email);
                    contactEncryptionModal.deactivate();
                    const promise = update(contact, email).then(({ pinned, scheme }) => {
                        scope.$applyAsync(() => {
                            scope.message.promptKeyPinning = !pinned && scheme === SEND_TYPES.SEND_PM;
                            scope.message.clearTextBody(true);
                        });
                    });
                    networkActivityTracker.track(promise);
                },
                close: () => contactEncryptionModal.deactivate(),
                internalKeys
            }
        });
    };

    return { showSettings };
}
export default messageSenderSettings;
