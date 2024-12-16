import { useRef } from 'react';

import metrics from '@proton/metrics';
import useFlag from '@proton/unleash/useFlag';

type ActionType = 'delete' | 'edit';

interface EALMetric {
    startTime: DOMHighResTimeStamp;
    action: ActionType;
}

export const useCalendarEALMetric = () => {
    const metricRef = useRef<EALMetric | undefined>(undefined);
    const calendarMetricsEnabled = useFlag('CalendarMetrics');

    const startEALMetric = (action: ActionType) => {
        if (!calendarMetricsEnabled) {
            return;
        }

        const startTime = performance.now();

        metricRef.current = {
            startTime: startTime,
            action: action,
        };
    };

    const stopEALMetric = () => {
        if (!calendarMetricsEnabled || !metricRef.current) {
            return;
        }

        const endTime = performance.now();
        const duration = (endTime - metricRef.current.startTime) / 1000;

        void metrics.calendar_event_action_latency_histogram.observe({
            Value: duration,
            Labels: {
                action: metricRef.current.action,
            },
        });

        metricRef.current = undefined;
    };

    return {
        startEALMetric,
        stopEALMetric,
    };
};
