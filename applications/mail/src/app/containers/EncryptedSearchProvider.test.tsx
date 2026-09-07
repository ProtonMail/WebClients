import { screen, waitFor } from '@testing-library/react';

import * as esIDB from '@proton/encrypted-search/esIDB';
import { useIndexedDBSupport } from '@proton/encrypted-search/useIndexedDBSupport';
import { mockUseFlag } from '@proton/testing/lib/mockUseFlag';

import { deferred } from '../contentSearch/integration/testFakes';
import { mailTestRender } from '../helpers/tests/render';
import EncryptedSearchProvider, { useEncryptedSearchContext } from './EncryptedSearchProvider';

jest.mock('@proton/encrypted-search/useIndexedDBSupport', () => ({
    useIndexedDBSupport: jest.fn(),
}));

jest.mock('@proton/encrypted-search/esIDB', () => ({
    ...jest.requireActual('@proton/encrypted-search/esIDB'),
    hasESDB: jest.fn(),
    contentIndexingProgress: { read: jest.fn() },
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
            jest.mocked(esIDB.hasESDB).mockResolvedValue(true);
            jest.mocked(esIDB.contentIndexingProgress.read).mockResolvedValue(undefined);
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
            jest.mocked(esIDB.hasESDB).mockResolvedValue(false);

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
