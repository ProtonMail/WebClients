import { getKeys } from 'pmcrypto';
import { getRandomString } from '@proton/shared/lib/helpers/string';
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
                        const [key] = await getKeys(Key.PrivateKey);
                        return {
                            id: getRandomString(12),
                            Key,
                            key,
                            fingerprint: key.getFingerprint(),
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
