import { useEffect } from 'react';

import { useRecoverySettingsTelemetry } from './recoverySettingsTelemetry';

const RecoveryPageTelemetry = () => {
    const { sendRecoveryPageLoad } = useRecoverySettingsTelemetry();

    useEffect(() => {
        sendRecoveryPageLoad();
    }, [sendRecoveryPageLoad]);

    return null;
};

export default RecoveryPageTelemetry;
