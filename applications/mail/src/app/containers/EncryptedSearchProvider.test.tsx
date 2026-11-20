import { Router } from 'react-router-dom';

import { logger } from '@protontech/logger';
import { act, render, screen, waitFor } from '@testing-library/react';
import { createMemoryHistory } from 'history';

import { getModelState } from '@proton/account/testing/getModelState';
import { ApiContext } from '@proton/app-context/apiContext';
import { hasESDB } from '@proton/encrypted-search/esIDB/indexedDB';
import { useIndexedDBSupport } from '@proton/encrypted-search/useIndexedDBSupport';
import { isESEnabledUserChoiceInboxDesktop } from '@proton/shared/lib/desktop/encryptedSearch';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { mockUseFlag } from '@proton/unleash/testing/vitest/mockUseFlag';

import { deferred } from '../contentSearch/integration/import/testFakes';
import { getESFreeBlobKey } from '../helpers/encryptedSearch/esUtils';
import { api } from '../helpers/tests/api';
import { getStoreWrapper } from '../helpers/tests/render';
import EncryptedSearchProvider, { useEncryptedSearchContext } from './EncryptedSearchProvider';

vi.mock('@proton/encrypted-search/useIndexedDBSupport', () => ({
    useIndexedDBSupport: vi.fn(),
}));

vi.mock('@proton/encrypted-search/esIDB/indexedDB', async () => ({
    ...(await vi.importActual('@proton/encrypted-search/esIDB/indexedDB')),
    hasESDB: vi.fn(),
}));

vi.mock('@proton/encrypted-search/esIDB/metadata', async () => ({
    ...(await vi.importActual('@proton/encrypted-search/esIDB/metadata')),
    wrappedGetOldestInfo: vi.fn().mockResolvedValue(undefined),
}));

// Read lazily by the mocks below, so each test can set them.
let mockIsWelcomeFlow = false;
let mockIsESEnabledInbox = false;

vi.mock('@proton/account/welcomeFlags', async () => ({
    ...(await vi.importActual('@proton/account/welcomeFlags')),
    useWelcomeFlags: () => ({ welcomeFlags: { isWelcomeFlow: mockIsWelcomeFlow } }),
}));

vi.mock('../hooks/useISESEnabledElectron', () => ({
    __esModule: true,
    default: () => ({ isESEnabledInbox: mockIsESEnabledInbox }),
}));

// `isElectronMail` is a constant computed from the user agent at import time, so it's swapped through a getter.
// Its value lives inside the factory: other modules read it while the imports are still being evaluated,
// before any `let` in this file is initialised.
vi.mock('@proton/shared/lib/helpers/desktop', async () => {
    const state = { isElectronMail: false };
    return {
        ...(await vi.importActual('@proton/shared/lib/helpers/desktop')),
        get isElectronMail() {
            return state.isElectronMail;
        },
        setMockIsElectronMail: (value: boolean) => {
            state.isElectronMail = value;
        },
    };
});

const { setMockIsElectronMail } = (await vi.importMock('@proton/shared/lib/helpers/desktop')) as unknown as {
    setMockIsElectronMail: (value: boolean) => void;
};

vi.mock('@proton/shared/lib/helpers/browser', async () => ({
    ...(await vi.importActual('@proton/shared/lib/helpers/browser')),
    isMobile: vi.fn(),
}));

vi.mock('@proton/shared/lib/desktop/encryptedSearch', async () => ({
    ...(await vi.importActual('@proton/shared/lib/desktop/encryptedSearch')),
    isESEnabledUserChoiceInboxDesktop: vi.fn(),
}));

const initializeES = vi.fn();
const enableEncryptedSearch = vi.fn();
const enableContentSearch = vi.fn();

// Both engines are stubbed: what is under test is when the provider decides searches may run, not
// what either engine does to get there.
const esLibraryFunctions = {
    esStatus: {},
    esIndexingProgressState: {},
    progressRecorderRef: { current: [0, 0] },
    initializeES: (...args: any[]) => initializeES(...args),
    enableEncryptedSearch: (...args: any[]) => enableEncryptedSearch(...args),
    enableContentSearch: (...args: any[]) => enableContentSearch(...args),
    handleEvent: vi.fn(),
    esDelete: vi.fn().mockResolvedValue(undefined),
    toggleEncryptedSearch: vi.fn(),
};

vi.mock('@proton/encrypted-search/useEncryptedSearch', () => ({
    useEncryptedSearch: () => esLibraryFunctions,
}));

vi.mock('../contentSearch/integration/useContentSearch', () => ({
    useContentSearch: () => esLibraryFunctions,
}));

vi.mock('../hooks/useContentSearchReadyNotification', () => ({
    useContentSearchReadyNotification: (_status: unknown, enableContentSearch: unknown) => enableContentSearch,
}));

const StartupSettled = () => {
    const { esStatus } = useEncryptedSearchContext();
    return <span>{esStatus.isStartupSettled ? 'settled' : 'waiting'}</span>;
};

// Not `mailTestRender`: it already wraps everything in an `EncryptedSearchProvider`, so a second one
// here would run startup twice, and the two would see each other's first-visit flag in localStorage.
const renderProvider = async ({ preloadedState }: Parameters<typeof getStoreWrapper>[0] = {}) => {
    const history = createMemoryHistory({ initialEntries: ['/inbox'] });
    const { Wrapper } = getStoreWrapper({ preloadedState, history });
    // In `act`, so the state updates startup makes once its promises resolve are applied before we look.
    await act(async () => {
        render(
            <Wrapper>
                <ApiContext.Provider value={api}>
                    <Router history={history}>
                        <EncryptedSearchProvider>
                            <StartupSettled />
                        </EncryptedSearchProvider>
                    </Router>
                </ApiContext.Provider>
            </Wrapper>
        );
    });
};

const expectSettled = () => waitFor(() => expect(screen.getByText('settled')).toBeInTheDocument());

describe('EncryptedSearchProvider', () => {
    // Search waits for this flag, so no path may leave it unset - not an unavailable database, not a
    // startup that fails, and not one that runs for as long as an index takes to build.
    describe('isStartupSettled', () => {
        beforeEach(() => {
            vi.clearAllMocks();
            mockUseFlag(false);
            vi.mocked(useIndexedDBSupport).mockReturnValue({ isSupported: true, error: null });
            vi.mocked(hasESDB).mockResolvedValue(true);
            initializeES.mockResolvedValue(undefined);
            enableEncryptedSearch.mockResolvedValue(false);
        });

        it('should wait while IndexedDB support is still being probed', async () => {
            vi.mocked(useIndexedDBSupport).mockReturnValue({ isSupported: null, error: null });

            await renderProvider();

            expect(screen.getByText('waiting')).toBeInTheDocument();
            expect(initializeES).not.toHaveBeenCalled();
        });

        it('should settle without initialising when IndexedDB is unavailable', async () => {
            vi.mocked(useIndexedDBSupport).mockReturnValue({ isSupported: false, error: 'nope' });

            await renderProvider();

            await expectSettled();
            expect(initializeES).not.toHaveBeenCalled();
        });

        it('should settle when there is no database to initialise', async () => {
            vi.mocked(hasESDB).mockResolvedValue(false);

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
            // The failure is expected here, so keep it out of the test output.
            const logError = vi.spyOn(logger, 'error').mockImplementation(() => {});

            await renderProvider();

            await expectSettled();
            expect(logError).toHaveBeenCalledWith(expect.stringContaining('startup blew up'));
            logError.mockRestore();
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

    // Which engine call startup makes. Depending on the device and how the user got here, it either
    // starts indexing on its own, or leaves the decision to the engine through `initializeES`.
    describe('auto-enable', () => {
        const userID = 'userID';
        const freeBlobKey = getESFreeBlobKey(userID);

        const renderWithUser = () =>
            renderProvider({ preloadedState: { user: getModelState({ ID: userID, Flags: {} } as UserModel) } });

        beforeEach(() => {
            vi.clearAllMocks();
            window.localStorage.clear();
            mockUseFlag(false);
            mockIsWelcomeFlow = false;
            mockIsESEnabledInbox = false;
            setMockIsElectronMail(false);
            vi.mocked(isMobile).mockReturnValue(false);
            vi.mocked(isESEnabledUserChoiceInboxDesktop).mockReturnValue(false);
            vi.mocked(useIndexedDBSupport).mockReturnValue({ isSupported: true, error: null });
            vi.mocked(hasESDB).mockResolvedValue(true);
            initializeES.mockResolvedValue(undefined);
            enableEncryptedSearch.mockResolvedValue(true);
            enableContentSearch.mockResolvedValue(undefined);
        });

        describe('with an existing database', () => {
            it('should leave it to the engine when nothing calls for auto-enabling', async () => {
                await renderWithUser();

                await expectSettled();
                expect(initializeES).toHaveBeenCalled();
                expect(enableEncryptedSearch).not.toHaveBeenCalled();
                expect(enableContentSearch).not.toHaveBeenCalled();
            });

            it('should leave it to the engine on the inbox desktop app when the user has not opted in', async () => {
                setMockIsElectronMail(true);
                mockIsESEnabledInbox = true;

                await renderWithUser();

                await expectSettled();
                expect(initializeES).toHaveBeenCalled();
                expect(enableEncryptedSearch).not.toHaveBeenCalled();
            });

            it('should enable search on the inbox desktop app when the user has opted in', async () => {
                setMockIsElectronMail(true);
                mockIsESEnabledInbox = true;
                vi.mocked(isESEnabledUserChoiceInboxDesktop).mockReturnValue(true);

                await renderWithUser();

                await expectSettled();
                expect(enableEncryptedSearch).toHaveBeenCalledWith({ showErrorNotification: false });
                expect(enableContentSearch).toHaveBeenCalledWith({ notify: false });
                expect(initializeES).not.toHaveBeenCalled();
            });
        });

        describe('without a database', () => {
            beforeEach(() => {
                vi.mocked(hasESDB).mockResolvedValue(false);
            });

            it('should leave it to the engine when nothing calls for auto-enabling', async () => {
                await renderWithUser();

                await expectSettled();
                expect(initializeES).toHaveBeenCalled();
                expect(enableEncryptedSearch).not.toHaveBeenCalled();
            });

            // Incognito sessions and one-off logins never get past the first visit, so they never index.
            it('should only remember the first visit on the inbox desktop app', async () => {
                mockIsESEnabledInbox = true;

                await renderWithUser();

                await expectSettled();
                expect(window.localStorage.getItem(freeBlobKey)).toBe('true');
                expect(enableEncryptedSearch).not.toHaveBeenCalled();
                expect(initializeES).not.toHaveBeenCalled();
            });

            it('should start background indexing on a later visit to the inbox desktop app', async () => {
                mockIsESEnabledInbox = true;
                window.localStorage.setItem(freeBlobKey, 'true');

                await renderWithUser();

                await waitFor(() => expect(window.localStorage.getItem(freeBlobKey)).toBeNull());
                expect(enableEncryptedSearch).toHaveBeenCalledWith({ isBackgroundIndexing: true });
                expect(enableContentSearch).toHaveBeenCalledWith({ isBackgroundIndexing: true });
                expect(initializeES).not.toHaveBeenCalled();
            });

            it('should retry on the next visit if background indexing fails to start', async () => {
                mockIsESEnabledInbox = true;
                window.localStorage.setItem(freeBlobKey, 'true');
                enableEncryptedSearch.mockResolvedValue(false);

                await renderWithUser();

                await expectSettled();
                expect(enableEncryptedSearch).toHaveBeenCalledWith({ isBackgroundIndexing: true });
                expect(enableContentSearch).not.toHaveBeenCalled();
                expect(window.localStorage.getItem(freeBlobKey)).toBe('true');
            });

            it('should enable search for a new user on the web', async () => {
                mockIsWelcomeFlow = true;

                await renderWithUser();

                await expectSettled();
                expect(enableEncryptedSearch).toHaveBeenCalledWith({ showErrorNotification: false });
                expect(enableContentSearch).toHaveBeenCalledWith({ notify: false });
                expect(initializeES).not.toHaveBeenCalled();
            });

            it('should not enable search for a new user on mobile', async () => {
                mockIsWelcomeFlow = true;
                vi.mocked(isMobile).mockReturnValue(true);

                await renderWithUser();

                await expectSettled();
                expect(enableEncryptedSearch).not.toHaveBeenCalled();
                expect(initializeES).toHaveBeenCalled();
            });

            it('should not enable search for a new user on the desktop app', async () => {
                mockIsWelcomeFlow = true;
                setMockIsElectronMail(true);

                await renderWithUser();

                await expectSettled();
                expect(enableEncryptedSearch).not.toHaveBeenCalled();
                expect(initializeES).toHaveBeenCalled();
            });
        });
    });
});
