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

import { useMailGlobalModals } from '../containers/globalModals/globalModalContext';
import type { BYOEInboxCleanupModalPayload } from '../containers/globalModals/inteface';
import { ModalType } from '../containers/globalModals/inteface';
import { loadSendersWhenFree } from '../helpers/byoeInboxCleanup';
import { useMailDispatch } from '../store/hooks';
import useBYOEInboxCleanupConfirm from './useBYOEInboxCleanupConfirm';
import useShowBYOEInboxCleanupModal from './useShowBYOEInboxCleanupModal';

jest.mock('./useShowBYOEInboxCleanupModal', () => ({
    __esModule: true,
    ...jest.requireActual('./useShowBYOEInboxCleanupModal'),
}));
jest.mock('@proton/unleash/useFlag');
jest.mock('@proton/account/addresses/hooks', () => ({ useAddresses: jest.fn() }));
jest.mock('@proton/account/welcomeFlags', () => ({ useWelcomeFlags: jest.fn() }));
jest.mock('@proton/activation/src/logic/store', () => ({
    useEasySwitchDispatch: jest.fn(),
    useEasySwitchSelector: jest.fn(),
}));
jest.mock('@proton/activation/src/logic/reports/reports.actions', () => ({
    loadReports: jest.fn(() => ({ type: 'loadReports' })),
}));
jest.mock('@proton/features/reducer', () => ({ updateFeature: jest.fn() }));
jest.mock('@proton/features/useFeature', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../store/hooks', () => ({ useMailDispatch: jest.fn() }));
jest.mock('../containers/globalModals/globalModalContext', () => ({ useMailGlobalModals: jest.fn() }));
jest.mock('./useBYOEInboxCleanupConfirm', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../helpers/byoeInboxCleanup', () => ({
    ...jest.requireActual('../helpers/byoeInboxCleanup'),
    loadSendersWhenFree: jest.fn(),
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
const dueFeature: CleanupFeature = { Value: true, UpdateTime: CONNECTION_TIME_BYOE };

const mockWriteFeature = jest.fn(async (value: boolean) => {
    store.feature = { ...store.feature, Value: value };
    return value;
});
const mockMailDispatch = jest.fn((action: { value: boolean }) => {
    return mockWriteFeature(action.value);
});
const mockEasySwitchDispatch = jest.fn();
const mockNotify = jest.fn();
const mockOnConfirm = jest.fn();
const mockCreateConfirm = jest.fn(() => mockOnConfirm);
const mockApi = jest.fn();
const senders = [{ ID: 'sender-1' }, { ID: 'sender-2' }] as NewsletterSubscription[];

const getShownPayload = () => {
    return mockNotify.mock.calls[0][0] as BYOEInboxCleanupModalPayload;
};

const getLoadSignal = (call = 0) => {
    return jest.mocked(loadSendersWhenFree).mock.calls[call][0].signal;
};

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
    jest.mocked(useFlag).mockImplementation((name) => {
        return name === 'InboxBringYourOwnEmailCleanup' && enabled;
    });

    return renderHook(() => useShowBYOEInboxCleanupModal());
};

const holdNextLoad = () => {
    let resolveLoad = (_subscriptions: NewsletterSubscription[] | undefined) => {};
    jest.mocked(loadSendersWhenFree).mockImplementationOnce(() => {
        return new Promise((resolve) => {
            resolveLoad = resolve;
        });
    });
    return (subscriptions: NewsletterSubscription[] | undefined) => {
        resolveLoad(subscriptions);
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

describe('useShowBYOEInboxCleanupModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        easySwitch.loading = 'idle';
        easySwitch.entries = [];

        jest.mocked(useFeature).mockImplementation(() => {
            return { feature: store.feature } as any;
        });
        jest.mocked(updateFeature).mockImplementation((_code, value) => ({ type: 'updateFeature', value }) as any);
        jest.mocked(useMailDispatch).mockReturnValue(mockMailDispatch as any);
        jest.mocked(useEasySwitchDispatch).mockReturnValue(mockEasySwitchDispatch as any);
        jest.mocked(useEasySwitchSelector).mockImplementation((selector: unknown) => {
            if (selector === selectReportsLoading) {
                return easySwitch.loading;
            }
            if (selector === selectReportEntriesByDate) {
                return easySwitch.entries;
            }
            return undefined;
        });
        jest.mocked(useAddresses).mockReturnValue([[byoeAddress], false] as any);
        jest.mocked(useWelcomeFlags).mockReturnValue({ welcomeFlags: { isDone: true } } as any);
        jest.mocked(useMailGlobalModals).mockImplementation(() => {
            return { notify: mockNotify } as any;
        });
        jest.mocked(useBYOEInboxCleanupConfirm).mockReturnValue(mockCreateConfirm);
        jest.mocked(loadSendersWhenFree).mockResolvedValue(senders);
        mockUseApi(mockApi);
    });

    it("doesn't load the cleanup feature or do anything when the kill switch is off, even with a cleanup due and the import finished", async () => {
        easySwitch.entries = [buildEntry(ApiImporterState.DONE)];
        setup({ enabled: false });
        await settle();

        expect(useFeature).toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupModal, false);
        expect(mockEasySwitchDispatch).not.toHaveBeenCalled();
        expect(loadSendersWhenFree).not.toHaveBeenCalled();
        expect(updateFeature).not.toHaveBeenCalled();
        expect(mockNotify).not.toHaveBeenCalled();
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
        expect(loadSendersWhenFree).not.toHaveBeenCalled();
        expect(updateFeature).not.toHaveBeenCalled();
    });

    it('clears the cleanup straight away when the import failed', async () => {
        jest.mocked(useWelcomeFlags).mockReturnValue({ welcomeFlags: { isDone: false } } as any);
        easySwitch.loading = 'success';
        easySwitch.entries = [buildEntry(ApiImporterState.FAILED)];
        setup();
        await settle();

        expect(updateFeature).toHaveBeenCalledTimes(1);
        expect(updateFeature).toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupModal, false);
        expect(loadSendersWhenFree).not.toHaveBeenCalled();
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

        expect(loadSendersWhenFree).not.toHaveBeenCalled();
        expect(updateFeature).not.toHaveBeenCalled();
    });

    it('opens the window once the import reports show the import finished, without a reload', async () => {
        easySwitch.loading = 'success';
        easySwitch.entries = [buildEntry(ApiImporterState.RUNNING)];
        const { rerender } = setup();
        await settle();

        expect(mockNotify).not.toHaveBeenCalled();

        easySwitch.entries = [buildEntry(ApiImporterState.DONE)];
        rerender();
        await settle();

        expect(mockNotify).toHaveBeenCalledTimes(1);
    });

    it('opens the window once the cleanup is marked due in this tab, without a reload', async () => {
        easySwitch.loading = 'success';
        easySwitch.entries = [buildEntry(ApiImporterState.DONE)];
        const { rerender } = setup({ feature: { Value: false } });
        await settle();

        expect(mockNotify).not.toHaveBeenCalled();

        store.feature = dueFeature;
        rerender();
        await settle();

        expect(mockNotify).toHaveBeenCalledTimes(1);
    });

    describe('when the import finished', () => {
        beforeEach(() => {
            easySwitch.loading = 'success';
            easySwitch.entries = [buildEntry(ApiImporterState.DONE)];
        });

        it('loads the senders once the screen is free, then opens the window with them and the cleanup action', async () => {
            setup();
            await settle();

            expect(loadSendersWhenFree).toHaveBeenCalledWith({
                dispatch: mockMailDispatch,
                api: mockApi,
                signal: expect.any(AbortSignal),
            });
            expect(mockNotify).toHaveBeenCalledTimes(1);
            expect(getShownPayload()).toEqual({
                type: ModalType.BYOEInboxCleanup,
                value: { subscriptions: senders, onConfirm: mockOnConfirm, onDisplayed: expect.any(Function) },
            });
            expect(updateFeature).not.toHaveBeenCalled();
        });

        it('clears the cleanup when the window is displayed', async () => {
            setup();
            await settle();

            act(() => {
                getShownPayload().value.onDisplayed();
            });

            expect(updateFeature).toHaveBeenCalledTimes(1);
            expect(updateFeature).toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupModal, false);
        });

        it("doesn't open again when clearing fails and the value comes back", async () => {
            failNextWrite();
            const { rerender } = setup();
            await settle();
            act(() => {
                getShownPayload().value.onDisplayed();
            });
            await settle();
            await putValueBack(rerender);

            expect(loadSendersWhenFree).toHaveBeenCalledTimes(1);
            expect(mockNotify).toHaveBeenCalledTimes(1);
        });

        it('clears and opens nothing when there are no senders', async () => {
            jest.mocked(loadSendersWhenFree).mockResolvedValue([]);
            setup();
            await settle();

            expect(updateFeature).toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupModal, false);
            expect(mockNotify).not.toHaveBeenCalled();
        });

        it("opens nothing and leaves it due when the cleanup was cancelled or isn't due any more", async () => {
            jest.mocked(loadSendersWhenFree).mockResolvedValue(undefined);
            setup();
            await settle();

            expect(mockNotify).not.toHaveBeenCalled();
            expect(updateFeature).not.toHaveBeenCalled();
        });

        it('opens nothing and leaves it due when a request fails', async () => {
            jest.mocked(loadSendersWhenFree).mockRejectedValue(new Error('offline'));
            setup();
            await settle();

            expect(mockNotify).not.toHaveBeenCalled();
            expect(updateFeature).not.toHaveBeenCalled();
        });

        it("waits while onboarding isn't done, and opens once it's done with nothing else changing", async () => {
            jest.mocked(useWelcomeFlags).mockReturnValue({ welcomeFlags: { isDone: false } } as any);
            const { rerender } = setup();
            await settle();

            expect(loadSendersWhenFree).not.toHaveBeenCalled();

            jest.mocked(useWelcomeFlags).mockReturnValue({ welcomeFlags: { isDone: true } } as any);
            rerender();
            await settle();

            expect(mockNotify).toHaveBeenCalledTimes(1);
        });

        it('cancels loading the senders when unmounted', async () => {
            holdNextLoad();
            const { unmount } = setup();
            await settle();

            unmount();

            expect(getLoadSignal().aborted).toBe(true);
        });

        it('keeps loading the senders when notify or the confirm factory change, and opens with the latest ones', async () => {
            const resolveLoad = holdNextLoad();
            const { rerender } = setup();
            await settle();

            const newNotify = jest.fn();
            const newOnConfirm = jest.fn();
            jest.mocked(useMailGlobalModals).mockImplementation(() => {
                return { notify: newNotify } as any;
            });
            jest.mocked(useBYOEInboxCleanupConfirm).mockReturnValue(() => newOnConfirm);
            rerender();
            await settle();
            resolveLoad(senders);
            await settle();

            expect(getLoadSignal().aborted).toBe(false);
            expect(loadSendersWhenFree).toHaveBeenCalledTimes(1);
            expect(mockNotify).not.toHaveBeenCalled();
            expect(newNotify).toHaveBeenCalledTimes(1);
            expect(newNotify.mock.calls[0][0].value.onConfirm).toBe(newOnConfirm);
        });

        it("doesn't load the senders again when a report change leaves the import finished", async () => {
            const { rerender } = setup();
            await settle();

            easySwitch.entries = [...easySwitch.entries, buildEntry(ApiImporterState.RUNNING)];
            rerender();
            await settle();

            expect(loadSendersWhenFree).toHaveBeenCalledTimes(1);
            expect(mockNotify).toHaveBeenCalledTimes(1);
        });

        it('offers a second connection made in the same tab on the next load, not in the same session', async () => {
            const { rerender, unmount } = setup();
            await settle();
            act(() => {
                getShownPayload().value.onDisplayed();
            });
            await settle();

            const secondConnectionTime = CONNECTION_TIME_BYOE + 86_400;
            store.feature = { Value: true, UpdateTime: secondConnectionTime };
            easySwitch.entries = [buildEntry(ApiImporterState.DONE, secondConnectionTime + 600)];
            rerender();
            await settle();

            expect(mockNotify).toHaveBeenCalledTimes(1);

            unmount();
            renderHook(() => useShowBYOEInboxCleanupModal());
            await settle();

            expect(mockNotify).toHaveBeenCalledTimes(2);
        });
    });
});
