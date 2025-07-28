import { useRef } from 'react';

import metrics from '@proton/metrics';
import type { VIEWS } from '@proton/shared/lib/calendar/constants';
import useFlag from '@proton/unleash/useFlag';

import { convertViewToString } from './calendarMetricsHelper';

export const useCalendarCEDTMetric = () => {
    const hasReportedCEDT = useRef<boolean>(false);
    const calendarMetricsEnabled = useFlag('CalendarMetrics');

    const stopCEDTMetric = (view: VIEWS) => {
        if (!calendarMetricsEnabled || hasReportedCEDT.current) {
            return;
        }
        const end = performance.now();

        void metrics.calendar_calendar_event_display_time_histogram.observe({
            Value: end / 1000,
            Labels: {
                view: convertViewToString(view),
            },
        });

        hasReportedCEDT.current = true;
    };

    return {
        stopCEDTMetric,
    };
};
