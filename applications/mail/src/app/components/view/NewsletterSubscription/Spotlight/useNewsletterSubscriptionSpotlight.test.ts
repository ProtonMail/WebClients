import { renderHook } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { useFlag } from '@proton/unleash/useFlag';

import { useNewsletterSubscriptions } from '../../../../store/newsletterSubscriptions/hook';
import { useNewsletterSubscriptionSpotlight } from './useNewsletterSubscriptionSpotlight';

vi.mock('@proton/unleash/useFlag');
vi.mock('@proton/account/user/hooks', () => ({ useUser: vi.fn() }));
vi.mock('@proton/account/welcomeFlags', () => ({ useWelcomeFlags: vi.fn() }));
vi.mock('@proton/features/useFeature', () => ({ __esModule: true, default: vi.fn() }));
vi.mock('@proton/components/hooks/useSpotlightOnFeature', () => ({ __esModule: true, default: vi.fn() }));
vi.mock('@proton/components/components/spotlight/useSpotlightShow', () => ({
    __esModule: true,
    default: vi.fn(),
}));
vi.mock('../../../../store/newsletterSubscriptions/hook', () => ({ useNewsletterSubscriptions: vi.fn() }));

interface SetupOptions {
    enabled: boolean;
    // The BYOE spotlight code's value, or `undefined` while it loads
    byoeSpotlightDue: boolean | undefined;
}

const getInitialShow = () => {
    return vi.mocked(useSpotlightOnFeature).mock.lastCall?.[1];
};

const setup = ({ enabled, byoeSpotlightDue }: SetupOptions) => {
    vi.mocked(useFlag).mockImplementation((name) => {
        return name === 'InboxBringYourOwnEmailCleanup' && enabled;
    });
    vi.mocked(useFeature).mockImplementation((code) => {
        if (code !== FeatureCode.BYOEInboxCleanupSpotlight) {
            return { feature: undefined, loading: true } as any;
        }
        const loading = byoeSpotlightDue === undefined;
        return { feature: loading ? undefined : { Value: byoeSpotlightDue }, loading } as any;
    });
    renderHook(() => useNewsletterSubscriptionSpotlight());
};

describe('useNewsletterSubscriptionSpotlight', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useUser).mockReturnValue([{ CreateTime: 1_600_000_000 }] as any);
        vi.mocked(useWelcomeFlags).mockReturnValue({ welcomeFlags: { isDone: true } } as any);
        vi.mocked(useNewsletterSubscriptions).mockReturnValue([
            { tabs: { active: { totalCount: 8 }, unsubscribe: { totalCount: 2 } } },
        ] as any);
        vi.mocked(useSpotlightOnFeature).mockReturnValue({ show: false, onDisplayed: vi.fn(), onClose: vi.fn() });
        vi.mocked(useSpotlightShow).mockImplementation((show) => show);
    });

    it('fetches the BYOE spotlight code only when the cleanup is on', () => {
        setup({ enabled: true, byoeSpotlightDue: false });
        expect(useFeature).toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupSpotlight, true);

        setup({ enabled: false, byoeSpotlightDue: false });
        expect(useFeature).toHaveBeenLastCalledWith(FeatureCode.BYOEInboxCleanupSpotlight, false);
    });

    it('not offered while the BYOE spotlight is due and the cleanup is on', () => {
        setup({ enabled: true, byoeSpotlightDue: true });

        expect(getInitialShow()).toBe(false);
    });

    it('not offered while the BYOE spotlight code is still loading and the cleanup is on', () => {
        setup({ enabled: true, byoeSpotlightDue: undefined });

        expect(getInitialShow()).toBe(false);
    });

    it("offered as today when the BYOE spotlight isn't due", () => {
        setup({ enabled: true, byoeSpotlightDue: false });

        expect(getInitialShow()).toBe(true);
    });

    it('offered as today when the cleanup is off, even with the BYOE spotlight due', () => {
        setup({ enabled: false, byoeSpotlightDue: true });

        expect(getInitialShow()).toBe(true);
    });
});
