import { useEffect, useState } from 'react';

import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import { INDEXING_STATUS, defaultESStatus } from './constants';
import { getIndexKey } from './esHelpers';
import {
    checkVersionedESDB,
    contentIndexingProgress,
    metadataIndexingProgress,
    readEnabled,
    readLimited,
} from './esIDB';
import type { ESCache, ESStatus } from './models';

/**
 * @returns a tuple composed of both the _esStatus_ and a setter for it
 */
export const useEncryptedSearchStatus = <ESItemMetadata extends Object, ESSearchParameters, ESItemContent = void>({
    esCacheRef,
    getUserKeys,
    userID,
}: {
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>;
    getUserKeys: () => Promise<DecryptedKey[]>;
    userID: string;
}): [
    ESStatus<ESItemMetadata, ESItemContent, ESSearchParameters>,
    React.Dispatch<React.SetStateAction<ESStatus<ESItemMetadata, ESItemContent, ESSearchParameters>>>,
] => {
    const [esStatus, setESStatus] =
        useState<ESStatus<ESItemMetadata, ESItemContent, ESSearchParameters>>(defaultESStatus);

    useEffect(() => {
        const initEsStatus = async () => {
            try {
                const esdbExists = await checkVersionedESDB(userID);

                if (esdbExists) {
                    const userKeys = await getUserKeys();
                    const indexKey = await getIndexKey(userKeys, userID);
                    const esEnabled = await readEnabled(userID);
                    const isDBLimited = await readLimited(userID);
                    const metadataIndexingProgressState = await metadataIndexingProgress.read(userID);
                    const contentIndexingProgressState = await contentIndexingProgress.read(userID);

                    setESStatus((esStatus) => ({
                        ...esStatus,
                        cachedIndexKey: indexKey,
                        esEnabled: esEnabled ?? false,
                        isDBLimited: isDBLimited ?? false,
                        isMetadataIndexingPaused: metadataIndexingProgressState?.status === INDEXING_STATUS.PAUSED,
                        isContentIndexingPaused: contentIndexingProgressState?.status === INDEXING_STATUS.PAUSED,
                    }));
                }
            } catch (error) {
                console.warn('an error occurred on init es status', error);
            }

            /**
             * We need to set those variables whether we have already existing esdb or not
             */
            setESStatus((esStatus) => ({
                ...esStatus,
                isConfigFromESDBLoaded: true,
                getCacheStatus: () => ({
                    isCacheReady: esCacheRef.current.isCacheReady,
                    isCacheLimited: esCacheRef.current.isCacheLimited,
                }),
            }));
        };

        void initEsStatus();
    }, []);

    return [esStatus, setESStatus];
};
