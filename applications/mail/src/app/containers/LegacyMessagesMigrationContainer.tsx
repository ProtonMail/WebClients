import { useEffect } from 'react';

import { useApi, useGetAddressKeys } from '@proton/components';
import { getApiWithAbort, getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { makeLegacyMessageIDsFetcher, migrateMultiple } from '@proton/shared/lib/mail/legacyMessagesMigration/helpers';
import noop from '@proton/utils/noop';

const LegacyMessagesMigrationContainer = () => {
    const api = useApi();
    const getAddressKeys = useGetAddressKeys();

    useEffect(() => {
        const abortController = new AbortController();
        const { signal } = abortController;
        // Since the migration happens in the background with the user unaware of it,
        // we silence API to avoid displaying possible errors in the UI
        const silentApiWithAbort = getApiWithAbort(getSilentApi(api), signal);

        const run = async () => {
            const it = makeLegacyMessageIDsFetcher(silentApiWithAbort);

            let result = await it.next();
            while (!result.done) {
                const messageIDs = result.value.map(({ ID }) => ID);
                await migrateMultiple({ messageIDs, api: silentApiWithAbort, getAddressKeys }).catch(noop);
                result = await it.next();
            }
        };
        void run();

        return () => {
            abortController.abort();
        };
    }, []);

    return null;
};

export default LegacyMessagesMigrationContainer;
