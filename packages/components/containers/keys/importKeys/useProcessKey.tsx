import { useRef, useState } from 'react';

import { c } from 'ttag';

import { useGetUserSettings } from '@proton/account/userSettings/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import DecryptFileKeyModal from '@proton/components/containers/keys/shared/DecryptFileKeyModal';
import useNotifications from '@proton/components/hooks/useNotifications';
import { CryptoProxy, KeyCompatibilityLevel, type PrivateKeyReference } from '@proton/crypto';
import type { ArmoredKeyWithInfo } from '@proton/shared/lib/keys';

const process = async (armoredKeyWithInfo: ArmoredKeyWithInfo, supportPgpV6Keys: boolean) => {
    if (armoredKeyWithInfo.keyIsDecrypted) {
        try {
            const privateKey = await CryptoProxy.importPrivateKey({
                armoredKey: armoredKeyWithInfo.armoredKey,
                passphrase: null,
                // the BE will enforce this as well, but the returned error messages might be less user friendly
                checkCompatibility: supportPgpV6Keys
                    ? KeyCompatibilityLevel.V6_COMPATIBLE
                    : KeyCompatibilityLevel.BACKWARDS_COMPATIBLE,
            });

            return {
                type: 'add',
                payload: {
                    armoredKeyWithInfo,
                    privateKey,
                },
            } as const;
        } catch (e: any) {
            return {
                type: 'error',
                payload: e?.message || '',
            } as const;
        }
    }

    return {
        type: 'decrypt',
        payload: {
            armoredKeyWithInfo,
        },
    } as const;
};

export interface ProcessedKey {
    armoredKeyWithInfo: ArmoredKeyWithInfo;
    privateKey: PrivateKeyReference;
}

export const useProcessKey = ({ onProcessed }: { onProcessed: (data: ProcessedKey[]) => void }) => {
    const { createNotification } = useNotifications();
    const [modal, setModal, renderModal] = useModalState();
    const [keyToDecrypt, setKeyToDecrypt] = useState<ArmoredKeyWithInfo | null>(null);
    const stateRef = useRef<{
        processedKeys: ProcessedKey[];
        keysToDecrypt: ArmoredKeyWithInfo[];
    }>({ keysToDecrypt: [], processedKeys: [] });
    const getUserSettings = useGetUserSettings();

    const iterate = async () => {
        const { keysToDecrypt, processedKeys } = stateRef.current;
        if (keysToDecrypt.length === 0) {
            if (processedKeys.length > 0) {
                void onProcessed(processedKeys);
            }
            return;
        }
        const [first, ...rest] = keysToDecrypt;
        stateRef.current.keysToDecrypt = rest;
        setKeyToDecrypt(first);
        setModal(true);
    };

    const handleUploadKeys = async (keys: ArmoredKeyWithInfo[]) => {
        const privateKeyInfos = keys.filter(({ keyIsPrivate }) => keyIsPrivate);
        if (privateKeyInfos.length === 0) {
            return createNotification({
                type: 'error',
                text: c('Error').t`Invalid private key file`,
            });
        }
        const userSettings = await getUserSettings();
        const supportPgpV6Keys = Boolean(userSettings.Flags.SupportPgpV6Keys);
        const processedKeys = await Promise.all(privateKeyInfos.map((key) => process(key, supportPgpV6Keys)));
        const result: typeof stateRef.current = { keysToDecrypt: [], processedKeys: [] };
        for (const processedKey of processedKeys) {
            if (processedKey.type === 'error' && processedKey.payload) {
                createNotification({ type: 'error', text: processedKey.payload });
            } else if (processedKey.type === 'add') {
                result.processedKeys.push(processedKey.payload);
            } else if (processedKey.type === 'decrypt') {
                result.keysToDecrypt.push(processedKey.payload.armoredKeyWithInfo);
            }
        }
        stateRef.current = result;
        void iterate();
    };

    return {
        handleUploadKeys,
        component: (
            <>
                {renderModal && keyToDecrypt && (
                    <DecryptFileKeyModal
                        key={keyToDecrypt.fingerprint}
                        privateKeyInfo={keyToDecrypt}
                        onSuccess={(privateKey) => {
                            stateRef.current.processedKeys = [
                                ...stateRef.current.processedKeys,
                                { privateKey, armoredKeyWithInfo: keyToDecrypt },
                            ];
                        }}
                        {...modal}
                        onExit={() => {
                            setKeyToDecrypt(null);
                            modal.onExit();
                            void iterate();
                        }}
                    />
                )}
            </>
        ),
    };
};
