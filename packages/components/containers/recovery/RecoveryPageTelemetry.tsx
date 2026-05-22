import { useEffect, useRef } from 'react';

import { useRecoverySettingsTelemetry } from './recoverySettingsTelemetry';

const RecoveryPageTelemetry = () => {
    const { sendRecoveryPageLoad, loading } = useRecoverySettingsTelemetry();
    const hasSentPageLoadRef = useRef(false);

    useEffect(() => {
        if (loading || hasSentPageLoadRef.current) {
            return;
        }

        sendRecoveryPageLoad();
        hasSentPageLoadRef.current = true;
    }, [loading, sendRecoveryPageLoad]);

    return null;
};

export default RecoveryPageTelemetry;
