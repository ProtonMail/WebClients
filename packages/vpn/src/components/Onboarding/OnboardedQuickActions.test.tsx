import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Onboarding } from '../../../constants/onboarding';
import { OnboardedQuickActions } from './OnboardedQuickActions';

vi.mock('@proton/components/components/link/SettingsLink', () => ({
    __esModule: true,
    default: ({ children, path }: { children: React.ReactNode; path: string }) => <a href={path}>{children}</a>,
}));

const isSpotlightOpen = () => screen.queryByTestId('spotlight-inner') !== null;

describe('OnboardedQuickActions spotlight (show once)', () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.clearAllMocks();
    });

    it('opens the spotlight automatically the first time (no stored state)', () => {
        render(<OnboardedQuickActions onDismiss={vi.fn()} />);

        expect(isSpotlightOpen()).toBe(true);
    });

    it('does not open the spotlight automatically when it was already dismissed in a previous session', () => {
        window.localStorage.setItem(Onboarding.quickActionsKey, JSON.stringify(false));

        render(<OnboardedQuickActions onDismiss={vi.fn()} />);

        expect(isSpotlightOpen()).toBe(false);
    });

    it('persists the dismissal so the spotlight stays closed on the next mount', async () => {
        const { unmount } = render(<OnboardedQuickActions onDismiss={vi.fn()} />);

        expect(isSpotlightOpen()).toBe(true);

        await userEvent.click(screen.getByTestId('spotlight-inner-close-button'));
        expect(isSpotlightOpen()).toBe(false);
        expect(window.localStorage.getItem(Onboarding.quickActionsKey)).toBe(JSON.stringify(false));

        unmount();
        render(<OnboardedQuickActions onDismiss={vi.fn()} />);

        expect(isSpotlightOpen()).toBe(false);
    });

    it('forwards the dismissal to onDismiss and keeps the spotlight from re-opening', async () => {
        const onDismiss = vi.fn();
        const { unmount } = render(<OnboardedQuickActions onDismiss={onDismiss} />);

        await userEvent.click(screen.getByTitle('Dismiss setup checklist'));

        expect(onDismiss).toHaveBeenCalledTimes(1);
        expect(window.localStorage.getItem(Onboarding.quickActionsKey)).toBe(JSON.stringify(false));

        unmount();
        render(<OnboardedQuickActions onDismiss={onDismiss} />);

        expect(isSpotlightOpen()).toBe(false);
    });
});
