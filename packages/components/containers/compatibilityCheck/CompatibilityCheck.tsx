import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import useConfig from '@proton/components/hooks/useConfig';
import { stringToUtf8Array } from '@proton/crypto/lib/utils';
import { decryptData, encryptData, getKey } from '@proton/shared/lib/authentication/cryptoHelper';

import CompatibilityCheckView from './CompatibilityCheckView';
import { getCompatibilityList } from './compatibilityCheckHelper';

interface Props {
    children: ReactNode;
}

const CompatibilityCheck = ({ children }: Props) => {
    const { APP_NAME } = useConfig();
    const [incompatibilities, setIncompatibilities] = useState(() => {
        return getCompatibilityList().filter(({ valid }) => !valid);
    });

    useEffect(() => {
        const run = async () => {
            const key = await getKey(new Uint8Array(16));
            const data = await encryptData(key, new Uint8Array(16), stringToUtf8Array('compatbility-check'));
            return decryptData(key, data, stringToUtf8Array('compatbility-check'));
        };
        run().catch(() => {
            setIncompatibilities([
                ...incompatibilities,
                {
                    name: 'WebCrypto',
                    valid: false,
                    text: 'Please update to a browser compatible with AES-GCM encryption.',
                },
            ]);
        });
    }, []);

    if (!incompatibilities.length) {
        return <>{children}</>;
    }

    return <CompatibilityCheckView appName={APP_NAME} incompatibilities={incompatibilities} />;
};

export default CompatibilityCheck;
