import type { ReactNode } from 'react';

import { useApi } from '@proton/components';
import { UnleashFlagProvider } from '@proton/unleash';

import { PublicSessionProvider } from './_api';
import { DevicesProvider } from './_devices';
import { DownloadsProvider, PublicDownloadsProvider } from './_downloads';
import { DriveEventManagerProvider } from './_events';
import { LinksProvider, PublicLinksProvider } from './_links';
import { PhotosProvider } from './_photos';
import { SearchProvider } from './_search';
import { SharesProvider } from './_shares';
import { UploadProvider } from './_uploads';
import { VolumesProvider } from './_volumes';

interface DriveProviderProps {
    children: ReactNode;
}

export function DriveProvider({ children }: DriveProviderProps) {
    return (
        <DriveEventManagerProvider>
            <VolumesProvider>
                <SharesProvider>
                    <LinksProvider>
                        <DevicesProvider>
                            <DownloadsProvider>
                                <UploadProvider>
                                    <SearchProvider>
                                        <PhotosProvider>{children}</PhotosProvider>
                                    </SearchProvider>
                                </UploadProvider>
                            </DownloadsProvider>
                        </DevicesProvider>
                    </LinksProvider>
                </SharesProvider>
            </VolumesProvider>
        </DriveEventManagerProvider>
    );
}

interface PublicDriveProviderProps {
    children: ReactNode;
}

export function PublicDriveProvider({ children }: PublicDriveProviderProps) {
    const api = useApi();
    return (
        <UnleashFlagProvider api={api}>
            <PublicSessionProvider>
                <SharesProvider>
                    <PublicLinksProvider>
                        <PublicDownloadsProvider>{children}</PublicDownloadsProvider>
                    </PublicLinksProvider>
                </SharesProvider>
            </PublicSessionProvider>
        </UnleashFlagProvider>
    );
}
