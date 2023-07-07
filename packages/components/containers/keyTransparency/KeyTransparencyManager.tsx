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

const SELF_AUDIT_MAX_TRIALS = 5;

const KeyTransparencyManager = ({ children }: Props) => {
    const ktActivation = useKTActivation();

    const [ktState, setKTState] = useState<KeyTransparencyState>({
        selfAuditResult: undefined,
        selfAuditError: undefined,
    });

    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();

    const runSelfAudit = useRunSelfAudit();

    const { offline } = useApiStatus();
    const onlineStatus = useOnline();

    const runSelfAuditPeriodically = () => {
        if (ktActivation !== KeyTransparencyActivation.DISABLED && onlineStatus && !offline) {
            runSelfAudit()
                .then(({ selfAuditResult, nextSelfAuditInterval }) => {
                    setKTState({ selfAuditResult });
                    setTimeout(runSelfAuditPeriodically, nextSelfAuditInterval);
                })
                .catch((error) => {
                    ktSentryReportError(error, { context: 'runSelfAuditPeriodically' });
                    const failedTrials = (ktState.selfAuditError?.failedTrials ?? 0) + 1;
                    if (failedTrials >= SELF_AUDIT_MAX_TRIALS) {
                        setKTState({ selfAuditError: { error, failedTrials, tooManyRetries: true } });
                    } else {
                        setKTState({ selfAuditError: { error, failedTrials, tooManyRetries: false } });
                        const exponentialBackOff = Math.pow(10, failedTrials) * SECOND;
                        setTimeout(runSelfAuditPeriodically, exponentialBackOff);
                    }
                });
        }
    };

    useEffect(() => {
        runSelfAuditPeriodically();
    }, [ktActivation, offline, onlineStatus]);

    const ktFunctions: KTContext = {
        ktState,
        ktActivation,
        verifyOutboundPublicKeys,
    };

    return <KeyTransparencyContext.Provider value={ktFunctions}>{children}</KeyTransparencyContext.Provider>;
};

export default KeyTransparencyManager;
