import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import metrics from '@proton/metrics';
import useFlag from '@proton/unleash/useFlag';

import { conversationByID } from '../store/conversations/conversationsSelectors';
import { useMailStore } from '../store/hooks';
import { getLabelID, getPageSizeString } from './mailMetricsHelper';

interface ECRTMetric {
    labelID: string;
    startRenderTime: DOMHighResTimeStamp;
    endRenderTime?: DOMHighResTimeStamp;
    cached: boolean;
}

const metricsMap = new Map<string, ECRTMetric>();

export const useMailECRTMetric = () => {
    const [settings] = useMailSettings();
    const mailMetricsEnabled = useFlag('MailMetrics');
    const store = useMailStore();

    const startECRTMetric = (labelID: string, elementID?: string) => {
        const startRenderTime = performance.now();

        if (!elementID || !mailMetricsEnabled) {
            return;
        }

        // We don't want to measure the same element twice
        if (metricsMap.has(elementID)) {
            return;
        }

        const state = store.getState();
        const cached = !!conversationByID(state, { ID: elementID ?? '' });
        metricsMap.set(elementID, { labelID, startRenderTime, cached });
    };

    const stopECRTMetric = (elementID?: string) => {
        const end = performance.now();

        if (!elementID || !mailMetricsEnabled) {
            return;
        }

        const metric = metricsMap.get(elementID);
        if (!metric || metric.endRenderTime) {
            return;
        }

        metricsMap.set(elementID, { ...metric, endRenderTime: end });

        const time = end - metric.startRenderTime;

        void metrics.mail_performance_email_content_render_time_histogram.observe({
            Value: time,
            Labels: {
                location: getLabelID(metric.labelID),
                pageSize: getPageSizeString(settings),
                cached: metric.cached ? 'true' : 'false',
            },
        });
    };

    return {
        startECRTMetric,
        stopECRTMetric,
    };
};
