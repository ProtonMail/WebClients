import { SearchLibraryProvider } from './useSearchLibrary';
import { SearchResultsProvider } from './useSearchResults';

export { STORE_NAME } from './constants';
export { default as useSearchEnabledFeature } from './useSearchEnabledFeature';
export { default as useSearchLibrary } from './useSearchLibrary';
export { default as useSearchResults } from './useSearchResults';

export function SearchProvider({ children }: { children: React.ReactNode }) {
    return (
        <SearchLibraryProvider>
            <SearchResultsProvider>{children}</SearchResultsProvider>
        </SearchLibraryProvider>
    );
}
