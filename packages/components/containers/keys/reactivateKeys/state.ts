import { getKeys } from 'pmcrypto';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { KeyReactivation, ReactivateKey, ReactivateKeys, Status } from './interface';

export const getInitialState = async (keys: KeyReactivation[]): Promise<ReactivateKeys[]> => {
    if (keys.length === 0) {
        throw new Error('Keys to reactivate needed');
    }

    return Promise.all(
        keys.map(async ({ User, Address, keys }) => {
            const parsedKeys = await Promise.all(
                keys.map(({ Key: { PrivateKey } }) => {
                    return getKeys(PrivateKey).catch(() => []);
                })
            );

            return {
                User,
                Address,
                keys: parsedKeys.map(([privateKey], i) => {
                    return {
                        ID: keys[i].Key.ID,
                        PrivateKey: keys[i].Key.PrivateKey,
                        fingerprint: privateKey?.getFingerprint(),
                        status: privateKey ? Status.INACTIVE : Status.ERROR,
                        result: undefined,
                    };
                }),
            };
        })
    );
};

export const updateKey = (oldAllKeys: ReactivateKeys[], key: ReactivateKey, newKey: Partial<ReactivateKey>) => {
    return oldAllKeys.map((toReactivate) => {
        const { keys: oldInactiveKeys } = toReactivate;

        if (!oldInactiveKeys.some((oldKey) => oldKey === key)) {
            return toReactivate;
        }

        return {
            ...toReactivate,
            keys: oldInactiveKeys.map((oldKey) => {
                if (oldKey !== key) {
                    return oldKey;
                }
                return {
                    ...oldKey,
                    ...newKey,
                };
            }),
        };
    });
};

export const getUploadedKeys = (keys: ReactivateKeys[]): ReactivateKeys[] => {
    return keys
        .map((toReactivate) => {
            const { keys } = toReactivate;
            const uploadedKeys = keys.filter(({ uploadedPrivateKey }) => !!uploadedPrivateKey);
            if (!uploadedKeys.length) {
                return;
            }
            return {
                ...toReactivate,
                keys: uploadedKeys,
            };
        })
        .filter(isTruthy);
};
