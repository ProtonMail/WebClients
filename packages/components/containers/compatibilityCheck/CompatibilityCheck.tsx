import { useEffect, useState } from 'react';
import * as React from 'react';
import { decryptData, encryptData, getKey } from '@proton/shared/lib/authentication/cryptoHelper';
import { useConfig } from '../../hooks';
import CompatibilityCheckView from './CompatibilityCheckView';
import { getCompatibilityList } from './compatibilityCheckHelper';

interface Props {
    children: React.ReactNode;
}

const CompatibilityCheck = ({ children }: Props) => {
    const { APP_NAME } = useConfig();
    const [incompatibilities, setIncompatibilities] = useState(() => {
        return getCompatibilityList().filter(({ valid }) => !valid);
    });

    useEffect(() => {
        const run = async () => {
            const key = await getKey(new Uint8Array(16));
            const data = await encryptData(key, new Uint8Array(16));
            return decryptData(key, data);
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
