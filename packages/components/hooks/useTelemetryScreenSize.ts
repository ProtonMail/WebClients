import { useEffect } from 'react';

import { useApi, useSideApp, useUser } from '@proton/components/hooks/index';
import { TelemetryMeasurementGroups, TelemetryScreenSizeEvents } from '@proton/shared/lib/api/telemetry';
import { SECOND } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import debounce from '@proton/utils/debounce';

const useTelemetryScreenSize = () => {
    const api = useApi();
    const [user] = useUser();
    const { parentApp } = useSideApp();

    const sendScreenSizeToTelemetry = async (event: TelemetryScreenSizeEvents) => {
        // If app is displayed inside an iframe, we don't want to send the screensize
        if (parentApp) {
            return;
        }

        // We need to send monitor size and view size
        const values = {
            screenWidth: screen.width,
            screenHeight: screen.height,
            viewWidth: window.innerWidth,
            viewHeight: window.innerHeight,
        };

        const dimensions = {
            Uid: user.ID,
        };

        await sendTelemetryReport(api, TelemetryMeasurementGroups.screenSize, event, values, dimensions);
    };

    // Send default user screen size
    useEffect(() => {
        void sendScreenSizeToTelemetry(TelemetryScreenSizeEvents.load);
    }, []);

    // Send screen size after a resize
    useEffect(() => {
        const handleResizeDebounced = debounce(() => {
            void sendScreenSizeToTelemetry(TelemetryScreenSizeEvents.resize);
        }, 2 * SECOND);

        window.addEventListener('resize', handleResizeDebounced);

        return () => {
            window.removeEventListener('resize', handleResizeDebounced);
        };
    }, []);
};

export default useTelemetryScreenSize;
