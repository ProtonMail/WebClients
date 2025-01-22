import type { ReactNode } from 'react';

import { PublicSessionProvider } from './_api';
import { DevicesProvider } from './_devices';
import { DownloadsProvider, PublicDownloadsProvider } from './_downloads';
import { DriveEventManagerProvider } from './_events';
import { InvitationsStateProvider } from './_invitations/useInvitationsState';
import { LinksProvider, PublicLinksProvider } from './_links';
import { PhotosProvider } from './_photos';
import { SearchProvider } from './_search';
import { SharesProvider } from './_shares';
import { UploadProvider } from './_uploads';
import { PublicUploadProvider } from './_uploads/UploadProvider/UploadProvider';
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
                                        {/**TODO: Remove provider if albums enabled as useless */}
                                        <PhotosProvider>
                                            <InvitationsStateProvider>{children}</InvitationsStateProvider>
                                        </PhotosProvider>
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
