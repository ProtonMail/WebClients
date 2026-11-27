import { PublicSessionProvider } from '../store/_api/usePublicSession';
import { LinksProvider, PublicLinksProvider } from '../store/_links/index';
import { SharesProvider } from '../store/_shares/index';

export const DriveStoreProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <SharesProvider>
            <LinksProvider>{children}</LinksProvider>
        </SharesProvider>
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
                    <PublicLinksProvider>{children}</PublicLinksProvider>
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
