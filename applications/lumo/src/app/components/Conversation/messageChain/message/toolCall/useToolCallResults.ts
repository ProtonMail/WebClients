import { useEffect, useMemo, useState } from 'react';

import type { Message } from 'applications/lumo/src/app/types';

import { useApi } from '@proton/components';
import { getLogo } from '@proton/shared/lib/api/images';

import type { SearchItem } from '../../../../../lib/toolCall/types';

interface EnhancedToolCallResults {
    enhancedResults: EnhancedSearchItem[] | null;
}

// Helper function to extract domain from URL
function getDomainPart(url: string): string | undefined {
    try {
        const domain = url.split('/')[2];
        return domain ? domain.replace(/^www\./i, '').toLowerCase() : undefined;
    } catch {
        return undefined;
    }
}

function blobToDataURL(blob: Blob): Promise<string | undefined> {
    return new Promise((resolve) => {
        if (blob.size === 0) return resolve(undefined);
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result?.toString());
        reader.readAsDataURL(blob);
    });
}

export type EnhancedSearchItem = SearchItem & {
    domain?: string;
    dataUrl?: string;
};

export const useToolCallResults = (results: SearchItem[] | null, message: Message): EnhancedToolCallResults => {
    const api = useApi();
    const [enhancedResults, setEnhancedResults] = useState<EnhancedSearchItem[] | null>(null);

    // Create a stable dependency by stringifying the results
    const resultsKey = useMemo(() => {
        if (!results) return '';
        return results.map((r) => r.url).join(',');
    }, [results]);

    useEffect(() => {
        const processResults = async () => {
            if (message.status !== 'succeeded' || !results || results.length === 0) {
                setEnhancedResults(null);
                return;
            }

            // First enhance with domains
            const withDomains = results.map((result: SearchItem) => ({
                ...result,
                domain: getDomainPart(result.url),
            }));

            // Then fetch all logos in parallel
            const withLogos = await Promise.all(
                withDomains.map(async (result) => {
                    if (!result.domain) return result;

                    try {
                        const response = await api(getLogo({ Domain: result.domain, Size: 16 }, 'raw'));
                        const dataUrl = await blobToDataURL(await response.blob());
                        return {
                            ...result,
                            dataUrl,
                        };
                    } catch (error) {
                        console.error('Error fetching logo:', error);
                        return result;
                    }
                })
            );

            setEnhancedResults(withLogos);
        };

        void processResults();
    }, [message.status, resultsKey, api]); // Use resultsKey instead of results array

    return {
        enhancedResults,
    };
};
