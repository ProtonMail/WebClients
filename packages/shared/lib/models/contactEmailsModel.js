import { queryContactEmails } from '../api/contacts';
import queryPages from '../api/helpers/queryPages';
import { CONTACTS_REQUESTS_PER_SECOND, CONTACT_EMAILS_LIMIT } from '../constants';
import updateCollection from '../helpers/updateCollection';

export const getContactEmailsModel = (api) => {
    return queryPages(
        (page, pageSize) => {
            return api(
                queryContactEmails({
                    Page: page,
                    PageSize: pageSize,
                })
            );
        },
        {
            pageSize: CONTACT_EMAILS_LIMIT,
            pagesPerChunk: CONTACTS_REQUESTS_PER_SECOND,
            delayPerChunk: 1000,
        }
    ).then((pages) => {
        return pages.flatMap(({ ContactEmails }) => ContactEmails);
    });
};

export const ContactEmailsModel = {
    key: 'ContactEmails',
    get: getContactEmailsModel,
    update: (model, events) => updateCollection({ model, events, itemKey: 'ContactEmail' }),
};
