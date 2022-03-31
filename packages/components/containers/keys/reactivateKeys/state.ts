import { CryptoProxy } from '@proton/crypto';
import getRandomString from "@proton/utils/getRandomString";
import { KeyReactivationRequestStateData, KeyReactivationRequestState, KeyReactivationRequest } from './interface';

export const getInitialStates = async (initial: KeyReactivationRequest[]): Promise<KeyReactivationRequestState[]> => {
    if (initial.length === 0) {
        throw new Error('Keys to reactivate needed');
    }

    return Promise.all(
        initial.map(async (record) => {
            const keyStates = await Promise.all(
                record.keysToReactivate.map(async (Key): Promise<KeyReactivationRequestStateData> => {
                    try {
                        const { fingerprint } = await CryptoProxy.getKeyInfo({ armoredKey: Key.PrivateKey });
                        return {
                            id: getRandomString(12),
                            Key,
                            fingerprint,
                            result: undefined,
                        };
                    } catch (e: any) {
                        return {
                            id: getRandomString(12),
                            Key,
                            fingerprint: '-',
                            result: undefined,
                        };
                    }
                })
            );
            return {
                ...record,
                keysToReactivate: keyStates,
            };
        })
    );
};
