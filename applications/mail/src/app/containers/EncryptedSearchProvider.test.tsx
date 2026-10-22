import { screen, waitFor } from '@testing-library/react';

import { hasESDB } from '@proton/encrypted-search/esIDB/indexedDB';
import { contentIndexingProgress } from '@proton/encrypted-search/esIDB/indexingProgress';
import { useIndexedDBSupport } from '@proton/encrypted-search/useIndexedDBSupport';
import { mockUseFlag } from '@proton/unleash/testing/mockUseFlag';

import { deferred } from '../contentSearch/integration/testFakes';
import { mailTestRender } from '../helpers/tests/render';
import EncryptedSearchProvider, { useEncryptedSearchContext } from './EncryptedSearchProvider';

jest.mock('@proton/encrypted-search/useIndexedDBSupport', () => ({
    useIndexedDBSupport: jest.fn(),
}));

jest.mock('@proton/encrypted-search/esIDB/indexedDB', () => ({
    ...jest.requireActual('@proton/encrypted-search/esIDB/indexedDB'),
    hasESDB: jest.fn(),
}));

jest.mock('@proton/encrypted-search/esIDB/indexingProgress', () => ({
    ...jest.requireActual('@proton/encrypted-search/esIDB/indexingProgress'),
    contentIndexingProgress: { read: jest.fn() },
}));

jest.mock('@proton/encrypted-search/esIDB/metadata', () => ({
    ...jest.requireActual('@proton/encrypted-search/esIDB/metadata'),
    wrappedGetOldestInfo: jest.fn().mockResolvedValue(undefined),
}));

const initializeES = jest.fn();
const enableEncryptedSearch = jest.fn();

// Both engines are stubbed: what is under test is when the provider decides searches may run, not
// what either engine does to get there.
const esLibraryFunctions = {
    esStatus: {},
    esIndexingProgressState: {},
    progressRecorderRef: { current: [0, 0] },
    initializeES: (...args: any[]) => initializeES(...args),
    enableEncryptedSearch: (...args: any[]) => enableEncryptedSearch(...args),
    enableContentSearch: jest.fn().mockResolvedValue(undefined),
    handleEvent: jest.fn(),
    esDelete: jest.fn().mockResolvedValue(undefined),
    toggleEncryptedSearch: jest.fn(),
};

jest.mock('@proton/encrypted-search/useEncryptedSearch', () => ({
    useEncryptedSearch: () => esLibraryFunctions,
}));

jest.mock('../contentSearch/integration/useContentSearch', () => ({
    useContentSearch: () => esLibraryFunctions,
}));

jest.mock('../hooks/useContentSearchReadyNotification', () => ({
    useContentSearchReadyNotification: (_status: unknown, enableContentSearch: unknown) => enableContentSearch,
}));

const StartupSettled = () => {
    const { esStatus } = useEncryptedSearchContext();
    return <span>{esStatus.isStartupSettled ? 'settled' : 'waiting'}</span>;
};

const renderProvider = () =>
    mailTestRender(
        <EncryptedSearchProvider>
            <StartupSettled />
        </EncryptedSearchProvider>
    );

const expectSettled = () => waitFor(() => expect(screen.getByText('settled')).toBeInTheDocument());

describe('EncryptedSearchProvider', () => {
    // Search waits for this flag, so no path may leave it unset - not an unavailable database, not a
    // startup that fails, and not one that runs for as long as an index takes to build.
    describe('isStartupSettled', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            mockUseFlag(false);
            jest.mocked(useIndexedDBSupport).mockReturnValue({ isSupported: true, error: null });
            jest.mocked(hasESDB).mockResolvedValue(true);
            jest.mocked(contentIndexingProgress.read).mockResolvedValue(undefined);
            initializeES.mockResolvedValue(undefined);
            enableEncryptedSearch.mockResolvedValue(false);
        });

        it('should wait while IndexedDB support is still being probed', async () => {
            jest.mocked(useIndexedDBSupport).mockReturnValue({ isSupported: null, error: null });

            await renderProvider();

            expect(screen.getByText('waiting')).toBeInTheDocument();
            expect(initializeES).not.toHaveBeenCalled();
        });

        it('should settle without initialising when IndexedDB is unavailable', async () => {
            jest.mocked(useIndexedDBSupport).mockReturnValue({ isSupported: false, error: 'nope' });

            await renderProvider();

            await expectSettled();
            expect(initializeES).not.toHaveBeenCalled();
        });

        it('should settle when there is no database to initialise', async () => {
            jest.mocked(hasESDB).mockResolvedValue(false);

            await renderProvider();

            await expectSettled();
        });

        it('should settle once startup finishes', async () => {
            await renderProvider();

            await expectSettled();
            expect(initializeES).toHaveBeenCalled();
        });

        it('should settle when startup fails', async () => {
            initializeES.mockRejectedValue(new Error('startup blew up'));

            await renderProvider();

            await expectSettled();
        });

        // The reason `initializeES` reports through a callback at all: it only returns once an index it
        // resumed has been built, which is far too long to hold a search for.
        it('should settle on the report, without waiting for startup to return', async () => {
            const neverEnds = deferred<void>();
            initializeES.mockImplementation(({ onStateSettled }: any) => {
                onStateSettled?.({ dbExists: true, esEnabled: true, contentIndexingDone: true });
                return neverEnds.promise;
            });

            await renderProvider();

            await expectSettled();
        });
    });
});
