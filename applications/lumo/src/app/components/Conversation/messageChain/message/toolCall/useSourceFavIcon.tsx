import { useEffect, useState } from 'react';

import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import { getLogo } from '@proton/shared/lib/api/images';

function blobToDataURL(blob: Blob): Promise<string | null> {
    console.log('blob: ', blob);
    return new Promise((resolve) => {
        if (blob.size === 0) return resolve(null);
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result?.toString() || null);
        reader.readAsDataURL(blob);
    });
}

export const getDomainPart = (url: string) => {
    const domain = url.split('/')[2];
    return domain.replace(/^www\./i, '').toLowerCase();
    // return domain;
};

interface CacheEntry {
    promise?: Promise<string | null>;
    result?: string | null;
}

const faviconCache = new Map<string, CacheEntry>();

const fetchFaviconWithCache = async (domain: string, api: any): Promise<string | null> => {
    const existing = faviconCache.get(domain);

    if (existing?.result !== undefined) {
        console.log(`Cache HIT (result) for ${domain}`);
        return existing.result;
    }

    if (existing?.promise) {
        console.log(`Cache HIT (promise) for ${domain}`);
        return existing.promise;
    }

    console.log(`Cache MISS for ${domain} - making network request`);

    const cacheEntry: CacheEntry = {};
    faviconCache.set(domain, cacheEntry);

    const fetchPromise = (async () => {
        try {
            const response = await api(getLogo({ Domain: domain, Size: 16 }, 'raw'));
            if (!response) {
                cacheEntry.result = null;
                cacheEntry.promise = undefined;
                return null;
            }

            const dataURL = await blobToDataURL(await response.blob());

            // Store the result and clear promise
            cacheEntry.result = dataURL;
            cacheEntry.promise = undefined;

            return dataURL;
        } catch (error) {
            console.error(`Failed to fetch favicon for ${domain}.`);
            cacheEntry.result = null;
            cacheEntry.promise = undefined;
            return null;
        }
    })();

    cacheEntry.promise = fetchPromise;
    return fetchPromise;
};

// Custom hook
export const useSourceFavIcon = (domain: string) => {
    const [src, setSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const silentApi = useSilentApi();

    useEffect(() => {
        if (!domain) {
            return;
        }

        // Check for immediate cache hit
        const cached = faviconCache.get(domain);
        if (cached?.result !== undefined) {
            console.log(`Immediate cache hit for ${domain}`);
            setSrc(cached.result);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        fetchFaviconWithCache(domain, silentApi)
            .then((dataURL) => {
                setSrc(dataURL);
                setError(null);
            })
            .catch((err) => {
                console.error('Favicon fetch error:', err);
                setSrc(null);
                setError(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [domain]);

    return { src, loading, error };
};
