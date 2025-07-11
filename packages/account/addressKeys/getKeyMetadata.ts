import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { type AlgorithmInfo, CryptoProxy, type PrivateKeyReference, type PublicKeyReference } from '@proton/crypto';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import {
    type Address,
    type AddressKey,
    type DecryptedAddressKey,
    type DecryptedKey,
    type Key,
    type SignedKeyListItem,
    type SimpleMap,
    type UserModel,
} from '@proton/shared/lib/interfaces';
import { ParsedSignedKeyList, getDecryptedOrganizationKey, splitKeys } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';
import unique from '@proton/utils/unique';

import { type AddressKeysState } from '../addressKeys';
import type { KtState } from '../kt';
import { userThunk } from '../user';
import { userKeysThunk } from '../userKeys';
import { type InvalidKeyError, getAddressKeyInvalidError, getInactiveKeyDecryptedError } from './getInvalidKeyError';

export interface KeyMetadata<KeyType> {
    Key: KeyType;
    privateKey?: PrivateKeyReference;
    fingerprint: string;
    creationDate: Date;
    version: number;
    algorithmInfos: AlgorithmInfo[];
    isDecrypted: boolean;
    isWeak: boolean;
    isE2EEForwardingKey: boolean;
    sha256Fingerprints: string[];
    invalidKeyError: InvalidKeyError | undefined;
}

const getPublicKey = (key: Key): Promise<PublicKeyReference> => {
    return CryptoProxy.importPublicKey({ armoredKey: key.PrivateKey });
};

const getKeyMetadata = async <
    KeyType extends AddressKey | Key,
    DecryptedKeyType extends DecryptedKey | DecryptedAddressKey = KeyType extends AddressKey
        ? DecryptedAddressKey
        : DecryptedKey,
>(
    Key: KeyType,
    keys: DecryptedKeyType[]
): Promise<KeyMetadata<KeyType>> => {
    // A PrivateKeyReference is always a decrypted key (stored inside CryptoProxy).
    // If we don't already have a key reference, then we need to import the armored key as a PublicKey since we do not know
    // the passphrase to successfully import it as PrivateKey.
    // Then we set `isDecrypted` to true for PrivateKeyReferences, false for PublicKeyReferences.
    const maybePrivateKey = keys.find(({ ID }) => ID === Key.ID)?.privateKey || (await getPublicKey(Key));

    return {
        Key,
        version: maybePrivateKey.getVersion(),
        fingerprint: maybePrivateKey.getFingerprint(),
        creationDate: maybePrivateKey.getCreationTime(),
        algorithmInfos: [
            maybePrivateKey.getAlgorithmInfo(),
            ...maybePrivateKey.subkeys.map((key) => key.getAlgorithmInfo()),
        ],
        isDecrypted: maybePrivateKey.isPrivate(),
        isWeak: maybePrivateKey.isWeak(),
        isE2EEForwardingKey: await CryptoProxy.isE2EEForwardingKey({ key: maybePrivateKey }),
        sha256Fingerprints: maybePrivateKey.getSHA256Fingerprints(),
        invalidKeyError: undefined,
    };
};

export interface AddressKeysMetadataResult {
    addressKeyMetadataList: KeyMetadata<AddressKey>[];
    signedKeyListMap: SimpleMap<SignedKeyListItem | undefined>;
    existsPrimaryKeyV6: boolean;
    existingAlgorithms: AlgorithmInfo[];
}

export const getAddressKeysMetadata = ({
    address,
    addressKeys,
}: {
    address: Address;
    addressKeys: DecryptedAddressKey[];
}): ThunkAction<
    Promise<AddressKeysMetadataResult>,
    AddressKeysState & KtState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const addressKeyMetadataList = await Promise.all(address.Keys.map((Key) => getKeyMetadata(Key, addressKeys)));

        const inactiveAddressKeyList = addressKeyMetadataList.filter(
            (key) =>
                /**
                 * For keys that are not able to decrypt, but the API say are active - collect key error information
                 */
                !key.isDecrypted && key.Key.Active
        );
        const inactiveAddressKeyErrorsMap = await (async () => {
            if (!inactiveAddressKeyList.length) {
                return {};
            }
            const user = await dispatch(userThunk());
            const userKeys = await dispatch(userKeysThunk());
            const keyPassword = extra.authentication.getPassword();
            const organizationKey = user.OrganizationPrivateKey
                ? await getDecryptedOrganizationKey(user.OrganizationPrivateKey, keyPassword).catch(noop)
                : undefined;
            const userKeysPair = splitKeys(userKeys);

            const errors = await Promise.all(
                inactiveAddressKeyList.map(async ({ Key }) => {
                    const result = await getAddressKeyInvalidError({
                        addressKey: Key,
                        userKeysPair,
                        organizationKey,
                        keyPassword,
                    });
                    return {
                        result,
                        Key,
                    };
                })
            );
            return errors.reduce<{ [key: string]: InvalidKeyError | undefined }>((acc, { Key, result }) => {
                acc[Key.ID] = result;
                return acc;
            }, {});
        })();

        const activeAddressKeyErrorsMap = addressKeyMetadataList
            .filter(
                (key) =>
                    /**
                     * Keys that are able to decrypt, but the API say are inactive
                     */
                    key.isDecrypted && !key.Key.Active
            )
            .reduce<{ [key: string]: InvalidKeyError | undefined }>((acc, value) => {
                acc[value.Key.ID] = getInactiveKeyDecryptedError();
                return acc;
            }, {});

        const parsedSignedKeyList = new ParsedSignedKeyList(address.SignedKeyList?.Data);
        const signedKeyListMap = parsedSignedKeyList.mapAddressKeysToSKLItems(
            addressKeyMetadataList.map(({ Key: { ID }, sha256Fingerprints }) => ({ ID, sha256Fingerprints }))
        );

        const existsPrimaryKeyV6 = !!addressKeyMetadataList.find(
            ({ Key: { ID }, version }) => version === 6 && signedKeyListMap[ID]?.Primary === 1
        );

        const existingAlgorithms = unique(
            addressKeyMetadataList.reduce<AlgorithmInfo[]>((acc, { algorithmInfos }) => acc.concat(algorithmInfos), [])
        );

        return {
            addressKeyMetadataList: addressKeyMetadataList.map(
                (result): KeyMetadata<AddressKey> => ({
                    ...result,
                    invalidKeyError:
                        inactiveAddressKeyErrorsMap[result.Key.ID] || activeAddressKeyErrorsMap[result.Key.ID],
                })
            ),
            existingAlgorithms,
            signedKeyListMap,
            existsPrimaryKeyV6,
        };
    };
};

export interface UserKeysMetadataResult {
    userKeyMetadataList: KeyMetadata<Key>[];
    existingAlgorithms: AlgorithmInfo[];
}

export const getUserKeysMetadata = ({
    user,
    userKeys,
}: {
    user: UserModel;
    userKeys: DecryptedKey[];
}): ThunkAction<Promise<UserKeysMetadataResult>, AddressKeysState & KtState, ProtonThunkArguments, UnknownAction> => {
    return async () => {
        const userKeyMetadataList = await Promise.all(
            user.Keys.map((Key) => {
                return getKeyMetadata(Key, userKeys);
            })
        );

        const existingAlgorithms = unique(
            userKeyMetadataList.reduce<AlgorithmInfo[]>((acc, { algorithmInfos }) => acc.concat(algorithmInfos), [])
        );

        return {
            userKeyMetadataList,
            existingAlgorithms,
        };
    };
};
