import { LinksKeysProvider } from './useLinksKeys';
import { LinksListingProvider, PublicLinksListingProvider } from './useLinksListing';
import { LinksStateProvider } from './useLinksState';

export * from './interface';
export * from './link';
export * from './validation';
export { encryptFileExtendedAttributes, encryptFolderExtendedAttributes } from './extendedAttributes';
export { default as useLink } from './useLink';
export { default as useLinks } from './useLinks';
export { default as useLinkActions } from './useLinkActions';
export { default as useLinksActions } from './useLinksActions';
export { useLinksListing, usePublicLinksListing } from './useLinksListing';
export { useLinksQueue } from './useLinksQueue';

export function LinksProvider({ children }: { children: React.ReactNode }) {
    return (
        <LinksStateProvider>
            <LinksKeysProvider>
                <LinksListingProvider>{children}</LinksListingProvider>
            </LinksKeysProvider>
        </LinksStateProvider>
    );
}

export function PublicLinksProvider({ children }: { children: React.ReactNode }) {
    return (
        <LinksStateProvider>
            <LinksKeysProvider>
                <PublicLinksListingProvider>{children}</PublicLinksListingProvider>
            </LinksKeysProvider>
        </LinksStateProvider>
    );
}
