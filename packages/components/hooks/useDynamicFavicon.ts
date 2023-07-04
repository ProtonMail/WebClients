import { useEffect, useRef } from 'react';

import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';

import useApiStatus from './useApiStatus';

const useDynamicFavicon = (faviconSrc: string) => {
    const faviconRef = useRef<string>('');
    const { offline, apiUnreachable } = useApiStatus();

    // We can't rely solely on the Boolean offline because browsers may not catch all offline instances properly.
    // We will get some false positives with the condition below, but that's ok
    const isPossiblyOffline = offline || !!apiUnreachable;

    useEffect(
        () => {
            const run = async () => {
                if (faviconSrc === faviconRef.current) {
                    // no need to update the favicon
                    return;
                }
                // Add random param to force refresh
                const randomParameter = Math.random().toString(36).substring(2);
                const href = `${faviconSrc}?v=${randomParameter}`;

                try {
                    /**
                     * Proactively fetch favicon to test if /assets are reachable.
                     * * If that goes well, the request is cached and not launched again below when actually changing the favicon in the HTML
                     * * If that doesn't work, we want to handle the error here since we can't attach an error handled to the link tag that controls the favicon
                     */
                    const { status } = await fetch(href);

                    if (status !== HTTP_STATUS_CODE.OK) {
                        throw new Error('New favicon was not fetched properly');
                    }
                } catch (e) {
                    // if we cannot fetch the favicon, do not attempt to change it
                    return;
                }

                // Ensure all favicons are removed, otherwise chrome has trouble updating to the dynamic icon
                const links = document.querySelectorAll('link[rel="icon"]:not([data-dynamic-favicon])');
                links.forEach((link) => {
                    link.remove();
                });

                const favicon = document.querySelector('link[rel="icon"][type="image/svg+xml"][data-dynamic-favicon]');

                if (favicon) {
                    favicon.setAttribute('href', href);
                } else {
                    const link = document.createElement('link');
                    link.setAttribute('rel', 'icon');
                    link.setAttribute('type', 'image/svg+xml');
                    link.setAttribute('data-dynamic-favicon', '');
                    link.setAttribute('href', href);
                    document.head.appendChild(link);
                }
                faviconRef.current = faviconSrc;
            };

            run();
        },
        // isPossiblyOffline is a dependency so that we re-try to update the favicon when going offline and back online
        [faviconSrc, isPossiblyOffline]
    );
};

export default useDynamicFavicon;
