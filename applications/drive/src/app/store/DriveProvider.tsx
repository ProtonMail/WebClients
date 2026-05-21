import type { ReactNode } from 'react';

import { DevicesProvider } from './_devices';
import { DownloadsProvider } from './_downloads';
import { DriveEventManagerProvider } from './_events';
import { InvitationsStateProvider } from './_invitations/useInvitationsState';
import { LinksProvider } from './_links';
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
                                        <InvitationsStateProvider>{children}</InvitationsStateProvider>
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
