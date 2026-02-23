import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import useApiStatus from '@proton/components/hooks/useApiStatus';
import { serverTime } from '@proton/crypto';
import { ktSentryReportError } from '@proton/key-transparency/helpers';
import { SECOND } from '@proton/shared/lib/constants';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';

import useOnline from '../../hooks/useOnline';
import type { KTContext } from './ktContext';
import useKTActivation from './useKTActivation';
import useKTState from './useKTState';
import { KeyTransparencyContext } from './useKeyTransparencyContext';
import useRunSelfAudit from './useRunSelfAudit';

interface Props {
    children: ReactNode;
}

const KeyTransparencyManager = ({ children }: Props) => {
    const ktActivation = useKTActivation();

    const [ktStateLoaded, ktState, setKTState] = useKTState();

    const [selfAuditPending, setSelfAuditPending] = useState(false);

    const runSelfAudit = useRunSelfAudit();

    const { offline } = useApiStatus();
    const onlineStatus = useOnline();
    const safeIsOnline = onlineStatus && !offline;

    useEffect(() => {
        const run = async () => {
            try {
                const { selfAuditResult } = await runSelfAudit(ktState.selfAuditResult);
                setKTState({ selfAuditResult });
            } catch (error) {
                ktSentryReportError(error, { context: 'runSelfAuditPeriodically' });
            }
        };
        if (selfAuditPending && ktActivation !== KeyTransparencyActivation.DISABLED && safeIsOnline) {
            setSelfAuditPending(false);
            void run();
        }
    }, [selfAuditPending, ktActivation, safeIsOnline]);

    useEffect(() => {
        if (!ktStateLoaded) {
            return;
        }
        // Determine when the next self-audit should happen.
        const pendingDelay = 10 * SECOND;
        const now = +serverTime();
        // If the self-audit result does not exist or the nextAuditTime has passed
        // run the self-audit after pendingDelay else run it at nextAuditTime.
        const delay =
            ktState.selfAuditResult && ktState.selfAuditResult.nextAuditTime > now
                ? ktState.selfAuditResult.nextAuditTime - now
                : pendingDelay;
        const timeoutID = setTimeout(() => setSelfAuditPending(true), delay);
        return () => clearTimeout(timeoutID);
    }, [ktStateLoaded, ktState]);

    const ktFunctions: KTContext = {
        ktState,
        ktActivation,
    };

    return <KeyTransparencyContext.Provider value={ktFunctions}>{children}</KeyTransparencyContext.Provider>;
};

export default KeyTransparencyManager;
