import { useRef } from 'react';

import metrics from '@proton/metrics';
import useFlag from '@proton/unleash/useFlag';

type ResponseType = 'accept' | 'tentative' | 'decline';

interface ERRTetric {
    startTime: DOMHighResTimeStamp;
    responseType: ResponseType;
}

export const useCalendarERRTetric = () => {
    const metricRef = useRef<ERRTetric | undefined>(undefined);
    const calendarMetricsEnabled = useFlag('CalendarMetrics');

    const startERRTMetric = (responseType: ResponseType) => {
        if (!calendarMetricsEnabled) {
            return;
        }

        const startTime = performance.now();

        metricRef.current = {
            startTime: startTime,
            responseType: responseType,
        };
    };

    const stopERRTMetric = () => {
        if (!calendarMetricsEnabled || !metricRef.current) {
            return;
        }

        const endTime = performance.now();
        const duration = (endTime - metricRef.current.startTime) / 1000;

        void metrics.calendar_event_rsvp_response_time_histogram.observe({
            Value: duration,
            Labels: { response_type: metricRef.current.responseType },
        });

        metricRef.current = undefined;
    };

    return {
        startERRTMetric,
        stopERRTMetric,
    };
};
