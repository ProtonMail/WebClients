import type { ReactNode } from 'react';

import { SpotlightProvider } from '../components/useSpotlight';
import { DevicesProvider } from './_devices';
import { DriveEventManagerProvider } from './_events';
import { InvitationsStateProvider } from './_invitations/useInvitationsState';
import { LinksProvider } from './_links';
import { SharesProvider } from './_shares';
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
                            <SpotlightProvider>
                                <InvitationsStateProvider>{children}</InvitationsStateProvider>
                            </SpotlightProvider>
                        </DevicesProvider>
                    </LinksProvider>
                </SharesProvider>
            </VolumesProvider>
        </DriveEventManagerProvider>
    );
}
