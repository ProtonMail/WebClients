import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import useApi from '@proton/components/hooks/useApi';
import { ping } from '@proton/shared/lib/api/tests';
import { HOUR, SECOND } from '@proton/shared/lib/constants';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import useApiServerTime from '../../hooks/useApiServerTime';
import TopBanner from './TopBanner';

const isOutOfSync = (serverTime: Date, localTime: Date) => {
    const timeDifference = Math.abs(serverTime.getTime() - localTime.getTime());
    // We should allow at least a 14-hour time difference,
    // because of potential internal clock issues when using dual-boot with Windows and a different OS
    return timeDifference > 24 * HOUR;
};

/**
 * The serverTime update might be stale if e.g. the device has been asleep/idle, and it's processing the update after a delay.
 */
const isStaleServerTimeUpdate = (previousUpdateLocalTime: Date, localTime: Date) => {
    const timeDifference = Math.abs(previousUpdateLocalTime.getTime() - localTime.getTime());
    // The event loop runs every 30s, so we expect the server time to be updated at least with that frequency
    // (with a margin of a few seconds)
    return timeDifference > 35 * SECOND;
};

const TimeOutOfSyncTopBanner = () => {
    const [ignore, setIgnore] = useState(false);
    const previousUpdateLocalTime = useRef(new Date());

    const api = useApi();
    const serverTime = useApiServerTime();
    const currentUpdateLocalTime = new Date();
    const isStaleServerTime = isStaleServerTimeUpdate(previousUpdateLocalTime.current, currentUpdateLocalTime);

    useEffect(() => {
        if (isStaleServerTime) {
            // We ping the server to trigger a server time update: do not want to wait up to 30s for the event loop
            // request to be processed, since the stale serverTime() value will be used by the apps in the meantime.
            void api({ ...ping() }).catch(noop);
        }
        previousUpdateLocalTime.current = currentUpdateLocalTime;
    });

    // We warn the user if the server time is too far off from local time.
    // We do not want the server to set arbitrary times (either past or future), to avoid signature replay issues and more.
    const showWarning = !ignore && serverTime && !isStaleServerTime && isOutOfSync(serverTime, currentUpdateLocalTime);

    // Log warning to have an idea of how many clients might be affected
    const onceRef = useRef(false);
    useEffect(() => {
        if (!showWarning || onceRef.current) {
            return;
        }

        onceRef.current = true;
        captureMessage('Client time difference larger than 24 hours', {
            level: 'info',
            extra: {
                serverTime: serverTime?.toString(),
                localTime: currentUpdateLocalTime.toString(),
                isStaleServerTime,
            },
        });
    }, [showWarning]);

    if (!showWarning) {
        return null;
    }

    const learnMore = <Href href={getKnowledgeBaseUrl('/device-time-warning')}>{c('Link').t`Learn more`}</Href>;

    return (
        <TopBanner onClose={() => setIgnore(true)} className="bg-warning">
            {c('Warning').jt`The date and time settings on your device are out of sync. ${learnMore}`}
        </TopBanner>
    );
};

export default TimeOutOfSyncTopBanner;
