import { useRef } from 'react';

import metrics from '@proton/metrics';
import type { VIEWS } from '@proton/shared/lib/calendar/constants';
import useFlag from '@proton/unleash/useFlag';

import { convertViewToString } from './calendarMetricsHelper';

type TransitionType = 'day-view' | 'week-view' | 'month-view' | 'search-view' | 'custom';

interface PTTMetric {
    startTime: DOMHighResTimeStamp;
    transitionType: TransitionType;
    prevPageClicked: boolean;
    nextPageClicked: boolean;
}

export const useCalendarPTTMetric = () => {
    const metricRef = useRef<PTTMetric | undefined>(undefined);
    const calendarMetricsEnabled = useFlag('CalendarMetrics');

    const startPTTMetric = (transition_type: VIEWS, prevClicked?: boolean, nextClicked?: boolean) => {
        if (!calendarMetricsEnabled) {
            return;
        }

        const startTime = performance.now();

        metricRef.current = {
            startTime: startTime,
            transitionType: convertViewToString(transition_type),
            prevPageClicked: !!prevClicked,
            nextPageClicked: !!nextClicked,
        };
    };

    const stopPTTMetric = () => {
        if (!calendarMetricsEnabled || !metricRef.current) {
            return;
        }

        const endTime = performance.now();
        const duration = (endTime - metricRef.current.startTime) / 1000;

        void metrics.calendar_page_transition_time_histogram.observe({
            Value: duration,
            Labels: {
                transition_type: metricRef.current.transitionType,
                prev_page_clicked: metricRef.current.prevPageClicked ? 'true' : 'false',
                next_page_clicked: metricRef.current.nextPageClicked ? 'true' : 'false',
            },
        });

        metricRef.current = undefined;
    };

    return {
        startPTTMetric,
        stopPTTMetric,
    };
};
