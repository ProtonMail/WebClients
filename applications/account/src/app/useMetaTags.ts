import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const defaultValue = { title: undefined, description: undefined };

export const useMetaTags = (options: { title: string; description: string } | null) => {
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

    const location = useLocation();
    useEffect(() => {
        if (options === null) {
            return;
        }
        const canonical = document.querySelector('link[rel="canonical"]');
        const og = document.querySelector('meta[property="og:url"]');
        if (!canonical) {
            return;
        }
        try {
            const url = new URL(canonical.getAttribute('href') || '');
            const content = `${url.origin}${location.pathname}`;
            canonical.setAttribute('href', content);
            og?.setAttribute('content', content);
        } catch (e) {}
    }, [location.pathname]);
};
