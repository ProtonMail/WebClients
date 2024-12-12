import { useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import metrics from '@proton/metrics';
import useFlag from '@proton/unleash/useFlag';

import { pathnameToLabelName } from './mailMetricsHelper';

interface TransitionData {
    from: string;
    to: string;
    startTime: DOMHighResTimeStamp;
    endTime?: DOMHighResTimeStamp;
    duration?: DOMHighResTimeStamp;
}

const transitionMap = new Map<string, TransitionData>();

export const useMailPTTMetric = () => {
    const location = useLocation();
    const history = useHistory();

    const mailMetricsEnabled = useFlag('MailMetrics');

    const previousLocationRef = useRef<string>(location.pathname);
    const currentTransitionRef = useRef<TransitionData | null>(null);

    useEffect(() => {
        const unlisten = history.listen((location) => {
            const startTime = performance.now();

            if (!currentTransitionRef.current) {
                // We only want to log root folders and not conversations/messages
                if (location.pathname.split('/').length > 2) {
                    return;
                }

                currentTransitionRef.current = {
                    from: previousLocationRef.current,
                    to: location.pathname,
                    startTime,
                };
            }
        });

        return () => unlisten();
    }, [history]);

    const stopPTTMetric = () => {
        if (currentTransitionRef.current) {
            const endTime = performance.now();

            const current = currentTransitionRef.current;
            currentTransitionRef.current = null;

            // We don't want to measure the same transition twice
            if (transitionMap.has(current.to) || !mailMetricsEnabled) {
                return;
            }

            previousLocationRef.current = location.pathname;

            transitionMap.set(current.to, {
                ...current,
                duration: endTime - current.startTime,
                endTime,
            });

            metrics.mail_performance_page_transition_time_histogram.observe({
                Value: (endTime - current.startTime) / 1000,
                Labels: {
                    from: pathnameToLabelName(current.from),
                    to: pathnameToLabelName(current.to),
                },
            });
        }
    };

    return { stopPTTMetric };
};
