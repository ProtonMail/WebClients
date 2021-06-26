import { useEffect, useMemo, useRef, useState } from 'react';
import { algorithmInfo, getKeys, OpenPGPKey } from 'pmcrypto';
import { Address, DecryptedKey, UserModel, Key } from 'proton-shared/lib/interfaces';
import { getParsedSignedKeyList, getSignedKeyListMap } from 'proton-shared/lib/keys';
import { getDisplayKey } from './getDisplayKey';

interface Props {
    keys: DecryptedKey[] | undefined;
    User: UserModel;
    Address?: Address;
    loadingKeyID?: string;
}

interface ParsedKey {
    Key: Key;
    privateKey?: OpenPGPKey;
    fingerprint: string;
    algorithmInfo: algorithmInfo;
    isDecrypted: boolean;
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
                Keys.map(async (Key) => {
                    const privateKey =
                        maybeKeys.find(({ ID }) => ID === Key.ID)?.privateKey ||
                        (await getKeys(Key.PrivateKey).then(([r]) => r));
                    return {
                        Key,
                        fingerprint: privateKey?.getFingerprint() || '',
                        algorithmInfo: (privateKey?.getAlgorithmInfo() as algorithmInfo) || { algorithm: '' },
                        isDecrypted: privateKey?.isDecrypted() || false,
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
        const signedKeyListMap = getSignedKeyListMap(getParsedSignedKeyList(Address?.SignedKeyList?.Data));
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
