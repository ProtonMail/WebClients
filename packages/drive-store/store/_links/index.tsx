import { LinksKeysProvider } from './useLinksKeys';
import { LinksListingProvider } from './useLinksListing';
import { LinksStateProvider } from './useLinksState';

export * from './interface';
export * from './link';
export * from './validation';
export { default as useLinksActions } from './useLinksActions';

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
            <LinksKeysProvider>{children}</LinksKeysProvider>
        </LinksStateProvider>
    );
}
