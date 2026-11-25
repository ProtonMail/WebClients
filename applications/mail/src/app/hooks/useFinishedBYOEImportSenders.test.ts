import { act, renderHook } from '@testing-library/react';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import { ApiImportProvider, ApiImporterState, ApiReportState } from '@proton/activation/src/api/api.interface';
import { ImportType } from '@proton/activation/src/interface';
import { loadReports } from '@proton/activation/src/logic/reports/reports.actions';
import type { ReportsState } from '@proton/activation/src/logic/reports/reports.interface';
import {
    selectReportEntriesByDate,
    selectReportsLoading,
} from '@proton/activation/src/logic/reports/reports.selectors';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { mockUseApi } from '@proton/app-context/testing/mockUseApi';
import type { Feature } from '@proton/features/interface';
import { FeatureCode } from '@proton/features/interface';
import { updateFeature } from '@proton/features/reducer';
import useFeature from '@proton/features/useFeature';
import { ADDRESS_FLAGS } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';
import { useFlag } from '@proton/unleash/useFlag';

import { fetchSendersIfStillDue } from '../helpers/byoeInboxCleanup';
import { useMailDispatch } from '../store/hooks';
import useFinishedBYOEImportSenders from './useFinishedBYOEImportSenders';

vi.mock('./useFinishedBYOEImportSenders', async () => ({
    __esModule: true,
    ...(await vi.importActual('./useFinishedBYOEImportSenders')),
}));
vi.mock('@proton/unleash/useFlag');
vi.mock('@proton/account/addresses/hooks', () => ({ useAddresses: vi.fn() }));
vi.mock('@proton/account/welcomeFlags', () => ({ useWelcomeFlags: vi.fn() }));
vi.mock('@proton/activation/src/logic/store', () => ({
    useEasySwitchDispatch: vi.fn(),
    useEasySwitchSelector: vi.fn(),
}));
vi.mock('@proton/activation/src/logic/reports/reports.actions', () => ({
    loadReports: vi.fn(() => ({ type: 'loadReports' })),
}));
vi.mock('@proton/features/reducer', () => ({ updateFeature: vi.fn() }));
vi.mock('@proton/features/useFeature', () => ({ __esModule: true, default: vi.fn() }));
vi.mock('../store/hooks', () => ({ useMailDispatch: vi.fn() }));
vi.mock('../helpers/byoeInboxCleanup', async () => ({
    ...(await vi.importActual('../helpers/byoeInboxCleanup')),
    fetchSendersIfStillDue: vi.fn(),
}));

const CONNECTION_TIME_BYOE = 1_700_000_000;
const byoeAddress = { ID: 'byoe', Email: 'test@gmail.com', Flags: ADDRESS_FLAGS.BYOE } as Address;

type ReportEntry = ReturnType<typeof selectReportEntriesByDate>[number];

let entryCount = 0;
const buildEntry = (state: ApiImporterState, endDate = CONNECTION_TIME_BYOE + 600): ReportEntry => {
    entryCount += 1;
    const reportID = `report-${entryCount}`;
    return {
        report: {
            ID: reportID,
            state: ApiReportState.SENT,
            account: byoeAddress.Email,
            startDate: endDate - 1200,
            endDate,
            size: 0,
            provider: ApiImportProvider.GOOGLE,
        },
        summary: {
            localID: `${reportID}-${ImportType.MAIL}`,
            reportID,
            product: ImportType.MAIL,
            state,
            size: 0,
            rollbackState: undefined,
        },
    };
};

interface EasySwitchState {
    loading: ReportsState['loading'];
    entries: ReportEntry[];
}

type CleanupFeature = Partial<Feature<boolean>>;

// The value Mail loaded, as `useFeature` returns it
const store: { feature: CleanupFeature | undefined } = { feature: undefined };
const easySwitch: EasySwitchState = { loading: 'idle', entries: [] };
// The caller's feature code, and whether it's ready to show what it offers, as it hands them to the hook
const view: { code: FeatureCode.BYOEInboxCleanupModal | FeatureCode.BYOEInboxCleanupSpotlight; canShow: boolean } = {
    code: FeatureCode.BYOEInboxCleanupModal,
    canShow: true,
};
const dueFeature: CleanupFeature = { Value: true, UpdateTime: CONNECTION_TIME_BYOE };

const mockWriteFeature = vi.fn(async (value: boolean) => {
    store.feature = { ...store.feature, Value: value };
    return value;
});
const mockMailDispatch = vi.fn((action: { value: boolean }) => {
    return mockWriteFeature(action.value);
});
const mockEasySwitchDispatch = vi.fn();
const mockApi = vi.fn();
const senders = [{ ID: 'sender-1' }, { ID: 'sender-2' }] as NewsletterSubscription[];

const settle = async () => {
    await act(async () => {
        for (let i = 0; i < 10; i++) {
            await Promise.resolve();
        }
    });
};

interface SetupOptions {
    enabled?: boolean;
    feature?: CleanupFeature;
}

const setup = ({ enabled = true, feature = dueFeature }: SetupOptions = {}) => {
    store.feature = feature;
    vi.mocked(useFlag).mockImplementation((name) => {
        return name === 'InboxBringYourOwnEmailCleanup' && enabled;
    });

    return renderHook(() => useFinishedBYOEImportSenders(view.code, view.canShow));
};

// Holds the fresh read and senders load until the returned function answers it
const holdLoad = () => {
    let resolveLoad = (_subscriptions: NewsletterSubscription[] | undefined) => {};
    vi.mocked(fetchSendersIfStillDue).mockImplementationOnce(() => {
        return new Promise((resolve) => {
            resolveLoad = resolve;
        });
    });
    return async (subscriptions: NewsletterSubscription[] | undefined) => {
        resolveLoad(subscriptions);
        await settle();
    };
};

// Like `updateFeature`: the new value is stored straight away, and the old one is put back when the request fails
const failNextWrite = () => {
    mockWriteFeature.mockImplementationOnce(async (value: boolean) => {
        store.feature = { ...store.feature, Value: value };
        throw new Error('offline');
    });
};

const putValueBack = async (rerender: () => void) => {
    rerender();
    await settle();
    store.feature = dueFeature;
    rerender();
    await settle();
};

describe('useFinishedBYOEImportSenders', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        easySwitch.loading = 'idle';
        easySwitch.entries = [];
        view.code = FeatureCode.BYOEInboxCleanupModal;
        view.canShow = true;

        vi.mocked(useFeature).mockImplementation(() => {
            return { feature: store.feature } as any;
        });
        vi.mocked(updateFeature).mockImplementation((_code, value) => ({ type: 'updateFeature', value }) as any);
        vi.mocked(useMailDispatch).mockReturnValue(mockMailDispatch as any);
        vi.mocked(useEasySwitchDispatch).mockReturnValue(mockEasySwitchDispatch as any);
        vi.mocked(useEasySwitchSelector).mockImplementation((selector: unknown) => {
            if (selector === selectReportsLoading) {
                return easySwitch.loading;
            }
            if (selector === selectReportEntriesByDate) {
                return easySwitch.entries;
            }
            return undefined;
        });
        vi.mocked(useAddresses).mockReturnValue([[byoeAddress], false] as any);
        vi.mocked(useWelcomeFlags).mockReturnValue({ welcomeFlags: { isDone: true } } as any);
        vi.mocked(fetchSendersIfStillDue).mockResolvedValue(senders);
        mockUseApi(mockApi);
    });

    it("doesn't load the cleanup feature or do anything when the kill switch is off, even with a cleanup due and the import finished", async () => {
        easySwitch.entries = [buildEntry(ApiImporterState.DONE)];
        const { result } = setup({ enabled: false });
        await settle();

        expect(useFeature).toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupModal, false);
        expect(mockEasySwitchDispatch).not.toHaveBeenCalled();
        expect(fetchSendersIfStillDue).not.toHaveBeenCalled();
        expect(updateFeature).not.toHaveBeenCalled();
        expect(result.current).toBeUndefined();
    });

    it('loads the cleanup feature when the kill switch is on', async () => {
        setup();
        await settle();

        expect(useFeature).toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupModal, true);
    });

    it('loads the import reports when a cleanup is due and they are idle', async () => {
        setup();
        await settle();

        expect(loadReports).toHaveBeenCalledTimes(1);
        expect(mockEasySwitchDispatch).toHaveBeenCalledWith({ type: 'loadReports' });
    });

    it.each(['pending', 'success', 'failed'] as const)(
        "doesn't load the import reports again once they're %s",
        async (loading) => {
            easySwitch.loading = loading;
            setup();
            await settle();

            expect(mockEasySwitchDispatch).not.toHaveBeenCalled();
        }
    );

    it('loads nothing more when nothing is due', async () => {
        setup({ feature: { Value: false, UpdateTime: CONNECTION_TIME_BYOE } });
        await settle();

        expect(mockEasySwitchDispatch).not.toHaveBeenCalled();
        expect(fetchSendersIfStillDue).not.toHaveBeenCalled();
        expect(updateFeature).not.toHaveBeenCalled();
    });

    it('clears the cleanup straight away when the import failed', async () => {
        vi.mocked(useWelcomeFlags).mockReturnValue({ welcomeFlags: { isDone: false } } as any);
        easySwitch.loading = 'success';
        easySwitch.entries = [buildEntry(ApiImporterState.FAILED)];
        setup();
        await settle();

        expect(updateFeature).toHaveBeenCalledTimes(1);
        expect(updateFeature).toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupModal, false);
        expect(fetchSendersIfStillDue).not.toHaveBeenCalled();
    });

    it('still clears a failed import before the view can show the window', async () => {
        view.canShow = false;
        easySwitch.loading = 'success';
        easySwitch.entries = [buildEntry(ApiImporterState.FAILED)];
        setup();
        await settle();

        expect(updateFeature).toHaveBeenCalledTimes(1);
        expect(updateFeature).toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupModal, false);
    });

    it("doesn't clear again when clearing after a failed import fails and the value comes back", async () => {
        failNextWrite();
        easySwitch.loading = 'success';
        easySwitch.entries = [buildEntry(ApiImporterState.FAILED)];
        const { rerender } = setup();
        await settle();
        await putValueBack(rerender);

        expect(updateFeature).toHaveBeenCalledTimes(1);
    });

    it("leaves the cleanup due while the import hasn't finished", async () => {
        easySwitch.loading = 'success';
        easySwitch.entries = [buildEntry(ApiImporterState.RUNNING)];
        setup();
        await settle();

        expect(fetchSendersIfStillDue).not.toHaveBeenCalled();
        expect(updateFeature).not.toHaveBeenCalled();
    });

    it('returns the senders once the import reports show the import finished, without a reload', async () => {
        easySwitch.loading = 'success';
        easySwitch.entries = [buildEntry(ApiImporterState.RUNNING)];
        const { result, rerender } = setup();
        await settle();

        expect(result.current).toBeUndefined();

        easySwitch.entries = [buildEntry(ApiImporterState.DONE)];
        rerender();
        await settle();

        expect(result.current).toBeDefined();
    });

    it('returns the senders once the cleanup is marked due in this tab, without a reload', async () => {
        easySwitch.loading = 'success';
        easySwitch.entries = [buildEntry(ApiImporterState.DONE)];
        const { result, rerender } = setup({ feature: { Value: false } });
        await settle();

        expect(result.current).toBeUndefined();

        store.feature = dueFeature;
        rerender();
        await settle();

        expect(result.current).toBeDefined();
    });

    describe("with the Mailing lists spotlight's code", () => {
        beforeEach(() => {
            view.code = FeatureCode.BYOEInboxCleanupSpotlight;
            easySwitch.loading = 'success';
        });

        it('reads, checks fresh and returns the senders on that code', async () => {
            easySwitch.entries = [buildEntry(ApiImporterState.DONE)];
            const { result } = setup();
            await settle();

            expect(useFeature).toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupSpotlight, true);
            expect(useFeature).not.toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupModal, expect.anything());
            expect(fetchSendersIfStillDue).toHaveBeenCalledWith(
                mockMailDispatch,
                mockApi,
                FeatureCode.BYOEInboxCleanupSpotlight
            );
            expect(result.current).toBe(senders);
        });

        it('clears that code when the import failed', async () => {
            easySwitch.entries = [buildEntry(ApiImporterState.CANCELED)];
            setup();
            await settle();

            expect(updateFeature).toHaveBeenCalledTimes(1);
            expect(updateFeature).toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupSpotlight, false);
        });

        it('clears that code when there are no senders', async () => {
            easySwitch.entries = [buildEntry(ApiImporterState.DONE)];
            vi.mocked(fetchSendersIfStillDue).mockResolvedValue([]);
            setup();
            await settle();

            expect(updateFeature).toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupSpotlight, false);
        });
    });

    describe('when the import finished', () => {
        beforeEach(() => {
            easySwitch.loading = 'success';
            easySwitch.entries = [buildEntry(ApiImporterState.DONE)];
        });

        it('loads the senders if the code is still due, returns them and leaves the cleanup for the window to clear', async () => {
            const { result } = setup();
            await settle();

            expect(fetchSendersIfStillDue).toHaveBeenCalledWith(
                mockMailDispatch,
                mockApi,
                FeatureCode.BYOEInboxCleanupModal
            );
            expect(result.current).toBe(senders);
            expect(updateFeature).not.toHaveBeenCalled();
        });

        it('clears the cleanup and returns nothing when there are no senders', async () => {
            vi.mocked(fetchSendersIfStillDue).mockResolvedValue([]);
            const { result } = setup();
            await settle();

            expect(updateFeature).toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupModal, false);
            expect(result.current).toBeUndefined();
        });

        it("returns nothing and leaves it alone when the fresh read says it isn't due any more", async () => {
            vi.mocked(fetchSendersIfStillDue).mockResolvedValue(undefined);
            const { result } = setup();
            await settle();

            expect(result.current).toBeUndefined();
            expect(updateFeature).not.toHaveBeenCalled();
        });

        it('returns nothing and leaves it due when a request fails', async () => {
            vi.mocked(fetchSendersIfStillDue).mockRejectedValue(new Error('offline'));
            const { result } = setup();
            await settle();

            expect(result.current).toBeUndefined();
            expect(updateFeature).not.toHaveBeenCalled();
        });

        it("waits while onboarding isn't done, and returns the senders once it's done with nothing else changing", async () => {
            vi.mocked(useWelcomeFlags).mockReturnValue({ welcomeFlags: { isDone: false } } as any);
            const { result, rerender } = setup();
            await settle();

            expect(fetchSendersIfStillDue).not.toHaveBeenCalled();

            vi.mocked(useWelcomeFlags).mockReturnValue({ welcomeFlags: { isDone: true } } as any);
            rerender();
            await settle();

            expect(result.current).toBeDefined();
        });

        it("waits while the view can't show the window yet, then returns the senders once it can", async () => {
            view.canShow = false;
            const { result, rerender } = setup();
            await settle();

            expect(fetchSendersIfStillDue).not.toHaveBeenCalled();
            expect(updateFeature).not.toHaveBeenCalled();

            view.canShow = true;
            rerender();
            await settle();

            expect(result.current).toBeDefined();
        });

        it('ignores a load that finishes after the view stopped being ready, and leaves it due', async () => {
            const finishLoad = holdLoad();
            const { result, rerender } = setup();
            await settle();

            view.canShow = false;
            rerender();
            await settle();
            await finishLoad(senders);

            expect(result.current).toBeUndefined();
            expect(updateFeature).not.toHaveBeenCalled();
        });

        it("doesn't clear the code when unmounted before a load with no senders finishes", async () => {
            const finishLoad = holdLoad();
            const { unmount } = setup();
            await settle();

            unmount();
            await finishLoad([]);

            expect(updateFeature).not.toHaveBeenCalled();
        });

        it("doesn't load the senders again when a report change leaves the import finished", async () => {
            const { result, rerender } = setup();
            await settle();

            easySwitch.entries = [...easySwitch.entries, buildEntry(ApiImporterState.RUNNING)];
            rerender();
            await settle();

            expect(fetchSendersIfStillDue).toHaveBeenCalledTimes(1);
            expect(result.current).toBe(senders);
        });

        it('shows a second connection made in the same tab on the next visit, not in the same one', async () => {
            const { result, rerender, unmount } = setup();
            await settle();

            const secondConnectionTime = CONNECTION_TIME_BYOE + 86_400;
            store.feature = { Value: true, UpdateTime: secondConnectionTime };
            easySwitch.entries = [buildEntry(ApiImporterState.DONE, secondConnectionTime + 600)];
            rerender();
            await settle();

            expect(fetchSendersIfStillDue).toHaveBeenCalledTimes(1);
            expect(result.current).toBe(senders);

            unmount();
            const nextVisit = renderHook(() => useFinishedBYOEImportSenders(view.code, view.canShow));
            await settle();

            expect(fetchSendersIfStillDue).toHaveBeenCalledTimes(2);
            expect(nextVisit.result.current).toBeDefined();
        });
    });
});
