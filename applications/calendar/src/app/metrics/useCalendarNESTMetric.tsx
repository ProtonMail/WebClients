import { useRef } from 'react';

import metrics from '@proton/metrics';
import useFlag from '@proton/unleash/useFlag';

import type { CalendarViewEventTemporaryEvent } from '../containers/calendar/interface';
import { getNESTData } from './calendarMetricsHelper';

interface NESTMetric {
    startTime: DOMHighResTimeStamp;
    isRecurring: boolean;
    hasInvitees: boolean;
    hasConferenceData: boolean;
}

export const useCalendarNESTMetric = () => {
    const metricRef = useRef<NESTMetric | undefined>(undefined);
    const calendarMetricsEnabled = useFlag('CalendarMetrics');

    const startNESTMetric = (event: CalendarViewEventTemporaryEvent, isCreatingEvent: boolean) => {
        if (!calendarMetricsEnabled || !isCreatingEvent) {
            return;
        }

        const startTime = performance.now();

        metricRef.current = {
            startTime: startTime,
            ...getNESTData(event),
        };
    };

    const stopNESTMetric = (isCreatingEvent: boolean) => {
        if (!calendarMetricsEnabled || !isCreatingEvent || !metricRef.current) {
            return;
        }

        const endTime = performance.now();
        const duration = (endTime - metricRef.current.startTime) / 1000;

        void metrics.calendar_new_event_setup_time_histogram.observe({
            Value: duration,
            Labels: {
                recurring: metricRef.current.isRecurring ? 'true' : 'false',
                has_conference_data: metricRef.current.hasConferenceData ? 'true' : 'false',
                has_invitees: metricRef.current.hasInvitees ? 'true' : 'false',
            },
        });

        metricRef.current = undefined;
    };

    return {
        startNESTMetric,
        stopNESTMetric,
    };
};
