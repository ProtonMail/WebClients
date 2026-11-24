import type * as ReactModule from 'react';

import { act, render, screen, waitFor } from '@testing-library/react';
import type { MockInstance } from 'vitest';

import { availableAppsActions } from '@proton/account/availableApps';
import type { ProtonDriveClient } from '@proton/drive/sdk';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import { mockUseFlag } from '@proton/unleash/testing/mockUseFlag';

import { getStoreWrapper } from '../helpers/tests/render';
import { MailDriveProvider, useMailDrive } from './MailDriveProvider';

vi.mock('@proton/shared/lib/helpers/sentry', async () => ({
    ...(await vi.importActual('@proton/shared/lib/helpers/sentry')),
    traceInitiativeError: vi.fn(),
}));

const mockDriveClient = { name: 'drive client' } as unknown as ProtonDriveClient;
const mockStarterMounted = vi.fn();
let mockStartError: Error | undefined;

// Stands in for the lazily loaded starter: each mount counts as Drive's code being loaded and started.
// It fails while rendering, as Vitest's happy-dom lets an error thrown in an effect escape the error boundary.
vi.mock('./DriveStarter', async () => {
    const { useEffect } = await vi.importActual<typeof ReactModule>('react');
    const MockDriveStarter = ({ onReady }: { onReady: (drive: ProtonDriveClient) => void }) => {
        if (mockStartError) {
            mockStarterMounted();
            throw mockStartError;
        }
        useEffect(() => {
            mockStarterMounted();
            onReady(mockDriveClient);
        }, [onReady]);
        return null;
    };
    return { __esModule: true, default: MockDriveStarter };
});

let readDrive: ProtonDriveClient | null = null;

const DriveReader = () => {
    const { drive, isDriveAvailable } = useMailDrive();
    readDrive = drive;
    return <span>{isDriveAvailable ? 'available' : 'unavailable'}</span>;
};

const renderProvider = async (availableApps: APP_NAMES[]) => {
    const { Wrapper, store } = getStoreWrapper({ preloadedState: { availableApps } });
    await act(async () => {
        render(
            <Wrapper>
                <MailDriveProvider>
                    <DriveReader />
                </MailDriveProvider>
            </Wrapper>
        );
    });
    return store;
};

const setAvailableApps = async (store: Awaited<ReturnType<typeof renderProvider>>, apps: APP_NAMES[]) => {
    await act(async () => {
        store.dispatch(availableAppsActions.set(apps));
    });
};

const withDrive = [APPS.PROTONMAIL, APPS.PROTONDRIVE];
const withoutDrive = [APPS.PROTONMAIL];

describe('MailDriveProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockStartError = undefined;
        readDrive = null;
        mockUseFlag(true);
    });

    it('never loads the starter and stays unavailable when the flag is off, even with Drive in the app list', async () => {
        mockUseFlag(false);

        await renderProvider(withDrive);

        expect(mockStarterMounted).not.toHaveBeenCalled();
        expect(screen.getByText('unavailable')).toBeInTheDocument();
        expect(readDrive).toBeNull();
    });

    it('loads the starter once and offers its client when the flag is on and Drive is in the app list', async () => {
        await renderProvider(withDrive);

        await waitFor(() => expect(screen.getByText('available')).toBeInTheDocument());
        expect(readDrive).toBe(mockDriveClient);
        expect(mockStarterMounted).toHaveBeenCalledTimes(1);
    });

    it('never loads the starter when the app list lacks Drive', async () => {
        await renderProvider(withoutDrive);

        expect(mockStarterMounted).not.toHaveBeenCalled();
        expect(screen.getByText('unavailable')).toBeInTheDocument();
    });

    it('stays unavailable with an empty app list, then loads the starter once Drive appears in it', async () => {
        const store = await renderProvider([]);

        expect(mockStarterMounted).not.toHaveBeenCalled();
        expect(screen.getByText('unavailable')).toBeInTheDocument();

        await setAvailableApps(store, withDrive);

        await waitFor(() => expect(screen.getByText('available')).toBeInTheDocument());
        expect(mockStarterMounted).toHaveBeenCalledTimes(1);
    });

    it('turns unavailable when Drive leaves the app list after the client was offered', async () => {
        const store = await renderProvider(withDrive);
        await waitFor(() => expect(screen.getByText('available')).toBeInTheDocument());

        await setAvailableApps(store, withoutDrive);

        expect(screen.getByText('unavailable')).toBeInTheDocument();
        expect(readDrive).toBeNull();
    });

    describe('when Drive fails to start', () => {
        let consoleError: MockInstance;

        beforeEach(() => {
            mockStartError = new Error('Drive failed to start');
            // React and the error boundary both log the expected failure, so keep it out of the test output.
            consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        });

        afterEach(() => {
            consoleError.mockRestore();
        });

        it('keeps Mail rendered, stays unavailable and reports to Sentry under Save to Drive when the starter throws', async () => {
            await renderProvider(withDrive);

            await waitFor(() => expect(mockStarterMounted).toHaveBeenCalled());
            expect(screen.getByText('unavailable')).toBeInTheDocument();
            expect(traceInitiativeError).toHaveBeenCalledWith(SentryMailInitiatives.SAVE_TO_DRIVE, mockStartError);
        });

        it('does not load the starter again after a failure when Drive leaves and returns to the app list', async () => {
            const store = await renderProvider(withDrive);
            await waitFor(() => expect(traceInitiativeError).toHaveBeenCalled());
            // React retries a render that throws, so count the attempts made before Drive leaves the list
            const attemptsBeforeLeaving = mockStarterMounted.mock.calls.length;

            await setAvailableApps(store, withoutDrive);
            await setAvailableApps(store, withDrive);

            expect(mockStarterMounted).toHaveBeenCalledTimes(attemptsBeforeLeaving);
            expect(screen.getByText('unavailable')).toBeInTheDocument();
        });
    });

    it('says unavailable outside the provider', () => {
        render(<DriveReader />);

        expect(screen.getByText('unavailable')).toBeInTheDocument();
        expect(readDrive).toBeNull();
    });
});
