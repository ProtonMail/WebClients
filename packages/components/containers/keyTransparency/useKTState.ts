import { useEffect, useRef, useState } from 'react';

import { getAuditResult, getKTLocalStorage, storeAuditResult } from '@proton/key-transparency/lib';
import type { KeyTransparencyState } from '@proton/shared/lib/interfaces';
import { getPrimaryKey } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { useConfig, useGetUserKeys, useUser } from '../../hooks';

const useKTState = (): [boolean, KeyTransparencyState, React.Dispatch<React.SetStateAction<KeyTransparencyState>>] => {
    const [ktState, setKTState] = useState<KeyTransparencyState>({
        selfAuditResult: undefined,
    });
    const [loaded, setLoaded] = useState(false);
    const firstUpdate = useRef(true);

    const [{ ID: userID }] = useUser();
    const { APP_NAME: appName } = useConfig();
    const getUserKeys = useGetUserKeys();

    useEffect(() => {
        const loadState = async () => {
            // Loads the kt state from local storage and decrypts it with the user keys.
            const userKeys = await getUserKeys();
            const userPrivateKeys = userKeys.map(({ privateKey }) => privateKey);
            const ktLSAPIPromise = getKTLocalStorage(appName);
            const ktLSAPI = await ktLSAPIPromise;
            const selfAuditResult = await getAuditResult(userID, userPrivateKeys, ktLSAPI);
            if (selfAuditResult) {
                setKTState({ selfAuditResult });
            }
        };
        void loadState()
            .catch(noop)
            .finally(() => setLoaded(true));
    }, []);

    useEffect(() => {
        const storeState = async () => {
            if (!ktState.selfAuditResult) {
                return;
            }
            // Encrypts the kt state with the primary user key and stores it in local storage.
            const userKeys = await getUserKeys();
            const ktLSAPIPromise = getKTLocalStorage(appName);
            const ktLSAPI = await ktLSAPIPromise;
            const { publicKey: userPrimaryPublicKey } = getPrimaryKey(userKeys) || {};
            if (userPrimaryPublicKey) {
                await storeAuditResult(userID, ktState.selfAuditResult, userPrimaryPublicKey, ktLSAPI);
            }
        };
        if (loaded) {
            if (firstUpdate.current) {
                // Skip the first loaded state update since it is already stored.
                firstUpdate.current = false;
            } else {
                // A kt state update happened, store it in local storage.
                void storeState().catch(noop);
            }
        }
    }, [loaded, ktState]);

    return [loaded, ktState, setKTState];
};

export default useKTState;
