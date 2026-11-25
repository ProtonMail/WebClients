import { act, renderHook } from '@testing-library/react';

import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import type { Feature } from '@proton/features/interface';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';
import { useFlag } from '@proton/unleash/useFlag';

import useFinishedBYOEImportSenders from '../../../../hooks/useFinishedBYOEImportSenders';
import { useBYOEInboxCleanupSpotlight } from './useBYOEInboxCleanupSpotlight';

vi.mock('@proton/unleash/useFlag');
vi.mock('@proton/features/useFeature', () => ({ __esModule: true, default: vi.fn() }));
vi.mock('@proton/components/hooks/useSpotlightOnFeature', () => ({ __esModule: true, default: vi.fn() }));
vi.mock('@proton/components/components/spotlight/useSpotlightShow', () => ({
    __esModule: true,
    default: vi.fn(),
}));

interface MailingListsOnboarding {
    feature?: Partial<Feature<boolean>>;
    loading?: boolean;
}

const senders = [{ ID: 'sender-1' }] as NewsletterSubscription[];
// What the shared hook returns, and the Mailing lists welcome value as `useFeature` returns it
const state: { senders: NewsletterSubscription[] | undefined; onboarding: MailingListsOnboarding } = {
    senders: undefined,
    onboarding: {},
};

const mockOnDisplayed = vi.fn();
const mockOnClose = vi.fn();
const mockUpdateNewsletterSpotlight = vi.fn();

const getInitialShow = () => {
    return vi.mocked(useSpotlightOnFeature).mock.lastCall?.[1];
};

const settle = async () => {
    await act(async () => {
        for (let i = 0; i < 10; i++) {
            await Promise.resolve();
        }
    });
};

const setup = ({ enabled = true }: { enabled?: boolean } = {}) => {
    vi.mocked(useFlag).mockImplementation((name) => {
        return name === 'InboxBringYourOwnEmailCleanup' && enabled;
    });

    return renderHook(() => useBYOEInboxCleanupSpotlight());
};

describe('useBYOEInboxCleanupSpotlight', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        state.senders = senders;
        state.onboarding = { feature: { Value: false }, loading: false };

        vi.mocked(useFinishedBYOEImportSenders).mockImplementation(() => {
            return state.senders;
        });
        vi.mocked(useFeature).mockImplementation((code) => {
            if (code === FeatureCode.NewsletterSubscriptionViewOnboarding) {
                return state.onboarding as any;
            }
            if (code === FeatureCode.NewsletterSubscriptionSpotlight) {
                return { update: mockUpdateNewsletterSpotlight } as any;
            }
            return {} as any;
        });
        vi.mocked(useSpotlightOnFeature).mockImplementation((_code, initialShow) => {
            return { show: !!initialShow, onDisplayed: mockOnDisplayed, onClose: mockOnClose };
        });
        vi.mocked(useSpotlightShow).mockImplementation((show) => show);
        mockUpdateNewsletterSpotlight.mockResolvedValue(undefined);
    });

    it('waits for senders on the BYOEInboxCleanupSpotlight code, with nothing else to wait for', async () => {
        setup();
        await settle();

        expect(useFinishedBYOEImportSenders).toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupSpotlight, true);
    });

    it('offers nothing until there are senders', async () => {
        state.senders = undefined;
        const { result } = setup();
        await settle();

        expect(getInitialShow()).toBe(false);
        expect(result.current.shouldShowSpotlight).toBe(false);
    });

    it('offers the spotlight as soon as there are senders, with no extra delay', async () => {
        const { result } = setup();
        await settle();

        expect(useSpotlightOnFeature).toHaveBeenLastCalledWith(FeatureCode.BYOEInboxCleanupSpotlight, true);
        expect(useSpotlightShow).toHaveBeenLastCalledWith(true, 0);
        expect(result.current.shouldShowSpotlight).toBe(true);
        expect(result.current.onClose).toBe(mockOnClose);
    });

    it.each([
        { version: 'Meet Mailing lists', introductionSeen: false },
        { version: 'Your Gmail newsletters are here', introductionSeen: true },
    ])(
        "displaying the $version version clears its own code and stops Mail's Mailing lists spotlight for good",
        async ({ introductionSeen }) => {
            state.onboarding = { feature: { Value: introductionSeen }, loading: false };
            const { result } = setup();
            await settle();

            expect(useFeature).toHaveBeenCalledWith(FeatureCode.NewsletterSubscriptionSpotlight, false);
            expect(mockUpdateNewsletterSpotlight).not.toHaveBeenCalled();

            act(() => {
                result.current.onDisplayed();
            });

            expect(mockOnDisplayed).toHaveBeenCalledTimes(1);
            expect(mockUpdateNewsletterSpotlight).toHaveBeenCalledTimes(1);
            expect(mockUpdateNewsletterSpotlight).toHaveBeenCalledWith(false);
        }
    );

    it("a failed write for Mail's Mailing lists spotlight doesn't break displaying it", async () => {
        mockUpdateNewsletterSpotlight.mockRejectedValue(new Error('offline'));
        const { result } = setup();
        await settle();

        act(() => {
            result.current.onDisplayed();
        });
        await settle();

        expect(mockOnDisplayed).toHaveBeenCalledTimes(1);
        expect(result.current.shouldShowSpotlight).toBe(true);
    });

    describe('whether someone is new to Mailing lists', () => {
        it('reads the Mailing lists welcome value only when the cleanup is on', async () => {
            setup({ enabled: false });
            await settle();

            expect(useFeature).toHaveBeenCalledWith(FeatureCode.NewsletterSubscriptionViewOnboarding, false);
        });

        it("is new until they've closed the Mailing lists welcome window", async () => {
            const { result } = setup();
            await settle();

            expect(useFeature).toHaveBeenCalledWith(FeatureCode.NewsletterSubscriptionViewOnboarding, true);
            expect(result.current.shouldShowSpotlight).toBe(true);
            expect(result.current.isNewToMailingLists).toBe(true);
        });

        it("isn't new once they've closed the Mailing lists welcome window", async () => {
            state.onboarding = { feature: { Value: true }, loading: false };
            const { result } = setup();
            await settle();

            expect(result.current.shouldShowSpotlight).toBe(true);
            expect(result.current.isNewToMailingLists).toBe(false);
        });

        it('waits for the Mailing lists welcome value before offering the spotlight', async () => {
            state.onboarding = { feature: undefined, loading: true };
            const { result, rerender } = setup();
            await settle();

            expect(getInitialShow()).toBe(false);
            expect(result.current.shouldShowSpotlight).toBe(false);

            state.onboarding = { feature: { Value: true }, loading: false };
            rerender();
            await settle();

            expect(getInitialShow()).toBe(true);
            expect(result.current.isNewToMailingLists).toBe(false);
        });
    });
});
