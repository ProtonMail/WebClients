import { useEncryptedSearchContext } from 'proton-mail/containers/EncryptedSearchProvider';
import { isSearch } from 'proton-mail/helpers/elements';
import { params } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

const useIsEncryptedSearch = () => {
    const { search } = useMailSelector(params);
    const { esStatus } = useEncryptedSearchContext();
    return isSearch(search) && esStatus.esEnabled;
};

export default useIsEncryptedSearch;
