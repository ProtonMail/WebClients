import { useCallback, useContext } from 'react';

import useApi from '@proton/components/hooks/useApi';
import { getContact } from '@proton/shared/lib/api/contacts';
import type { Contact } from '@proton/shared/lib/interfaces/contacts/Contact';

import useCachedModelResult from '../../../hooks/useCachedModelResult';
import ContactProviderContext from '../ContactProviderContext';

const fetchStack = new Set<string>();

const useContactConditionally = (contactID?: string) => {
    const cache = useContext(ContactProviderContext);
    const api = useApi();

    const miss = useCallback(async () => {
        if (!contactID || fetchStack.has(contactID)) {
            return;
        }

        fetchStack.add(contactID);

        const result = await api<{ Contact: Contact[] }>(getContact(contactID));
        return result.Contact;
    }, [contactID]);

    return useCachedModelResult(cache, contactID, miss);
};

export default useContactConditionally;
