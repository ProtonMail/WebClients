import _ from 'lodash';

import { toList } from '../../../helpers/arrayHelper';
import { CONTACT_ERROR, SEND_TYPES } from '../../constants';

/* @ngInject */
function messageSenderSettings(
    contactEmails,
    contactSchema,
    Contact,
    keyCache,
    networkActivityTracker,
    autoPinPrimaryKeys,
    contactDetailsModel,
    contactEncryptionModal,
    sendPreferences,
    contactEditor
) {
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
        contact.vCard.set('fn', Name, { type: 'x-fn' });
        return contact;
    };

    const removeGroup = (vcard, group) =>
        _.forEach(vcard.data, (properties, key) => {
            const filteredProperties = toList(properties).filter((prop) => prop.group !== group);
            vcard.remove(key);
            filteredProperties.forEach((prop) => vcard.addProperty(prop));
        });

    const mergeContact = (contactOne, contactTwo, email) => {
        const emails = toList(contactOne.get('email'));
        const emailProp = emails.find((prop) => prop.valueOf() === email);
        // remove non grouped attributes
        removeGroup(contactTwo, undefined);
        _.forEach(contactTwo.data, (properties) =>
            toList(properties).forEach((property) => (property.group = emailProp.group))
        );
        removeGroup(contactOne, emailProp.group);
        _.forEach(contactTwo.data, (properties) => toList(properties).forEach((prop) => contactOne.addProperty(prop)));
    };

    const showSettings = (scope) => {
        const normalizeEmail = (email) => email.toLowerCase();
        const normalizedEmail = normalizeEmail(scope.message.SenderAddress);
        const contactEmail = contactEmails.findEmail(normalizedEmail, normalizeEmail);

        const contactPromise = contactEmail ? getContact(contactEmail) : getNewContact(scope.message.Sender);
        const getData = Promise.all([keyCache.get([normalizedEmail]), contactPromise]);
        networkActivityTracker.track(getData);

        getData.then(([{ [normalizedEmail]: keys }, contact]) => {
            if (contact === false) {
                return;
            }

            const model = contactDetailsModel.extract({ vcard: contact.vCard, field: 'EMAIL' });
            const item = model.find(({ value }) => value === normalizedEmail);

            contactEncryptionModal.activate({
                params: {
                    email: normalizedEmail,
                    model: item.settings,
                    save: (model) => {
                        item.settings = model;
                        item.type = 'email';
                        const { vCard: newvcard } = contactDetailsModel.prepare({ model: { Emails: [item] } });
                        mergeContact(contact.vCard, newvcard, normalizedEmail);
                        contactEncryptionModal.deactivate();

                        const partialUpdate = contact.ID
                            ? contactEditor.updateUnencrypted({ contact })
                            : contactEditor.create({ contacts: [contact] });
                        const updatePromise = partialUpdate
                            .then(() => sendPreferences.get([normalizedEmail]))
                            .then(({ [normalizedEmail]: { pinned, scheme } }) =>
                                scope.$applyAsync(
                                    () => (scope.message.promptKeyPinning = !pinned && scheme === SEND_TYPES.SEND_PM)
                                )
                            )
                            .then(() => scope.message.clearTextBody(true));
                        networkActivityTracker.track(updatePromise);
                    },
                    close: () => contactEncryptionModal.deactivate(),
                    internalKeys: keys
                }
            });
        });
    };

    return { showSettings };
}
export default messageSenderSettings;
