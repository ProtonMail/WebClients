import { useEffect } from 'react';

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

export const usePrefetchResources = (resources: PrefetchResource[]) => {
    useEffect(() => {
        const links = resources.map(({ url, as }) => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.as = as;
            link.href = url;
            link.fetchPriority = 'low';
            document.head.appendChild(link);
            return link;
        });

        return () => links.forEach((link) => link.remove());
    }, [resources]);
};
