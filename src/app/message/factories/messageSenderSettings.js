import { CONTACT_ERROR, SEND_TYPES } from '../../constants';
import { normalizeEmail } from '../../../helpers/string';

/* @ngInject */
function messageSenderSettings(
    contactEncryptionModel,
    contactEmails,
    contactSchema,
    Contact,
    keyCache,
    networkActivityTracker,
    autoPinPrimaryKeys,
    contactEncryptionModal,
    sendPreferences,
    contactEditor,
    mailSettingsModel,
    contactEncryptionSaver,
    dispatchers
) {
    const { dispatcher } = dispatchers(['message']);

    const getContact = ({ ContactID, Email }) => {
        return Contact.get(ContactID).then((contact) => {
            if (contact.errors.includes(CONTACT_ERROR.TYPE2_CONTACT_VERIFICATION)) {
                return autoPinPrimaryKeys.resign([Email]).then((pinned) => (pinned ? contact : false));
            }
            return contact;
        });
    };

    const getNewContact = ({ Address, Name }) => {
        const contact = angular.copy(contactSchema.contactAPI);
        contact.vCard.add('email', Address, { group: 'item1' });
        contact.vCard.set('fn', Name || Address, { type: 'x-fn' });
        return contact;
    };

    const updateContact = async (scope, contact, normalizedEmail) => {
        const partialUpdate = contact.ID
            ? contactEditor.updateUnencrypted({ contact })
            : contactEditor.createSingular({ contact });
        await partialUpdate;
        const {
            [normalizedEmail]: { pinned, scheme }
        } = await sendPreferences.get([normalizedEmail]);

        scope.message.promptKeyPinning = !pinned && mailSettingsModel.get('PromptPin') && scheme === SEND_TYPES.SEND_PM;
        dispatcher.message('reload', { conversationID: scope.message.ConversationID });
    };

    const showSettings = async (scope) => {
        const normalizedEmail = normalizeEmail(scope.message.SenderAddress);
        const contactEmail = contactEmails.findEmail(normalizedEmail, normalizeEmail);
        const contactPromise = contactEmail ? getContact(contactEmail) : getNewContact(scope.message.Sender);
        const getData = Promise.all([keyCache.get([normalizedEmail]), contactPromise]);

        networkActivityTracker.track(getData);

        const [{ [normalizedEmail]: keys }, contact] = await getData;

        if (contact === false) {
            return;
        }

        const model = contactEncryptionModel.prepare(contact.vCard, normalizedEmail);

        contactEncryptionModal.activate({
            params: {
                email: normalizedEmail,
                model,
                internalKeys: keys,
                async save(model) {
                    contact.vCard = contactEncryptionSaver.build(contact.vCard, normalizedEmail, model);
                    contactEncryptionModal.deactivate();

                    networkActivityTracker.track(updateContact(scope, contact, normalizedEmail));
                },
                close: contactEncryptionModal.deactivate
            }
        });
    };

    return { showSettings };
}
export default messageSenderSettings;
