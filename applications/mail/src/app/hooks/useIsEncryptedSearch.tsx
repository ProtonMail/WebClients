import { useEncryptedSearchContext } from '../containers/EncryptedSearchProvider';
import { isSearch } from '../helpers/elements';
import { selectSearch } from '../store/elements/elementsSelectors';
import { useMailSelector } from '../store/hooks';

const useIsEncryptedSearch = () => {
    const search = useMailSelector(selectSearch);
    const { esStatus } = useEncryptedSearchContext();
    return isSearch(search) && esStatus.esEnabled;
};

export default useIsEncryptedSearch;
