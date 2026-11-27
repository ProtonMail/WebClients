import { useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';

import type { HomepageNavigation, HomepageRoute } from 'proton-docs/homepage';

import { StandaloneHomepage, getHref, getRoute, homepagePaths } from './StandaloneHomepage';

// The homepage's navigation on the window's history, as realtime's editor demos keep their address.
const historyListeners = new Set<() => void>();
window.addEventListener('popstate', () => historyListeners.forEach((listener) => listener()));

function subscribeToHistory(listener: () => void) {
    historyListeners.add(listener);
    return () => historyListeners.delete(listener);
}

const navigate: HomepageNavigation['navigate'] = (to, { replace = false } = {}) => {
    window.history[replace ? 'replaceState' : 'pushState'](null, '', getHref(to));
    historyListeners.forEach((listener) => listener());
};

let route: HomepageRoute | undefined;
let routeHref = '';
function getWindowRoute() {
    const href = window.location.pathname + window.location.search;
    if (!route || href !== routeHref) {
        routeHref = href;
        route = getRoute(window.location.pathname, window.location.search);
    }
    return route;
}

if (!homepagePaths.includes(window.location.pathname)) {
    window.history.replaceState(null, '', '/recents');
}

function Homepage() {
    const navigation = { route: useSyncExternalStore(subscribeToHistory, getWindowRoute), navigate, getHref };
    return <StandaloneHomepage navigation={navigation} />;
}

createRoot(document.getElementById('root')!).render(<Homepage />);
