import metrics from '@proton/metrics';
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

const getTimeToContentLoaded = (): number | undefined => {
    const perfEntries = performance.getEntriesByType('navigation');

    if (perfEntries && perfEntries.length > 0) {
        const navigationEntry = perfEntries[0];
        const startTime = navigationEntry.startTime;
        const domContentLoadedEventStart = navigationEntry.domContentLoadedEventStart;
        return domContentLoadedEventStart - startTime;
    }
};

function logTimeToContentLoaded() {
    const timeToContentLoaded = getTimeToContentLoaded();
    const pageType = getCurrentPageType();
    if (timeToContentLoaded && pageType) {
        metrics.drive_performance_domcontentloaded_histogram.observe({
            Labels: {
                pageType,
            },
            Value: timeToContentLoaded / 1000,
        });
    }
}

const initializeBrowserEvents = () => {
    if (document.readyState === 'complete') {
        logTimeToContentLoaded();
    } else {
        document.addEventListener('DOMContentLoaded', logTimeToContentLoaded);
    }
};

export const initializePerformanceMetrics = (isPublic: boolean) => {
    initializeBrowserEvents();
    reportWebVitals(isPublic ? 'public' : 'private');
};
