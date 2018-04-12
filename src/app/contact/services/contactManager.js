import _ from 'lodash';

import { CONTACT_ERROR } from '../../constants';
import { toList } from '../../../helpers/arrayHelper';
import { normalizeEmail } from '../../../helpers/string';

/* @ngInject */
function contactManager(Contact, contactSchema, autoPinPrimaryKeys, keyCache, contactEmails) {
    const getContact = async ({ ContactID, Email }) => {
        const contact = await Contact.get(ContactID);
        if (contact.errors.includes(CONTACT_ERROR.TYPE2_CONTACT_VERIFICATION)) {
            const pinned = await autoPinPrimaryKeys.resign([Email]);
            return pinned ? contact : false;
        }
        return contact;
    };

    const getNewContact = ({ Address, Name }) => {
        const contact = angular.copy(contactSchema.contactAPI);
        contact.vCard.add('email', Address, { group: 'item1' });
        contact.vCard.set('fn', Name, { type: 'x-fn' });
        return contact;
    };

    const get = async (contact, isNew) => (contact && !isNew ? getContact(contact) : getNewContact(contact));

    const removeGroup = (vcard, group) =>
        _.forEach(vcard.data, (properties, key) => {
            const filteredProperties = toList(properties).filter((prop) => prop.group !== group);
            vcard.remove(key);
            filteredProperties.forEach((prop) => vcard.addProperty(prop));
        });

    const merge = (contactOne, contactTwo, email) => {
        const emails = toList(contactOne.get('email'));
        const emailProp = emails.find((prop) => prop.valueOf() === email);
        // remove non grouped attributes
        removeGroup(contactTwo, undefined);

        _.map(contactTwo.data, toList).forEach((property) => (property.group = emailProp.group));

        removeGroup(contactOne, emailProp.group);

        _.map(contactTwo.data, toList).forEach((prop) => contactOne.addProperty(prop));
    };

    const loadKeys = async ({ SenderAddress, Sender } = {}, forceSender) => {
        const email = normalizeEmail(SenderAddress);
        const contactEmail = contactEmails.findEmail(email, normalizeEmail);

        const getContact = [contactEmail].concat(forceSender ? [Sender, !!contactEmail] : []);

        const [{ [email]: keys }, contact] = await Promise.all([keyCache.get([email]), get(...getContact)]);
        return { keys, email, contact };
    };

    return { merge, get, loadKeys };
}

export default contactManager;
