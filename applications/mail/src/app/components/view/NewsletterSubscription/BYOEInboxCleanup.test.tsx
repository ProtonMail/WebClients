import { fireEvent, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { FeatureCode } from '@proton/features/interface';
import { getFeatureFlagsState } from '@proton/features/testing/features';

import { mailTestRender } from '../../../helpers/tests/render';
import useFinishedBYOEImportSenders from '../../../hooks/useFinishedBYOEImportSenders';
import * as newsletterSelectors from '../../../store/newsletterSubscriptions/newsletterSubscriptionsSelector';
import { BYOEInboxCleanup } from './BYOEInboxCleanup';
import { generateSubscriptionList } from './testData';

vi.mock('../../../store/newsletterSubscriptions/newsletterSubscriptionsSelector', async () => ({
    ...(await vi.importActual('../../../store/newsletterSubscriptions/newsletterSubscriptionsSelector')),
    allSubscriptionCount: vi.fn(),
    selectTabLoadingState: vi.fn(),
}));

const mockedSubscriptionCount = newsletterSelectors.allSubscriptionCount as unknown as Mock;
const mockedTabLoading = newsletterSelectors.selectTabLoadingState as unknown as Mock;

const TITLE = 'Your Gmail newsletters, now easier to manage';

const senders = generateSubscriptionList(2);

interface RenderOptions {
    introductionSeen?: boolean;
}

const render = (ui = <BYOEInboxCleanup />, { introductionSeen }: RenderOptions = {}) => {
    const features =
        introductionSeen === undefined
            ? {}
            : getFeatureFlagsState([[FeatureCode.NewsletterSubscriptionViewOnboarding, introductionSeen]]);
    return mailTestRender(ui, { preloadedState: { features } as any });
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

describe('BYOEInboxCleanup', () => {
    beforeEach(() => {
        vi.mocked(useFinishedBYOEImportSenders).mockReset();
        mockedSubscriptionCount.mockReturnValue(3);
        mockedTabLoading.mockReturnValue(false);
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
