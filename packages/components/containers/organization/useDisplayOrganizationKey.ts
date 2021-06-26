import { useEffect, useMemo, useState } from 'react';
import { OpenPGPKey, getKeys, algorithmInfo as tsAlgorithmInfo } from 'pmcrypto';
import { CachedOrganizationKey } from '@proton/shared/lib/interfaces';
import { getFormattedAlgorithmName } from '@proton/shared/lib/keys';

const useDisplayOrganizationKey = (organizationKey?: CachedOrganizationKey) => {
    const [parsedKey, setParsedKey] = useState<OpenPGPKey>();

    useEffect(() => {
        (async () => {
            if (!organizationKey) {
                setParsedKey(undefined);
                return;
            }
            if (organizationKey.privateKey) {
                setParsedKey(organizationKey.privateKey);
                return;
            }
            if (organizationKey.Key.PrivateKey) {
                const [key] = await getKeys(organizationKey.Key.PrivateKey).catch(() => []);
                setParsedKey(key);
                return;
            }
            setParsedKey(undefined);
        })();
    }, [organizationKey]);

    return useMemo(() => {
        const algorithmInfo = (parsedKey?.getAlgorithmInfo() as tsAlgorithmInfo) ?? { algorithm: '' };
        const fingerprint = parsedKey?.getFingerprint() ?? '';
        const isDecrypted = parsedKey?.isDecrypted() ?? false;
        return {
            algorithm: getFormattedAlgorithmName(algorithmInfo),
            fingerprint,
            isDecrypted,
        };
    }, [parsedKey]);
};

export default useDisplayOrganizationKey;
