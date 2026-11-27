import { act, fireEvent, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import useDrawer from '@proton/components/hooks/drawer/useDrawer';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { mockDefaultBreakpoints } from '@proton/components/testing/mockUseActiveBreakpoint';
import { FeatureCode } from '@proton/features/interface';
import { getFeatureFlagsState } from '@proton/features/testing/features';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';

import { mailTestRender } from '../../../helpers/tests/render';
import useBYOEInboxCleanupConfirm from '../../../hooks/useBYOEInboxCleanupConfirm';
import useFinishedBYOEImportSenders from '../../../hooks/useFinishedBYOEImportSenders';
import { selectAliasSpotlightDue } from '../../../store/layout/layoutSliceSelectors';
import * as newsletterSelectors from '../../../store/newsletterSubscriptions/newsletterSubscriptionsSelector';
import { BYOEInboxCleanup } from './BYOEInboxCleanup';
import type { BYOEInboxCleanupOutcome } from './interface';
import { generateSubscriptionList } from './testData';

vi.mock('../../../hooks/useBYOEInboxCleanupConfirm', () => ({ __esModule: true, default: vi.fn() }));
vi.mock('@proton/components/hooks/useActiveBreakpoint', () => ({ __esModule: true, default: vi.fn() }));
vi.mock('@proton/components/hooks/drawer/useDrawer', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    default: vi.fn(),
}));
vi.mock('../../../store/newsletterSubscriptions/newsletterSubscriptionsSelector', async () => ({
    ...(await vi.importActual('../../../store/newsletterSubscriptions/newsletterSubscriptionsSelector')),
    allSubscriptionCount: vi.fn(),
    selectTabLoadingState: vi.fn(),
}));

const mockedSubscriptionCount = newsletterSelectors.allSubscriptionCount as unknown as Mock;
const mockedTabLoading = newsletterSelectors.selectTabLoadingState as unknown as Mock;

const TITLE = 'Your Gmail newsletters, now easier to manage';
const SUCCESS_TITLE = 'Your inbox just got lighter';

const senders = generateSubscriptionList(2);

interface RenderOptions {
    introductionSeen?: boolean;
    /** `BYOEInboxCleanupAliasSpotlight`: true until the alias spotlight has shown */
    aliasSpotlightNotShown?: boolean;
}

const render = (ui = <BYOEInboxCleanup />, { introductionSeen, aliasSpotlightNotShown = true }: RenderOptions = {}) => {
    const flags: Parameters<typeof getFeatureFlagsState>[0] = [
        [FeatureCode.BYOEInboxCleanupAliasSpotlight, aliasSpotlightNotShown],
    ];
    if (introductionSeen !== undefined) {
        flags.push([FeatureCode.NewsletterSubscriptionViewOnboarding, introductionSeen]);
    }
    return mailTestRender(ui, { preloadedState: { features: getFeatureFlagsState(flags) } as any });
};

const finishClosing = () => {
    const closingModal = document.querySelector('.modal-two--out');
    if (closingModal) {
        // Mail's jsdom has no AnimationEvent, so fireEvent.animationEnd would drop the animation name
        const event = new Event('animationend', { bubbles: true });
        Object.assign(event, { animationName: 'anime-modal-two-out' });
        fireEvent(closingModal, event);
    }
};

interface DrawerOptions {
    showDrawerSidebar?: boolean;
    appInView?: DRAWER_NATIVE_APPS;
}

const mockDrawer = ({ showDrawerSidebar = true, appInView }: DrawerOptions = {}) => {
    vi.mocked(useDrawer).mockReturnValue({ showDrawerSidebar, appInView } as unknown as ReturnType<typeof useDrawer>);
};

const mockScreen = (small: boolean) => {
    vi.mocked(useActiveBreakpoint).mockReturnValue({
        ...mockDefaultBreakpoints,
        viewportWidth: { ...mockDefaultBreakpoints.viewportWidth, '<=small': small },
    });
};

const mockConfirm = (...outcomes: BYOEInboxCleanupOutcome[]) => {
    const confirm = vi.fn();
    outcomes.forEach((outcome) => {
        confirm.mockResolvedValueOnce(outcome);
    });
    vi.mocked(useBYOEInboxCleanupConfirm).mockReturnValue(confirm);
};

const pressUnsubscribe = async () => {
    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /^Unsubscribe from/ }));
    });
};

const closeSuccessWindow = () => {
    fireEvent.click(screen.getByRole('button', { name: 'Go to my inbox' }));
    finishClosing();
};

describe('BYOEInboxCleanup', () => {
    beforeEach(() => {
        vi.mocked(useFinishedBYOEImportSenders).mockReset();
        mockedSubscriptionCount.mockReturnValue(3);
        mockedTabLoading.mockReturnValue(false);
        mockDrawer();
        mockScreen(false);
    });

    it('opens the window once the senders are ready', async () => {
        vi.mocked(useFinishedBYOEImportSenders).mockReturnValue(senders);
        await render(undefined, { introductionSeen: true });

        expect(await screen.findByRole('heading', { name: TITLE })).toBeInTheDocument();
    });

    it("doesn't open the window while there are no senders", async () => {
        vi.mocked(useFinishedBYOEImportSenders).mockReturnValue(undefined);
        await render(undefined, { introductionSeen: true });

        expect(screen.queryByRole('heading', { name: TITLE })).not.toBeInTheDocument();
    });

    it("after Skip it doesn't reopen on the next render", async () => {
        vi.mocked(useFinishedBYOEImportSenders).mockReturnValue(senders);
        const { rerender } = await render(undefined, { introductionSeen: true });
        await screen.findByRole('heading', { name: TITLE });

        fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
        finishClosing();
        await rerender(<BYOEInboxCleanup />);

        expect(screen.queryByRole('heading', { name: TITLE })).not.toBeInTheDocument();
    });

    it('when the cleanup window closes with senders unsubscribed, the success window opens with them and stays open once the cleanup window has gone', async () => {
        vi.mocked(useFinishedBYOEImportSenders).mockReturnValue(senders);
        vi.mocked(useBYOEInboxCleanupConfirm).mockReturnValue(
            vi.fn(() => {
                return Promise.resolve({ allDone: false, unsubscribed: senders.slice(0, 1) });
            })
        );
        await render(undefined, { introductionSeen: true });
        await screen.findByRole('heading', { name: TITLE });

        fireEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /^Unsubscribe from/ }));
        });
        fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
        finishClosing();

        expect(screen.queryByRole('heading', { name: TITLE })).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: SUCCESS_TITLE })).toBeInTheDocument();
        expect(screen.getByText(new RegExp(`You've unsubscribed from ${senders[0].Name}\\.`))).toBeInTheDocument();
    });

    describe('the alias spotlight after the success window', () => {
        const openCleanupWindow = async ({ aliasSpotlightNotShown = true } = {}) => {
            vi.mocked(useFinishedBYOEImportSenders).mockReturnValue(senders);
            const view = await render(undefined, { introductionSeen: true, aliasSpotlightNotShown });
            await screen.findByRole('heading', { name: TITLE });
            fireEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));
            return view;
        };

        it('is set due when the success window closes after every ticked sender was unsubscribed', async () => {
            mockConfirm({ allDone: true, unsubscribed: senders });
            const { store } = await openCleanupWindow();

            await pressUnsubscribe();
            finishClosing();
            await screen.findByRole('heading', { name: SUCCESS_TITLE });

            expect(selectAliasSpotlightDue(store.getState())).toBe(false);

            closeSuccessWindow();

            expect(selectAliasSpotlightDue(store.getState())).toBe(true);
        });

        it('is set due after a retry that finishes the senders that failed the first time', async () => {
            mockConfirm(
                { allDone: false, unsubscribed: senders.slice(0, 1) },
                { allDone: true, unsubscribed: senders }
            );
            const { store } = await openCleanupWindow();

            await pressUnsubscribe();
            await pressUnsubscribe();
            finishClosing();
            await screen.findByRole('heading', { name: SUCCESS_TITLE });
            closeSuccessWindow();

            expect(selectAliasSpotlightDue(store.getState())).toBe(true);
        });

        it("isn't set once it has already shown, even after another full cleanup", async () => {
            mockConfirm({ allDone: true, unsubscribed: senders });
            const { store } = await openCleanupWindow({ aliasSpotlightNotShown: false });

            await pressUnsubscribe();
            finishClosing();
            await screen.findByRole('heading', { name: SUCCESS_TITLE });
            closeSuccessWindow();

            expect(selectAliasSpotlightDue(store.getState())).toBe(false);
        });

        it("isn't set when the cleanup window was closed after some senders failed", async () => {
            mockConfirm({ allDone: false, unsubscribed: senders.slice(0, 1) });
            const { store } = await openCleanupWindow();

            await pressUnsubscribe();
            fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
            finishClosing();
            await screen.findByRole('heading', { name: SUCCESS_TITLE });
            closeSuccessWindow();

            expect(selectAliasSpotlightDue(store.getState())).toBe(false);
        });

        it("isn't set when Security center is already open", async () => {
            mockDrawer({ appInView: DRAWER_NATIVE_APPS.SECURITY_CENTER });
            mockConfirm({ allDone: true, unsubscribed: senders });
            const { store } = await openCleanupWindow();

            await pressUnsubscribe();
            finishClosing();
            await screen.findByRole('heading', { name: SUCCESS_TITLE });
            closeSuccessWindow();

            expect(selectAliasSpotlightDue(store.getState())).toBe(false);
        });

        it('is set when another drawer app is open', async () => {
            mockDrawer({ appInView: DRAWER_NATIVE_APPS.CONTACTS });
            mockConfirm({ allDone: true, unsubscribed: senders });
            const { store } = await openCleanupWindow();

            await pressUnsubscribe();
            finishClosing();
            await screen.findByRole('heading', { name: SUCCESS_TITLE });
            closeSuccessWindow();

            expect(selectAliasSpotlightDue(store.getState())).toBe(true);
        });

        it("isn't set on a small screen, where it can't render", async () => {
            mockScreen(true);
            mockConfirm({ allDone: true, unsubscribed: senders });
            const { store } = await openCleanupWindow();

            await pressUnsubscribe();
            finishClosing();
            await screen.findByRole('heading', { name: SUCCESS_TITLE });
            closeSuccessWindow();

            expect(selectAliasSpotlightDue(store.getState())).toBe(false);
        });

        it("isn't set when the side panel is hidden", async () => {
            mockDrawer({ showDrawerSidebar: false });
            mockConfirm({ allDone: true, unsubscribed: senders });
            const { store } = await openCleanupWindow();

            await pressUnsubscribe();
            finishClosing();
            await screen.findByRole('heading', { name: SUCCESS_TITLE });
            closeSuccessWindow();

            expect(selectAliasSpotlightDue(store.getState())).toBe(false);
        });
    });

    describe('whether the view is ready to show it', () => {
        it("is not ready while the introduction feature hasn't loaded", async () => {
            await render();

            expect(useFinishedBYOEImportSenders).toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupModal, false);
            expect(useFinishedBYOEImportSenders).not.toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupModal, true);
        });

        it("is not ready while the introduction hasn't been seen and the list has newsletters", async () => {
            await render(undefined, { introductionSeen: false });

            expect(useFinishedBYOEImportSenders).not.toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupModal, true);
        });

        it('is ready once the introduction has been seen', async () => {
            await render(undefined, { introductionSeen: true });

            expect(vi.mocked(useFinishedBYOEImportSenders).mock.lastCall).toEqual([
                FeatureCode.BYOEInboxCleanupModal,
                true,
            ]);
        });

        it('is ready when the list has loaded empty, as the introduction only shows with newsletters', async () => {
            mockedSubscriptionCount.mockReturnValue(0);
            await render(undefined, { introductionSeen: false });

            expect(vi.mocked(useFinishedBYOEImportSenders).mock.lastCall).toEqual([
                FeatureCode.BYOEInboxCleanupModal,
                true,
            ]);
        });

        it('is not ready while the list is still loading', async () => {
            mockedSubscriptionCount.mockReturnValue(0);
            mockedTabLoading.mockReturnValue(true);
            await render(undefined, { introductionSeen: false });

            expect(useFinishedBYOEImportSenders).not.toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupModal, true);
        });
    });

    it("a window that throws while rendering renders nothing and doesn't break the view", async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        // Senders the window can't read make it throw while rendering
        vi.mocked(useFinishedBYOEImportSenders).mockReturnValue({} as any);

        await render(
            <>
                <BYOEInboxCleanup />
                <p>Mailing lists</p>
            </>,
            { introductionSeen: true }
        );

        expect(screen.getByText('Mailing lists')).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: TITLE })).not.toBeInTheDocument();
        consoleError.mockRestore();
    });
});
