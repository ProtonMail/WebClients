import { createContext } from 'react';
import { useApi } from 'react-components';
import { queryContactEmails } from 'proton-shared/lib/api/contacts';
import queryPagesThrottled from 'proton-shared/lib/api/helpers/queryPagesThrottled';
import { CONTACT_EMAILS_LIMIT, CONTACTS_REQUESTS_PER_SECOND } from 'proton-shared/lib/constants';

import createProvider from './helpers/createProvider';
import createModelHook from './helpers/createModelHook';
import createUseModelHook from './helpers/createUseModelHook';

const useAsyncFn = () => {
    const api = useApi();

    return () => {
        const pageSize = CONTACT_EMAILS_LIMIT;

        const requestPage = (page) => {
            return api(
                queryContactEmails({
                    Page: page,
                    PageSize: pageSize
                })
            );
        };

        return queryPagesThrottled({
            requestPage,
            pageSize,
            pagesPerChunk: CONTACTS_REQUESTS_PER_SECOND,
            delayPerChunk: 1000
        }).then((pages) => {
            return pages.map(({ ContactEmails }) => ContactEmails);
        });
    };
};

const providerValue = createModelHook({
    useAsyncFn
});
export const ContactEmailsContext = createContext();
export const ContactEmailsProvider = createProvider(ContactEmailsContext, providerValue);
export const useContactEmails = createUseModelHook(ContactEmailsContext);
