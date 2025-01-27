import { useEffect, useMemo, useRef, useState } from 'react';

import type { AlgorithmInfo, PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import type { Address, DecryptedKey, Key, UserModel } from '@proton/shared/lib/interfaces';
import { ParsedSignedKeyList } from '@proton/shared/lib/keys';

import { getDisplayKey } from './getDisplayKey';

interface Props {
    keys: DecryptedKey[] | undefined;
    User: UserModel;
    Address?: Address;
    loadingKeyID?: string;
}

interface ParsedKey {
    Key: Key;
    privateKey?: PrivateKeyReference;
    fingerprint: string;
    algorithmInfos: AlgorithmInfo[];
    isDecrypted: boolean;
    isWeak: boolean;
    isE2EEForwardingKey: boolean;
    sha256Fingerprints: string[];
}

const useDisplayKeys = ({ keys: maybeKeys, User, Address, loadingKeyID }: Props) => {
    const [state, setState] = useState<ParsedKey[]>([]);
    const ref = useRef(0);

    useEffect(() => {
        if (!maybeKeys) {
            return;
        }
        const run = async () => {
            const Keys = Address ? Address.Keys : User.Keys;
            return Promise.all(
                Keys.map(async (Key): Promise<ParsedKey> => {
                    // A PrivateKeyReference is always a decrypted key (stored inside CryptoProxy).
                    // If we don't already have a key reference, then we need to import the armored key as a PublicKey since we do not know
                    // the passphrase to successfully import it as PrivateKey.
                    // Then we set `isDecrypted` to true for PrivateKeyReferences, false for PublicKeyReferences.
                    const maybePrivateKey: PublicKeyReference | PrivateKeyReference =
                        maybeKeys.find(({ ID }) => ID === Key.ID)?.privateKey ||
                        (await CryptoProxy.importPublicKey({ armoredKey: Key.PrivateKey }));
                    return {
                        Key,
                        fingerprint: maybePrivateKey.getFingerprint(),
                        algorithmInfos: [
                            maybePrivateKey.getAlgorithmInfo(),
                            ...maybePrivateKey.subkeys.map((key) => key.getAlgorithmInfo()),
                        ],
                        isDecrypted: maybePrivateKey.isPrivate(),
                        isWeak: maybePrivateKey.isWeak(),
                        isE2EEForwardingKey: await CryptoProxy.isE2EEForwardingKey({ key: maybePrivateKey }),
                        sha256Fingerprints: maybePrivateKey.getSHA256Fingerprints(),
                    };
                })
            );
        };
        const current = ++ref.current;
        run()
            .then((result) => {
                if (current === ref.current) {
                    setState(result);
                }
            })
            .catch(() => {
                if (current === ref.current) {
                    setState([]);
                }
            });
    }, [maybeKeys]);

    return useMemo(() => {
        const parsedSignedKeyList = new ParsedSignedKeyList(Address?.SignedKeyList?.Data);
        const signedKeyListMap = parsedSignedKeyList.mapAddressKeysToSKLItems(
            state.map(({ Key: { ID }, sha256Fingerprints }) => ({ ID, sha256Fingerprints }))
        );
        return state.map((data) => {
            return getDisplayKey({
                User,
                Address,
                isLoading: loadingKeyID === data.Key.ID,
                signedKeyListMap,
                ...data,
            });
        });
    }, [User, Address, state, loadingKeyID]);
};

export default useDisplayKeys;
