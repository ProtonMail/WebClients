import { useEffect } from 'react';

export type PreloadableResource = {
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

export const usePreloadResources = (resources: PreloadableResource[]) => {
    useEffect(() => {
        if (resources.length === 0) return;
        const links = resources.map(({ url, as }) => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = as;
            link.href = url;
            document.head.appendChild(link);
            return link;
        });

        return () => links.forEach((link) => link.remove());
    }, [resources]);
};
