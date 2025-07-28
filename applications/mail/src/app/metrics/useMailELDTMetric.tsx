import { useRef } from 'react';

import { getLabelNameAnonymised } from '@proton/mail/helpers/location';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import metrics from '@proton/metrics';
import useFlag from '@proton/unleash/useFlag';

import type { LabelType } from './mailMetricsHelper';
import { getPageSizeString } from './mailMetricsHelper';

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
                loaded: getLabelNameAnonymised(labelID) as LabelType | 'custom',
            },
        });
    };

    return {
        stopELDTMetric,
    };
};
