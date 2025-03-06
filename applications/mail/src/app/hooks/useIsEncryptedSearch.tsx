import { useLocation } from 'react-router-dom';

import type { SearchParameters } from '@proton/shared/lib/mail/search';

import { useEncryptedSearchContext } from 'proton-mail/containers/EncryptedSearchProvider';
import { isSearch } from 'proton-mail/helpers/elements';
import { extractSearchParameters } from 'proton-mail/helpers/mailboxUrl';
import { useDeepMemo } from 'proton-mail/hooks/useDeepMemo';

const useIsEncryptedSearch = () => {
    const location = useLocation();
    const { esStatus } = useEncryptedSearchContext();
    const search = useDeepMemo<SearchParameters>(() => extractSearchParameters(location), [location]);
    return isSearch(search) && esStatus.esEnabled;
};

export default useIsEncryptedSearch;
