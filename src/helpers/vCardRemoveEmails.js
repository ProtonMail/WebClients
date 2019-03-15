import _ from 'lodash';
import vCard from 'vcf';

import { GROUP_FIELDS } from './vCardFields';

/**
 * Remove an email from a vCard, and if it was the only one we remove the email property.
 * @param  {vCard} vCard
 * @param  {Array} contactEmails List of contactEmails to remove for a contact
 * @return {vCard}           Updated vCard
 */
export function removeEmail(card, contactEmails = []) {
    const [newCard] = vCard.parse(card.toString());
    const emails = newCard.get('email');
    const list = Array.isArray(emails) ? emails : [emails];
    const mapEmails = _.groupBy(contactEmails, 'Email');

    const newProps = list.filter((prop) => {
        // eslint-disable-next-line no-underscore-dangle
        const listEmails = mapEmails[prop._data];

        // Keep item if we have no matches or no match for this emails
        if (!listEmails || !listEmails.length) {
            return true;
        }

        // Check if we have items with a match on types, so ignore them
        return !listEmails.some((contact) => {
            const { Type = [] } = contact;
            return Type.some((item) => {
                // Sometimes upper, sometimes lower :/
                const type = (prop.type || '').toLowerCase();
                return type.includes(item.toLowerCase());
            });
        });
    });

    // Contact with only one email, remove all fields linked to the email
    if (!newProps.length) {
        GROUP_FIELDS.forEach((field) => {
            newCard.remove(field);
        });
        return newCard;
    }
    newCard.data.email = newProps;
    return newCard;
}

/**
 * Format a property with a new index.
 * Keep the config for the old group with the new one, for a later update of others fields linked to
 * emails.
 * @param  {vCard.Property} prop
 * @param  {Number} index  New index of the prop
 * @return {Object}       { newProp: <vCard.Property>, config[oldGroupName]: { oldParams, params } }
 */
function formatProp(prop, index) {
    const oldParams = prop.getParams();
    const params = {
        ...oldParams,
        group: `item${index}`,
        pref: index
    };

    return {
        newProp: new vCard.Property(prop.getField(), prop.valueOf(), params),
        config: {
            [oldParams.group]: {
                lastIndex: 0, // Usefull when we will reorder
                oldParams,
                params
            }
        }
    };
}

/**
 * Take a card where ex: you removed 2 emails and then process the card to update
 * Every GROUP_FIELDS to match the new order of emails.
 * Update the group, the pref and the type.
 * @param  {vCard} currentvCard vCard to edit
 * @return {vCard}              New vCard well formated
 */
export function syncPropertiesGroups(currentvCard) {
    const newCard = new vCard();
    const emails = currentvCard.get('email');
    const list = Array.isArray(emails) ? emails : [emails];

    /*
        Format new emails of the vCard with new position (group, pref etc.)
        and extract the config for others grouped fields.
     */
    const { list: properties, config } = list.reduce(
        (acc, prop, index) => {
            // eslint-disable-next-line no-underscore-dangle
            if (Array.isArray(prop._data)) {
                // eslint-disable-next-line no-underscore-dangle
                prop._data.forEach((item, index) => {
                    const { newProp, config } = formatProp(item, index + 1);
                    Object.assign(acc.config, config);
                    acc.list.push(newProp);
                });
                return acc;
            }

            const { newProp, config } = formatProp(prop, index + 1);
            Object.assign(acc.config, config);
            acc.list.push(newProp);
            return acc;
        },
        { list: [], config: {} }
    );
    /**
     * Format new properties if they have a group.
     * We update the prop with the new config for this group.
     * And we update the order for pref.
     * @param  {vCard.Property} prop
     * @param  {Number} index   prop's index inside the list
     * @return {vCard.Property}
     */
    const formatNewProp = (prop) => {
        const { group, type } = config[prop.getGroup()].params;
        const oldParams = prop.getParams();

        return new vCard.Property(prop.getField(), prop.valueOf(), {
            ...oldParams,
            ...(oldParams.type && { type }),
            ...(oldParams.pref && { pref: ++config[prop.getGroup()].lastIndex }),
            ...(oldParams.group && { group })
        });
    };

    const isNewProp = (prop) => config[prop.getGroup()];

    Object.keys(currentvCard.data).forEach((field) => {
        const prop = currentvCard.get(field);

        // Fields without any custom group, so we can attach then easily
        if (!GROUP_FIELDS.includes(field)) {
            newCard.addProperty(prop);
            return;
        }

        // It's already done as we need it to update other grouped fields
        if (field !== 'email') {
            // It doesn't exist for the contact, osef
            if (!prop) {
                return;
            }

            if (Array.isArray(prop)) {
                const properties = prop.filter(isNewProp).map(formatNewProp);
                newCard.data[field] = properties;
                return;
            }

            if (isNewProp(prop)) {
                const newProp = formatNewProp(prop);
                newCard.addProperty(newProp);
            }
        }
    });

    newCard.data.email = properties;
    return newCard;
}

/**
 * Edit a vCard to remove one or many emails.
 * @param  {vCard}  card
 * @param  {Array}  contactEmails List of Emails we need to remove
 * @param  {Boolean} isUniq     If the contact contains only one email
 * @return {vCard}             New vCard
 */
function flow(card, contactEmails) {
    const newCard = removeEmail(card, contactEmails);
    const emails = newCard.get('email');

    // No emails means we already removed everything
    if (!emails) {
        return newCard;
    }
    return syncPropertiesGroups(newCard);
}

export default flow;
