import { queryContacts } from '../api/contacts';
import updateCollection from '../helpers/updateCollection';
import queryPages from '../api/helpers/queryPages';
import { CONTACTS_LIMIT, CONTACTS_REQUESTS_PER_SECOND } from '../constants';

/**
 * 1. Specific fields from the contact is picked to store less data in the cache
 * since all of the contacts are fetched and stored.
 * 2. It also handles the updates from the event manager where all of the contact
 * data is received.
 */
const pick = ({ ID, Name, LabelIDs }) => ({ ID, Name, LabelIDs });

const compareName = (a, b) => a.Name.localeCompare(b.Name);

export const getContactsModel = (api) => {
    return queryPages(
        (Page, PageSize) =>
            api(
                queryContacts({
                    Page,
                    PageSize,
                })
            ),
        {
            pageSize: CONTACTS_LIMIT,
            pagesPerChunk: CONTACTS_REQUESTS_PER_SECOND,
        }
    ).then((pages) => {
        return pages.flatMap(({ Contacts }) => Contacts.map(pick)).sort(compareName);
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
            merge: mergeModel,
        }).sort(compareName),
};
