import { useEncryptedSearchContext } from 'proton-mail/containers/EncryptedSearchProvider';
import { isSearch } from 'proton-mail/helpers/elements';
import { paramsSelector } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

const useIsEncryptedSearch = () => {
    const { search } = useMailSelector(paramsSelector);
    const { esStatus } = useEncryptedSearchContext();
    return isSearch(search) && esStatus.esEnabled;
};

export default useIsEncryptedSearch;
