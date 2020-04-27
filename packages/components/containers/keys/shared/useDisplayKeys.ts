import { useEffect, useMemo, useState } from 'react';
import { CachedKey, Address } from 'proton-shared/lib/interfaces';
import getParsedKeys from 'proton-shared/lib/keys/getParsedKeys';
import { getDisplayKey } from './getDisplayKey';

interface Props {
    keys: CachedKey[];
    User: any;
    Address?: Address;
    loadingKeyID?: string;
}
const useDisplayKeys = ({ keys, User, Address, loadingKeyID }: Props) => {
    const [parsedKeys, setParsedKeys] = useState<CachedKey[]>([]);

    useEffect(() => {
        (async () => {
            setParsedKeys(await getParsedKeys(keys));
        })();
    }, [keys]);

    return useMemo(() => {
        return parsedKeys.map(({ Key, privateKey }) => {
            const algorithmInfo = privateKey?.getAlgorithmInfo() ?? { algorithm: '' };
            const fingerprint = privateKey?.getFingerprint() ?? '';
            const isDecrypted = privateKey?.isDecrypted() ?? false;

            return getDisplayKey({
                User,
                Address,
                Key,
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore - openpgp typings are incorrect for getAlgorithmInfo, todo
                algorithmInfo,
                fingerprint,
                isLoading: loadingKeyID === Key.ID,
                isDecrypted
            });
        });
    }, [User, Address, parsedKeys, loadingKeyID]);
};

export default useDisplayKeys;
