import { c } from 'ttag';

import { useSearchEnabledFeature, useSearchLibrary } from '../_search';

export default function useSearchControl() {
    const searchEnabled = useSearchEnabledFeature();
    const { cacheIndexedDB, getESDBStatus, resumeIndexing, esDelete } = useSearchLibrary();
    const { dbExists, isBuilding, esSupported } = getESDBStatus();

    /**
     * prepareSearchData loads data from db to memory if db exists, otherwise
     * it starts initial sync to create db.
     */
    const prepareSearchData = async () => {
        if (!esSupported) {
            return;
        }

        if (dbExists) {
            await cacheIndexedDB();
            return;
        }

        if (isBuilding) {
            return;
        }

        await resumeIndexing();
    };

    const deleteData = () => esDelete();

    const isDisabled = !esSupported || isBuilding;
    let disabledReason;
    if (isDisabled) {
        disabledReason = isBuilding
            ? c('Info').t`Indexing search results…`
            : c('Info').t`Search cannot be enabled in this browser`;
    }

    return {
        searchEnabled,
        isBuilding,
        isDisabled,
        disabledReason,
        hasData: dbExists,
        prepareSearchData,
        deleteData,
    };
}
