/* @ngInject */
function analytics(CONFIG, CONSTANTS, aboutClient) {
    const { isEnabled, cookieDomain = '', domains = [], statsHost = '', siteId = -1, abSiteId = -1 } = CONFIG.statsConfig;

    // check if we should load the analytics package
    if (!isEnabled) { // || aboutClient.doNotTrack()) {
        return { init: angular.noop, trackGoals: angular.noop, trackPage: angular.noop };
    }

    // a queue of promises that are resolved once piwik is loaded.
    const loadQueue = [];
    const state = {};

    // Load the piwik script tag
    window.piwikAsyncInit = () => {
        state.tracker = window.Piwik.getTracker(`//${statsHost}/${CONSTANTS.TRACKER_ROUTE}`, siteId);
        // init the tracker
        state.tracker.setCookieDomain(cookieDomain);
        state.tracker.setDomains(domains);
        state.tracker.enableCrossDomainLinking();
        // temporarily disable do not track and cookies. Will be enabled again after some testing.
        // state.tracker.setDoNotTrack(true);
        // state.tracker.disableCookies();
        state.tracker.setCustomVariable(1, 'siteFrontEndId', abSiteId, 'visit');
        state.tracker.setCustomVariable(3, 'siteFrontEndClient', CONFIG.clientID + '_' + CONFIG.app_version, 'visit');
        state.tracker.setCustomVariable(1, 'enablePMRequestCombiner', 'yes', 'page');
        // trigger the promises waiting for the tracker.
        loadQueue.forEach((resolve) => resolve(state.tracker));
    };

    const piwikScript = document.createElement('script');
    piwikScript.type = 'text/javascript';
    piwikScript.async = true;
    piwikScript.defer = true;
    piwikScript.src = `https://${statsHost}/${CONSTANTS.PIWIK_SCRIPT}`;
    document.head.appendChild(piwikScript);

    function getTrackerAsync() {
        if (!state.tracker) {
            return new Promise((resolve) => {
                loadQueue.push(resolve);
            });
        }

        return Promise.resolve(state.tracker);
    }

    function trackPage({ url, referrer, title }) {
        getTrackerAsync().then((tracker) => {
            tracker.setDocumentTitle(title);
            tracker.setReferrerUrl(referrer);
            tracker.setCustomUrl(url);
            tracker.trackPageView();
        });
    }

    function trackGoals(goals) {
        getTrackerAsync().then((tracker) => {
            tracker.trackGoal(goals);
        });
    }

    return { init: angular.noop, trackGoals, trackPage };
}
export default analytics;
