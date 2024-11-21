import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { detectStorageCapabilities } from '@proton/shared/lib/helpers/browser';

export const useIndexedDBSupport = () => {
    const [isSupported, setIsSupported] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkSupport = async () => {
            try {
                const { isAccessible, hasIndexedDB } = await detectStorageCapabilities();

                if (!hasIndexedDB) {
                    /* TODO: Standardize error messages for user once we have a troubleshooting guide https://protonag.atlassian.net/browse/MAILWEB-6054 */
                    setError(
                        c('Info')
                            .t`Storage capabilities are not supported in this browser, we need this support to enable message content search.`
                    );
                    setIsSupported(false);
                    return;
                }

                if (!isAccessible) {
                    setError(
                        c('Info')
                            .t`Unable to access storage capabilities in this browser, we need this access to enable message content search.`
                    );
                    setIsSupported(false);
                    return;
                }

                setIsSupported(true);
                setError(null);
            } catch (e) {
                setError(c('Info').t`We cannot enable message content search in this browser.`);
                setIsSupported(false);
            }
        };

        void checkSupport();
    }, []);

    return { isSupported, error };
};
