import { useApi, useGetAddressKeys } from '@proton/components';
import { migrateAll } from '@proton/shared/lib/mail/legacyMessagesMigration/helpers';
import { useEffect } from 'react';

const LegacyMessagesMigrationContainer = () => {
    const api = useApi();
    const getAddressKeys = useGetAddressKeys();

    useEffect(() => {
        const abortController = new AbortController();
        const { signal } = abortController;
        const apiWithAbort: <T>(config: object) => Promise<T> = (config) => api({ ...config, signal });

        migrateAll({ api: apiWithAbort, getAddressKeys });

        return () => {
            abortController.abort();
        };
    }, []);

    return null;
};

export default LegacyMessagesMigrationContainer;
