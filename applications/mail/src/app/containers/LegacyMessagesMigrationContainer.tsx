import { useEffect } from 'react';

import { useApi, useGetAddressKeys } from '@proton/components';
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
        const apiWithAbort: <T>(config: object) => Promise<T> = (config) => api({ ...config, signal, silence: true });

        const run = async () => {
            const it = makeLegacyMessageIDsFetcher(apiWithAbort);

            let result = await it.next();
            while (!result.done) {
                const messageIDs = result.value.map(({ ID }) => ID);
                await migrateMultiple({ messageIDs, api: apiWithAbort, getAddressKeys }).catch(noop);
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
