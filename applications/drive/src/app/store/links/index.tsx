import { LinksKeysProvider } from './useLinksKeys';
import { LinksListingProvider } from './useLinksListing';
import { LinksStateProvider } from './useLinksState';

export * from './interface';
export * from './link';
export * from './validation';
export { ecryptFileExtendedAttributes, ecryptFolderExtendedAttributes } from './extendedAttributes';
export { default as useLink } from './useLink';
export { default as useLinkActions } from './useLinkActions';
export { default as useLinksActions } from './useLinksActions';
export { default as useLinksListing } from './useLinksListing';

export function LinksProvider({ children }: { children: React.ReactNode }) {
    return (
        <LinksStateProvider>
            <LinksKeysProvider>
                <LinksListingProvider>{children}</LinksListingProvider>
            </LinksKeysProvider>
        </LinksStateProvider>
    );
}
