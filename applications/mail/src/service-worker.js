import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { precacheAndRoute } from 'workbox-precaching/precacheAndRoute';
// Used for filtering matches based on status code, header, or both
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
// Used to limit entries in cache, remove entries after a certain period of time
import { ExpirationPlugin } from 'workbox-expiration';

// To remove debug logs in dev mode
// self.__WB_DISABLE_DEV_LOGS = true;

const manifest = self.__WB_MANIFEST.filter(({ url }) => {
    return !url.includes('htaccess');
});

precacheAndRoute(manifest);

const pagesStrategy = new NetworkFirst({
    // Put all cached files in a cache named 'pages'
    cacheName: 'pages',
    plugins: [
        // Ensure that only requests that result in a 200 status are cached
        new CacheableResponsePlugin({
            statuses: [200],
        }),
    ],
});

// Cache page navigations (html) with a Network First strategy
registerRoute(
    ({ url, request }) => {
        return (
            request.mode === 'navigate' && // The request is a navigation to a new page
            !url.searchParams.has('no-cache') && // Ignore urls with ?no-cache query parameter
            !['/create'].some((path) => url.pathname.startsWith(path)) // Ignore urls from .htaccess
        );
    },
    // Use a Network First caching strategy
    ({ url, event }) => {
        const path = url.pathname.startsWith('/eo') ? '/eo.html' : '/index.html';
        const request = new Request(path);
        return pagesStrategy.handle({ request, event });
    }
);

// Cache images, CSS, JS, and Web Worker with a Cache First strategy
registerRoute(
    // Check to see if the request's destination is style for an image
    ({ request }) =>
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'worker' ||
        request.destination === 'image',
    // Use a Cache First caching strategy
    new CacheFirst({
        // Put all cached files in a cache named 'assets'
        cacheName: 'assets',
        plugins: [
            // Ensure that only requests that result in a 200 status are cached
            new CacheableResponsePlugin({
                statuses: [200],
            }),
            // Don't cache more than 200 items, and expire them after 30 days
            new ExpirationPlugin({
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
            }),
        ],
    })
);
