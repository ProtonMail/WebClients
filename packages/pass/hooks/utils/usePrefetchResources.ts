import { useEffect, useState } from 'react';

export type PrefetchResource = {
    url: string;
    as:
        | 'audio'
        | 'document'
        | 'embed'
        | 'fetch'
        | 'font'
        | 'image'
        | 'object'
        | 'script'
        | 'style'
        | 'track'
        | 'video'
        | 'worker';
};

export const usePrefetchResources = (resources: PrefetchResource[]): boolean => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (resources.length === 0) return setLoading(false);
        else setLoading(true);

        let completed = 0;

        const onResolve = () => ++completed === resources.length && setLoading(false);

        const links = resources.map(({ url, as }) => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.as = as;
            link.href = url;
            link.addEventListener('load', onResolve);
            link.addEventListener('error', onResolve);
            document.head.appendChild(link);
            return link;
        });

        return () =>
            links.forEach((link) => {
                link.removeEventListener('load', onResolve);
                link.removeEventListener('error', onResolve);
                link.remove();
            });
    }, [resources]);

    return loading;
};
