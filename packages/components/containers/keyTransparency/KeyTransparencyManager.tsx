import { ReactNode, useEffect, useState } from 'react';

import useApiStatus from '@proton/components/hooks/useApiStatus';
import { ktSentryReportError } from '@proton/key-transparency/lib';
import { APP_NAMES, SECOND } from '@proton/shared/lib/constants';
import { KeyTransparencyActivation, KeyTransparencyState } from '@proton/shared/lib/interfaces';

import { useOnline } from '../../hooks';
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
    });

    const [selfAuditPending, setSelfAuditPending] = useState(false);

    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();

    const runSelfAudit = useRunSelfAudit();

    const { offline } = useApiStatus();
    const onlineStatus = useOnline();
    const safeIsOnline = onlineStatus && !offline;

    useEffect(() => {
        const run = async () => {
            try {
                const { selfAuditResult } = await runSelfAudit();
                setKTState({ selfAuditResult });
            } catch (error) {
                ktSentryReportError(error, { context: 'runSelfAuditPeriodically' });
            }
        };
        if (selfAuditPending && ktActivation !== KeyTransparencyActivation.DISABLED && safeIsOnline) {
            setSelfAuditPending(false);
            run();
        }
    }, [selfAuditPending, ktActivation, safeIsOnline]);

    useEffect(() => {
        const startDelay = 10 * SECOND;
        const delay = ktState?.selfAuditResult
            ? ktState.selfAuditResult.nextAuditTime - ktState.selfAuditResult.auditTime
            : startDelay;
        const timeoutID = setTimeout(() => setSelfAuditPending(true), delay);
        return () => clearTimeout(timeoutID);
    }, [ktState]);

    const ktFunctions: KTContext = {
        ktState,
        ktActivation,
        verifyOutboundPublicKeys,
    };

    return <KeyTransparencyContext.Provider value={ktFunctions}>{children}</KeyTransparencyContext.Provider>;
};

export default KeyTransparencyManager;
