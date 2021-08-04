import { useState, useRef, useEffect } from 'react';
import { c } from 'ttag';
import { HOUR } from '@proton/shared/lib/constants';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { Severity } from '@sentry/types';
import TopBanner from './TopBanner';

import useApiServerTime from '../../hooks/useApiServerTime';

const isOutOfSync = (serverTime: Date) => {
    const timeDifference = Math.abs(serverTime.getTime() - Date.now());
    // We should allow at least a 14-hour time difference,
    // because of potential internal clock issues when using dual-boot with Windows and a different OS
    return timeDifference > 24 * HOUR;
};

const TimeOutOfSyncTopBanner = () => {
    const [ignore, setIgnore] = useState(false);
    const serverTime: Date | undefined = useApiServerTime();

    // We warn the user if the server time is too far off from local time.
    // We do not want the server to set arbitrary times (either past or future), to avoid signature replay issues and more.
    const showWarning = !ignore && serverTime && isOutOfSync(serverTime);

    // Log warning to have an idea of how many clients might be affected
    const onceRef = useRef(false);
    useEffect(() => {
        if (!showWarning || onceRef.current) {
            return;
        }
        onceRef.current = true;
        captureMessage('Client time difference larger than 24 hours', {
            level: Severity.Info,
            extra: {
                serverTime: serverTime!.toString(),
                localTime: new Date().toString(),
            },
        });
    }, [showWarning]);

    if (!showWarning) {
        return null;
    }

    // TODO add 'Learn More' link once KB article is ready
    return (
        <TopBanner onClose={() => setIgnore(true)} className="bg-warning">
            {c('Warning').jt`Your local date & time settings seem to be out of sync.`}
        </TopBanner>
    );
};

export default TimeOutOfSyncTopBanner;
