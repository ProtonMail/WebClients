import { useRef } from 'react';

import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import metrics from '@proton/metrics';
import useFlag from '@proton/unleash/useFlag';

import { getLabelName, getPageSizeString } from './mailMetricsHelper';

const ELDTMetrickMark = 'mail_web_ELDT';
const ELDTMetricMarkEnd = `${ELDTMetrickMark}-end`;

export const ELDTMetricMarkStart = `${ELDTMetrickMark}-start`;

export const useMailELDTMetric = () => {
    const [settings] = useMailSettings();
    const mailMetricsEnabled = useFlag('MailMetrics');

    const alreadyReportedELDT = useRef<boolean>(false);

    const stopELDTMetric = (labelID: string) => {
        performance.mark(ELDTMetricMarkEnd);

        if (alreadyReportedELDT.current || !mailMetricsEnabled) {
            return;
        }

        alreadyReportedELDT.current = true;

        const eldtMetric = performance.measure(ELDTMetrickMark, ELDTMetricMarkStart, ELDTMetricMarkEnd);
        metrics.mail_performance_email_list_display_time_histogram.observe({
            Value: eldtMetric.duration / 1000,
            Labels: {
                pageSize: getPageSizeString(settings),
                loaded: getLabelName(labelID),
            },
        });
    };

    return {
        stopELDTMetric,
    };
};
