import { queryContacts } from '../api/contacts';
import updateCollection from '../helpers/updateCollection';
import queryPagesThrottled from '../api/helpers/queryPagesThrottled';
import { CONTACTS_LIMIT, CONTACTS_REQUESTS_PER_SECOND } from '../constants';

/**
 * 1. Specific fields from the contact is picked to store less data in the cache
 * since all of the contacts are fetched and stored.
 * 2. It also handles the updates from the event manager where all of the contact
 * data is received.
 */
const pick = ({ ID, Name, LabelIDs }) => ({ ID, Name, LabelIDs });

export const getContactsModel = (api) => {
    const pageSize = CONTACTS_LIMIT;

    const requestPage = (Page) =>
        api(
            queryContacts({
                Page,
                PageSize: pageSize
            })
        );

    return queryPagesThrottled({
        requestPage,
        pageSize,
        pagesPerChunk: CONTACTS_REQUESTS_PER_SECOND,
        delayPerChunk: 100
    }).then((pages) => {
        return pages.map(({ Contacts }) => Contacts.map(pick)).flat();
    });
};

const mergeModel = (oldModel, newModel) => {
    // Contacts events return the full new model
    return newModel;
};

export const ContactsModel = {
    key: 'Contacts',
    get: getContactsModel,
    update: (model, events) =>
        updateCollection({
            model,
            events,
            item: ({ Contact }) => pick(Contact),
            merge: mergeModel
        })
};
