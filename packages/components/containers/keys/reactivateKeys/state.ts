import { getKeys, OpenPGPKey } from 'pmcrypto';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { getRandomString } from 'proton-shared/lib/helpers/string';
import {
    KeyReactivationRequestStateData,
    Status,
    KeyReactivationRequestState,
    KeyReactivationRequest,
} from './interface';

export const getInitialStates = async (initial: KeyReactivationRequest[]): Promise<KeyReactivationRequestState[]> => {
    if (initial.length === 0) {
        throw new Error('Keys to reactivate needed');
    }

    return Promise.all(
        initial.map(async (record) => {
            const keyStates = await Promise.all(
                record.keysToReactivate.map(
                    async (Key): Promise<KeyReactivationRequestStateData> => {
                        try {
                            const [key] = await getKeys(Key.PrivateKey);
                            return {
                                id: getRandomString(12),
                                Key,
                                key,
                                fingerprint: key.getFingerprint(),
                                status: Status.INACTIVE,
                                result: undefined,
                            };
                        } catch (e) {
                            return {
                                id: getRandomString(12),
                                Key,
                                fingerprint: '-',
                                status: Status.ERROR,
                                result: undefined,
                            };
                        }
                    }
                )
            );
            return {
                ...record,
                keysToReactivate: keyStates,
            };
        })
    );
};

export const updateKey = (
    oldStates: KeyReactivationRequestState[],
    id: string,
    newKeyState: Partial<KeyReactivationRequestStateData>
): KeyReactivationRequestState[] => {
    return oldStates.map((oldState) => {
        return {
            ...oldState,
            keysToReactivate: oldState.keysToReactivate.map((oldKeyState) => {
                if (oldKeyState.id !== id) {
                    return oldKeyState;
                }
                return {
                    ...oldKeyState,
                    ...newKeyState,
                };
            }),
        };
    });
};

export const getUploadedPrivateKeys = (oldStates: KeyReactivationRequestState[]) => {
    return oldStates
        .map((oldState) => {
            const uploadedPrivateKeys = oldState.keysToReactivate.filter(
                (keyData): keyData is KeyReactivationRequestStateData & { uploadedPrivateKey: OpenPGPKey } =>
                    !!keyData.uploadedPrivateKey
            );
            if (!uploadedPrivateKeys.length) {
                return;
            }
            return {
                ...oldState,
                keysToReactivate: uploadedPrivateKeys,
            };
        })
        .filter(isTruthy);
};
