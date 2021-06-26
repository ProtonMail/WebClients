import { useMemo } from 'react';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts/Contact';

import useContactEmails from './useContactEmails';

const compareContactEmailByName = (a: ContactEmail, b: ContactEmail) => {
    return a.Name.localeCompare(b.Name);
};

const useContactEmailsSortedByName = () => {
    const [contactEmails, loading] = useContactEmails();
    return useMemo(() => {
        return [[...(contactEmails || [])].sort(compareContactEmailByName), loading] as const;
    }, [contactEmails]);
};

export default useContactEmailsSortedByName;
