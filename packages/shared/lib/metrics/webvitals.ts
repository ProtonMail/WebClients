import type {
    CLSAttribution,
    CLSMetric,
    CLSMetricWithAttribution,
    INPAttribution,
    INPMetric,
    INPMetricWithAttribution,
    LCPAttribution,
    LCPMetric,
    LCPMetricWithAttribution,
} from 'web-vitals';
import { onCLS, onINP, onLCP } from 'web-vitals';
import {
    onCLS as onCLSWithAttribution,
    onINP as onINPWithAttribution,
    onLCP as onLCPWithAttribution,
} from 'web-vitals/attribution';

import metrics from '@proton/metrics';

import { captureMessage } from '../helpers/sentry';

/*
 * Make sure you run this only once per react application
 * Ideally you can run it before doing ReactDOM.render()
 */

const canLogAttribution = (percentage: number) => {
    if (percentage < 0 || percentage > 100) {
        throw new Error('Probability must be between 0 and 100');
    }
    return Math.random() * 100 < percentage;
};

const getImpactedElement = (attribution: CLSAttribution | INPAttribution | LCPAttribution): string => {
    if ('largestShiftTarget' in attribution) {
        return attribution.largestShiftTarget || '';
    } else if ('interactionTarget' in attribution) {
        return attribution.interactionTarget;
    } else if ('element' in attribution) {
        return attribution.element || '';
    }
    return '';
};

const hasURLFragment = (url?: string): boolean => {
    return url ? url.includes('#') : false;
};

/*
 * Observability: you can access the main dashboard on Graphana /d/dd4d3306-9ce3-4c23-a447-a64017c1cc9a/web-vitals?orgId=1&from=now-7d&to=now
 * Attribution: our goal is to first reduce amount of "poor" ratings for all 3 main Web Vitals, so we log the attribution details in Sentry
 * On Sentry you can see in the tags which `element` is top % affected for the `${metric.name} has poor rating` issue, based on this `element` you can investigate which React component is the culprit.
 * The raw details are also available and can be used for further investigate. A fully fledge documentation is written here in Confluence at /wiki/spaces/DRV/pages/97944663/Web+Vitals
 * Interesting Read: https://web.dev/articles/debug-performance-in-the-field
 */
export const reportWebVitals = (context: 'public' | 'private' = 'private') => {
    const reportMetric = (metric: CLSMetric | INPMetric | LCPMetric) => {
        metrics.core_webvitals_total.increment({
            type: metric.name,
            rating: metric.rating,
            context,
        });
    };

    const reportMetricWithAttribution = (
        metric: CLSMetricWithAttribution | INPMetricWithAttribution | LCPMetricWithAttribution
    ) => {
        metrics.core_webvitals_total.increment({
            type: metric.name,
            rating: metric.rating,
            context,
        });

        // Fragment is considered private as that is part of URL not sending to the server.
        // For public sharing, we depend on not sharing this part with the server.
        // We rather ignore such reports as navigation entry cannot be modified.
        const reportIncludesPIIInfo =
            // @ts-ignore
            hasURLFragment(metric.attribution?.url) || hasURLFragment(metric.attribution?.navigationEntry?.name);

        if (!reportIncludesPIIInfo && metric.rating === 'poor') {
            captureMessage(`${metric.name} has poor rating`, {
                level: 'info',
                tags: {
                    element: getImpactedElement(metric.attribution),
                },
                extra: {
                    ...metric.attribution,
                },
            });
        }
    };

    // We do NOT need to log attributions for every single users
    // Just a few percentage suffice to help us debug and improve our web vitals
    // We currently report attribution only if rating is 'poor' in 3% of the users
    // Logging attribution is more "heavy" so that's why we don't want to do it all the time (it creates a bunch of IntersectionObserver instances)
    // Currently the attribution is logged in Sentry for ease of use and because all teams are already onboarded.
    if (canLogAttribution(3)) {
        onCLSWithAttribution(reportMetricWithAttribution);
        onINPWithAttribution(reportMetricWithAttribution);
        onLCPWithAttribution(reportMetricWithAttribution);
    } else {
        onCLS(reportMetric);
        onINP(reportMetric);
        onLCP(reportMetric);
    }
};
