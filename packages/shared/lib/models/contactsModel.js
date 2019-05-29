import { queryContacts } from '../api/contacts';
import updateCollection from '../helpers/updateCollection';
import queryPagesThrottled from '../api/helpers/queryPagesThrottled';
import { CONTACTS_LIMIT, CONTACTS_REQUESTS_PER_SECOND } from '../constants';

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
        delayPerChunk: 0
    }).then((pages) => {
        return pages.map(({ Contacts }) => Contacts);
    });
};

export const ContactsModel = {
    key: 'Contacts',
    get: getContactsModel,
    update: (model, events) => updateCollection(model, events, 'Contact')
};
