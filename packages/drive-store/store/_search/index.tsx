import { SpotlightProvider } from '../../components/useSpotlight';
import { SearchLibraryProvider } from './useSearchLibrary';
import { SearchResultsProvider } from './useSearchResults';

export { default as useSearchLibrary } from './useSearchLibrary';
export { default as useSearchResults } from './useSearchResults';

export function SearchProvider({ children }: { children: React.ReactNode }) {
    return (
        <SearchLibraryProvider>
            <SearchResultsProvider>
                <SpotlightProvider>{children}</SpotlightProvider>
            </SearchResultsProvider>
        </SearchLibraryProvider>
    );
}
