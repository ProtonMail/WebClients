import { c } from 'ttag';
import { KeyReactivationData } from '@proton/shared/lib/keys/reactivation/interface';
import { KeySalt } from '@proton/shared/lib/interfaces';
import { getHasMigratedAddressKey, decryptPrivateKeyWithSalt } from '@proton/shared/lib/keys';
import { KeyReactivationRequestStateData } from './interface';

interface KeyReactivationError {
    id: string;
    error: Error;
}

const getKey = async (
    { id, Key }: KeyReactivationRequestStateData,
    oldPassword: string,
    keySalts: KeySalt[]
): Promise<KeyReactivationData | KeyReactivationError> => {
    if (getHasMigratedAddressKey(Key)) {
        return {
            id,
            Key,
            // Force the type here. Migrated address keys are not reactivated by a password.
        } as KeyReactivationData;
    }
    try {
        const { KeySalt } = keySalts.find(({ ID: keySaltID }) => Key.ID === keySaltID) || {};

        const privateKey = await decryptPrivateKeyWithSalt({
            PrivateKey: Key.PrivateKey,
            keySalt: KeySalt,
            password: oldPassword,
        });

        return {
            id,
            Key,
            privateKey,
        };
    } catch (e: any) {
        return {
            id,
            Key,
            error: new Error(c('Error').t`Incorrect password`),
        };
    }
};

export const getReactivatedKeys = async (
    keysToReactivate: KeyReactivationRequestStateData[],
    oldPassword: string,
    keySalts: KeySalt[]
) => {
    const reactivatedKeys = await Promise.all(
        keysToReactivate.map(async (keyData) => {
            return getKey(keyData, oldPassword, keySalts);
        })
    );
    const errors = reactivatedKeys.filter((reactivatedKey): reactivatedKey is KeyReactivationError => {
        return 'error' in reactivatedKey;
    });
    const process = reactivatedKeys.filter((reactivatedKey): reactivatedKey is KeyReactivationData => {
        return !('error' in reactivatedKey);
    });
    return { process, errors };
};
