import { ReactNode, useEffect, useState } from 'react';

import { APP_NAMES } from '@proton/shared/lib/constants';
import { KeyTransparencyState } from '@proton/shared/lib/interfaces';

import { KTContext } from './ktContext';
import useKTActivation from './useKTActivation';
import { KeyTransparencyContext } from './useKeyTransparencyContext';
import useRunSelfAudit from './useRunSelfAudit';
import useVerifyOutboundPublicKeys from './useVerifyOutboundPublicKeys';

interface Props {
    children: ReactNode;
    appName: APP_NAMES;
}

const KeyTransparencyManager = ({ children }: Props) => {
    const ktActivation = useKTActivation();

    const [ktState, setKTState] = useState<KeyTransparencyState>({
        selfAuditResult: undefined,
        seflAuditError: undefined,
    });

    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();

    const runSelfAudit = useRunSelfAudit(setKTState);

    useEffect(() => {
        runSelfAudit();
    }, []);

    const ktFunctions: KTContext = {
        ktState,
        ktActivation,
        verifyOutboundPublicKeys,
    };

    return <KeyTransparencyContext.Provider value={ktFunctions}>{children}</KeyTransparencyContext.Provider>;
};

export default KeyTransparencyManager;
