import { PublicSessionProvider } from '../store/_api/usePublicSession';
import { DriveEventManagerProvider } from '../store/_events/useDriveEventManager';
import { InvitationsStateProvider } from '../store/_invitations/useInvitationsState';
import { LinksProvider, PublicLinksProvider } from '../store/_links/index';
import { SharesProvider } from '../store/_shares/index';

export const DriveStoreProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <DriveEventManagerProvider>
            <SharesProvider>
                <LinksProvider>
                    <InvitationsStateProvider>{children}</InvitationsStateProvider>
                </LinksProvider>
            </SharesProvider>
        </DriveEventManagerProvider>
    );
};

/**
 * A provider for the public app that utilizes authenticated drive store providers.
 * Used when you are in a public context but we find a user session.
 */
export const PublicDriveStoreProviderWithAuthenticatedUser = ({ children }: { children: React.ReactNode }) => {
    return (
        <SharesProvider>
            <LinksProvider>
                <PublicSessionProvider>
                    <PublicLinksProvider>
                        <InvitationsStateProvider>{children}</InvitationsStateProvider>
                    </PublicLinksProvider>
                </PublicSessionProvider>
            </LinksProvider>
        </SharesProvider>
    );
};

export const PublicDriveStoreProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <SharesProvider>
            <PublicSessionProvider>
                <PublicLinksProvider>{children}</PublicLinksProvider>
            </PublicSessionProvider>
        </SharesProvider>
    );
};
