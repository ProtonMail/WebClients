import { queryContactEmails } from '../api/contacts';
import queryPagesThrottled from '../api/helpers/queryPagesThrottled';
import updateCollection from '../helpers/updateCollection';
import { CONTACT_EMAILS_LIMIT, CONTACTS_REQUESTS_PER_SECOND } from '../constants';

export const getContactEmailsModel = (api) => {
    const pageSize = CONTACT_EMAILS_LIMIT;

    const requestPage = (page) => {
        return api(
            queryContactEmails({
                Page: page,
                PageSize: pageSize,
            })
        );
    };

    return queryPagesThrottled({
        requestPage,
        pageSize,
        pagesPerChunk: CONTACTS_REQUESTS_PER_SECOND,
        delayPerChunk: 1000,
    }).then((pages) => {
        return pages.map(({ ContactEmails }) => ContactEmails).flat();
    });
};

export const ContactEmailsModel = {
    key: 'ContactEmails',
    get: getContactEmailsModel,
    update: (model, events) => updateCollection({ model, events, item: ({ ContactEmail }) => ContactEmail }),
};
