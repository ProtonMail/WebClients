import { useContext, useCallback } from 'react';
import { getContact } from 'proton-shared/lib/api/contacts';
import { Contact } from 'proton-shared/lib/interfaces/contacts/Contact';

import { useApi, useCachedModelResult } from '../../hooks';

import ContactProviderContext from './ContactProviderContext';

const useContact = (contactID: string) => {
    const cache = useContext(ContactProviderContext);
    const api = useApi();

    const miss = useCallback(() => {
        return api<{ Contact: Contact[] }>(getContact(contactID)).then(({ Contact }) => Contact);
    }, []);

    return useCachedModelResult(cache, contactID, miss);
};

export default useContact;
