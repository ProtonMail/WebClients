import { useRef } from 'react';

import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import metrics from '@proton/metrics';
import useFlag from '@proton/unleash/useFlag';

import { getLabelName, getPageSizeString } from './mailMetricsHelper';

export const useMailELDTMetric = () => {
    const [settings] = useMailSettings();
    const mailMetricsEnabled = useFlag('MailMetrics');

    const alreadyReportedELDT = useRef<boolean>(false);

    const stopELDTMetric = (labelID: string) => {
        const end = performance.now();

        if (alreadyReportedELDT.current || !mailMetricsEnabled) {
            return;
        }

        alreadyReportedELDT.current = true;

        metrics.mail_performance_email_list_display_time_histogram.observe({
            Value: end / 1000,
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
