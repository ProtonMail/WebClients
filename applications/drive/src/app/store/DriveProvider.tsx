import type { ReactNode } from 'react';

import { PublicSessionProvider } from './_api';
import { DevicesProvider } from './_devices';
import { DownloadsProvider, PublicDownloadsProvider } from './_downloads';
import { DriveEventManagerProvider } from './_events';
import { InvitationsStateProvider } from './_invitations/useInvitationsState';
import { LinksProvider, PublicLinksProvider } from './_links';
import { PhotosOrPhotosWithAlbumsProvider } from './_photos/PhotosOrPhotosWithAlbumsProvider';
import { SearchProvider } from './_search';
import { useUserSettings } from './_settings';
import { SharesProvider } from './_shares';
import { UploadProvider } from './_uploads';
import { PublicUploadProvider } from './_uploads/UploadProvider/UploadProvider';
import { VolumesProvider } from './_volumes';

interface DriveProviderProps {
    children: ReactNode;
}

export function DriveProvider({ children }: DriveProviderProps) {
    const { photosEnabled } = useUserSettings();

    return (
        <DriveEventManagerProvider>
            <VolumesProvider>
                <SharesProvider>
                    <LinksProvider>
                        <DevicesProvider>
                            <DownloadsProvider>
                                <UploadProvider>
                                    <SearchProvider>
                                        {photosEnabled && (
                                            <PhotosOrPhotosWithAlbumsProvider>
                                                <InvitationsStateProvider>{children}</InvitationsStateProvider>
                                            </PhotosOrPhotosWithAlbumsProvider>
                                        )}
                                        {!photosEnabled && (
                                            <InvitationsStateProvider>{children}</InvitationsStateProvider>
                                        )}
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
    return (
        <VolumesProvider>
            <SharesProvider>
                <PublicSessionProvider>
                    <PublicLinksProvider>
                        <PublicUploadProvider>
                            <PublicDownloadsProvider>{children}</PublicDownloadsProvider>
                        </PublicUploadProvider>
                    </PublicLinksProvider>
                </PublicSessionProvider>
            </SharesProvider>
        </VolumesProvider>
    );
}
