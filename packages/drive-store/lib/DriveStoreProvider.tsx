import { PublicSessionProvider } from '../store/_api/usePublicSession';
import { DevicesProvider } from '../store/_devices';
import { DriveEventManagerProvider } from '../store/_events/useDriveEventManager';
import { InvitationsStateProvider } from '../store/_invitations/useInvitationsState';
import { LinksProvider, PublicLinksProvider } from '../store/_links/index';
import { SharesProvider } from '../store/_shares/index';
import { VolumesProvider } from '../store/_volumes';

export const DriveStoreProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <DriveEventManagerProvider>
            <VolumesProvider>
                <SharesProvider>
                    <LinksProvider>
                        <DevicesProvider>
                            <InvitationsStateProvider>{children}</InvitationsStateProvider>
                        </DevicesProvider>
                    </LinksProvider>
                </SharesProvider>
            </VolumesProvider>
        </DriveEventManagerProvider>
    );
};

/**
 * A provider for the public app that utilizes authenticated drive store providers.
 * Used when you are in a public context but we find a user session.
 */
export const PublicDriveStoreProviderWithAuthenticatedUser = ({ children }: { children: React.ReactNode }) => {
    return (
        <VolumesProvider>
            <SharesProvider>
                <LinksProvider>
                    <DevicesProvider>
                        <PublicSessionProvider>
                            <PublicLinksProvider>
                                <InvitationsStateProvider>{children}</InvitationsStateProvider>
                            </PublicLinksProvider>
                        </PublicSessionProvider>
                    </DevicesProvider>
                </LinksProvider>
            </SharesProvider>
        </VolumesProvider>
    );
};

export const PublicDriveStoreProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <VolumesProvider>
            <SharesProvider>
                <PublicSessionProvider>
                    <PublicLinksProvider>{children}</PublicLinksProvider>
                </PublicSessionProvider>
            </SharesProvider>
        </VolumesProvider>
    );
};
