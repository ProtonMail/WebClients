import { c } from 'ttag';

import { useSearchEnabledFeature, useSearchLibrary } from '../_search';

export default function useSearchControl() {
    const searchEnabled = useSearchEnabledFeature();
    const { getESDBStatus, enableEncryptedSearch, esDelete } = useSearchLibrary();
    const { dbExists, isEnablingEncryptedSearch, esSupported } = getESDBStatus();

    /**
     * prepareSearchData starts initial sync to create db.
     */
    const prepareSearchData = async () => {
        if (!esSupported || dbExists || isEnablingEncryptedSearch) {
            return;
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
