import { c } from 'ttag';

import isSearchFeatureEnabled from '../../utils/isSearchFeatureEnabled';
import { useSearchLibrary } from '../_search';

export default function useSearchControl() {
    const searchEnabled = isSearchFeatureEnabled();
    const { cacheIndexedDB, esStatus, enableEncryptedSearch, esDelete } = useSearchLibrary();
    const { dbExists, isEnablingEncryptedSearch, esSupported } = esStatus;

    /**
     * prepareSearchData starts initial sync to create db.
     */
    const prepareSearchData = async () => {
        if (!esSupported || isEnablingEncryptedSearch) {
            return;
        }

        if (dbExists) {
            return cacheIndexedDB();
        }

        await enableEncryptedSearch();
    };

    const deleteData = () => esDelete();

    const isDisabled = !esSupported || isEnablingEncryptedSearch;
    let disabledReason;
    if (isDisabled) {
        disabledReason = isEnablingEncryptedSearch
            ? c('Info').t`Indexing search results…`
            : c('Info').t`Search cannot be enabled in this browser`;
    }

    return {
        searchEnabled,
        isEnablingEncryptedSearch,
        isDisabled,
        disabledReason,
        hasData: dbExists,
        prepareSearchData,
        deleteData,
    };
}
