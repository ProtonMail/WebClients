import { toList } from '../../../helpers/arrayHelper';
import { groupMatcher, getGroup } from '../../../helpers/vcard';
import { VCARD_KEY_FIELDS } from '../../constants';

/* @ngInject */
function contactEncryptionSaver(contactDetailsModel, Contact) {
    /**
     * Finds the group of the email in the `oldCard` by looking at the email at index `newIndex` in `newCard`
     * @param {vCard} oldCard
     * @param {vCard} newCard
     * @param {Integer} newIndex
     * @returns {String|Undefined} The group or undefined if not a good match could be found to overwrite.
     */
    const findGroup = (oldCard, newCard, newIndex) => {
        // find the actual email address
        const properties = toList(newCard.get('email'));
        const values = properties.map((property) => property.valueOf());
        const email = values[newIndex];

        // if we have multiple of these emails: just save all of them.
        if (!email || values.indexOf(email) !== values.lastIndexOf(email)) {
            return;
        }
        const oldProperties = toList(oldCard.get('email'));
        const oldValues = oldProperties.map((property) => property.valueOf());
        const index = oldValues.indexOf(email);

        // Not found in the original list: just save all emails
        if (index < 0 || index !== values.lastIndexOf(email)) {
            return;
        }
        return oldProperties[index].getGroup();
    };
    /**
     * Overwrite all encryption settings for a certain group in the `targetCard`. Uses the applicable information from
     * `sourceCard`.
     * @param {String} targetGroup The group for which to overwrite the settings
     * @param {vCard} targetCard The card where we want to write the settings to
     * @param {vCard} sourceCard The card from which the new settings should be fetched
     */
    const overwriteGroup = (targetGroup, targetCard, sourceCard) => {
        const matchTargetGroup = groupMatcher(targetGroup);
        const matchNoTargetGroup = (x) => !matchTargetGroup(x);
        const email = toList(targetCard.get('email')).find(matchTargetGroup);
        const sourceGroup = getGroup(toList(sourceCard.get('email')), email.valueOf());
        const matchSourceGroup = groupMatcher(sourceGroup);
        VCARD_KEY_FIELDS.forEach((name) => {
            const sourceProperties = toList(sourceCard.get(name) || []).filter(matchSourceGroup);
            sourceProperties.forEach((prop) => (prop.group = targetGroup));

            const targetProperties = toList(targetCard.get(name) || [])
                .filter(matchNoTargetGroup)
                .concat(sourceProperties);

            targetCard.remove(name);
            targetProperties.forEach((prop) => targetCard.addProperty(prop));
        });
    };
    /**
     *
     * @param {vCard} targetCard
     * @param {vCard} sourceCard
     */
    const overwriteEmails = (targetCard, sourceCard) => {
        VCARD_KEY_FIELDS.concat('email').forEach((name) => {
            const properties = toList(sourceCard.get(name) || []);
            targetCard.remove(name);
            properties.forEach((prop) => targetCard.addProperty(prop));
        });
    };
    /**
     * Save the contact encryption settings for email at index `index`.
     * @param {Object} model The model that encodes all the current information set
     * @param {String} ID The ID of the contact
     * @param {Integer} index The index of the address that has been modified in terms of encryption settings
     * @returns {Promise.<void>}
     */
    const save = async (model, ID, index) => {
        const contact = await Contact.get(ID);

        const { vCard } = contactDetailsModel.prepare({ model });
        const group = findGroup(contact.vCard, vCard, index);

        if (group) {
            // overwrite a single group when found the original address
            overwriteGroup(group, contact.vCard, vCard, index);
        } else {
            // overwrite everything: could not find a good match
            overwriteEmails(contact.vCard, vCard);
        }

        await Contact.updateUnencrypted(contact);
    };

    return { save };
}
export default contactEncryptionSaver;
