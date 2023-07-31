import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { stripLocaleTagPrefix } from './locales';
import { getLocalePathPrefix } from './useLocationWithoutLocale';

const defaultValue: MetaTags = { title: undefined, description: undefined };

export interface MetaTags {
    title: string | undefined;
    description: string | undefined;
}

export const useMetaTags = (options: MetaTags | null) => {
    const { title, description } = options || defaultValue;

    useEffect(() => {
        if (options === null || description === undefined) {
            return;
        }
        const node = document.querySelector('meta[name="description"]');
        const og = document.querySelector('meta[property="og:description"]');
        const twitter = document.querySelector('meta[name="twitter:description"]');
        node?.setAttribute('content', description);
        twitter?.setAttribute('content', description);
        og?.setAttribute('content', description);
    }, [description]);

    // This is explicitly happening in render and not in a useEffect to allow children to override parent titles
    useMemo(() => {
        if (options === null || title === undefined) {
            return;
        }
        document.title = title;
        const og = document.querySelector('meta[property="og:title"]');
        const twitter = document.querySelector('meta[name="twitter:title"]');
        twitter?.setAttribute('content', title);
        og?.setAttribute('content', title);
    }, [title]);

    // Use location to trigger update on route changes
    useLocation();
    // Use window.location.pathname to also include locale prefix
    const fullPathname = window.location.pathname;

    useEffect(() => {
        if (options === null) {
            return;
        }
        const canonical = document.querySelector('link[rel="canonical"]');
        const og = document.querySelector('meta[property="og:url"]');
        if (!canonical) {
            return;
        }

        const fullPathWithoutLocalePrefix = stripLocaleTagPrefix(fullPathname);

        const updateAlternateLinkHref = (link: Element) => {
            const hrefValue = link.getAttribute('href');
            if (!hrefValue) {
                return;
            }
            const href = new URL(hrefValue);

            const noLocalePrefix = stripLocaleTagPrefix(href.pathname);
            const newHref = `${href.origin}${getLocalePathPrefix(noLocalePrefix.localePrefix)}${
                fullPathWithoutLocalePrefix.pathname
            }`;

            link.setAttribute('href', newHref);
        };

        try {
            const hrefValue = canonical.getAttribute('href');
            if (!hrefValue) {
                return;
            }
            const url = new URL(hrefValue);
            const content = `${url.origin}${fullPathname}`;
            canonical.setAttribute('href', content);
            og?.setAttribute('content', content);

            const links = document.querySelectorAll('link[rel="alternate"]');
            links.forEach(updateAlternateLinkHref);
        } catch (e) {}
    }, [fullPathname]);
};
