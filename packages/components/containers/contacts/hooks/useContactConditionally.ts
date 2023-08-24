import { useCallback, useContext } from 'react';

import { getContact } from '@proton/shared/lib/api/contacts';
import { Contact } from '@proton/shared/lib/interfaces/contacts/Contact';

import { useApi, useCachedModelResult } from '../../../hooks';
import ContactProviderContext from '../ContactProviderContext';

const useContactConditionally = (contactID?: string) => {
    const cache = useContext(ContactProviderContext);
    const api = useApi();

    const miss = useCallback(async () => {
        if (!contactID) {
            return;
        }

        const { Contact } = await api<{ Contact: Contact[] }>(getContact(contactID));
        return Contact;
    }, [contactID]);

    return useCachedModelResult(cache, contactID, miss);
};

export default useContactConditionally;
