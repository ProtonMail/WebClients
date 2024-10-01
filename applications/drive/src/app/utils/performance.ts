import metrics from '@proton/metrics';
import type Metrics from '@proton/metrics/Metrics';
import Histogram from '@proton/metrics/lib/Histogram';
import { reportWebVitals } from '@proton/shared/lib/metrics/webvitals';

export const getCurrentPageType = (path: string = window.location.pathname) => {
    // Normalize the path: remove leading/trailing slashes and collapse multiple slashes
    const normalizedPath = path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
    const pathParts = normalizedPath.split('/');

    const part = pathParts[0] === 'u' ? pathParts[2] : pathParts[0];
    switch (part) {
        case 'devices':
            return 'computers';
        case 'trash':
            return 'trash';
        case 'shared-urls':
            return 'shared_by_me';
        case 'shared-with-me':
            return 'shared_with_me';
        case 'photos':
            return 'photos';
    }

    if (pathParts[0] === 'urls') {
        return 'public_page';
    }

    if (
        (pathParts.length === 2 && pathParts[0] === 'u') ||
        (pathParts.length === 5 && pathParts[3] === 'folder') ||
        (pathParts.length === 5 && pathParts[3] === 'file') ||
        path === '/' || // Redirect case
        normalizedPath === '' // Redirect case (nothing)
    ) {
        return 'filebrowser';
    }
};

const getBrowserTime = (marker: 'loadEventStart' | 'domContentLoadedEventStart'): number | undefined => {
    const perfEntries = performance.getEntriesByType('navigation');

    if (perfEntries && perfEntries.length > 0) {
        const navigationEntry = perfEntries[0];
        const startTime = navigationEntry.startTime;
        return navigationEntry[marker] - startTime;
    }
};

const logBrowserTime = (
    metric: 'drive_performance_load_histogram' | 'drive_performance_domcontentloaded_histogram',
    marker: 'loadEventStart' | 'domContentLoadedEventStart'
) => {
    const time = getBrowserTime(marker);
    const pageType = getCurrentPageType();
    if (time && pageType) {
        metrics[metric].observe({
            Labels: {
                pageType,
            },
            Value: time / 1000,
        });
    }
};

const initializeBrowserEvents = () => {
    window.addEventListener('load', () => logBrowserTime('drive_performance_load_histogram', 'loadEventStart'));
    if (document.readyState === 'complete') {
        logBrowserTime('drive_performance_domcontentloaded_histogram', 'domContentLoadedEventStart');
    } else {
        document.addEventListener('DOMContentLoaded', () =>
            logBrowserTime('drive_performance_domcontentloaded_histogram', 'domContentLoadedEventStart')
        );
    }
};

/**
 * Initializes performance metrics for the application.
 *
 * This function sets up browser event listeners to log performance metrics
 * and initializes web vitals reporting.
 *
 * @param isPublic - A boolean indicating whether the metrics are for a public or private context.
 */
export const initializePerformanceMetrics = (isPublic: boolean) => {
    initializeBrowserEvents();
    reportWebVitals(isPublic ? 'public' : 'private');
};

const getTimeFromNavigationStart = (key: string): number | undefined => {
    const perfEntries = performance.getEntriesByType('navigation');
    if (perfEntries && perfEntries.length > 0) {
        const navigationEntry = perfEntries[0];
        const startTime = navigationEntry.startTime;
        const measureName = `measure-${key}`;

        performance.measure(measureName, {
            start: startTime,
            end: key,
        });

        const measurement = performance.getEntriesByName(measureName)[0];
        return measurement.duration;
    }
};

/**
 * Logs a performance marker and records its timing metrics.
 *
 * This function creates a performance mark, measures the time from navigation start
 * to the mark, and records the metric to observability.
 *
 * @param key - The key of the performance marker, which should correspond to a key in the Metrics type (your observability metric).
 * @param view - Optional parameter specifying the view type ('list' or 'grid'), used for for certain metrics.
 */
export const logPerformanceMarker = (key: keyof Metrics, view?: 'list' | 'grid') => {
    performance.mark(key);
    const time = getTimeFromNavigationStart(key);
    const pageType = getCurrentPageType();

    if (time && pageType && metrics[key] instanceof Histogram) {
        metrics[key].observe({
            Labels: {
                pageType,
                ...(view && { view }),
            },
            Value: time / 1000,
        });
    }
};
