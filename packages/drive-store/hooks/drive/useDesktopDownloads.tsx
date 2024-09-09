import { useEffect, useState } from 'react';

import useLoading from '@proton/hooks/useLoading';
import isTruthy from '@proton/utils/isTruthy';

import type { PlatformInfo } from '../../utils/appPlatforms';
import { appPlatforms, fetchDesktopDownloads } from '../../utils/appPlatforms';

type PlatformDownload = PlatformInfo & {
    url?: string;
    startDownload?: () => void;
};

/**
 * A hook that will fetch all available desktop downloads on mount, and provide the data.
 */
export const useDesktopDownloads = () => {
    const [isLoading, withLoading] = useLoading();
    const [downloads, setDownloads] = useState<PlatformDownload[]>([]);

    useEffect(
        () => {
            void withLoading(
                fetchDesktopDownloads().then((result) => {
                    setDownloads(
                        appPlatforms
                            .map<PlatformDownload | undefined>((platform) => {
                                const url = result[platform.platform];

                                if (platform.hideIfUnavailable && !url) {
                                    return undefined;
                                }

                                return {
                                    ...platform,
                                    url,
                                    startDownload: () => {
                                        if (!url) {
                                            return;
                                        }

                                        window.location.href = url;
                                    },
                                };
                            })
                            .filter(isTruthy)
                    );
                })
            );
        },
        // We specifically pass an empty object as withLoading is not memoized
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    return {
        isLoading,
        downloads,
    };
};

export default useDesktopDownloads;
