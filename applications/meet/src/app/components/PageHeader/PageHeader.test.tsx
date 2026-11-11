import { MemoryRouter } from 'react-router-dom';

import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { selectIsGuest } from '@proton/meet/store/slices/userSlice';

import { PageHeader } from './PageHeader';

const mocks = vi.hoisted(() => ({
    isSignInTruncated: false,
}));

vi.mock('./useIsTextTruncated', () => ({
    useIsTextTruncated: () => ({ ref: () => {}, isTruncated: mocks.isSignInTruncated }),
}));

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetSelector: (selector: unknown) => (selector === selectIsGuest ? true : undefined),
}));

vi.mock('@proton/meet/telemetry/meetTelemetry', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    sendMeetDashboardEvent: vi.fn(),
}));

vi.mock('@proton/components/containers/app/AppsDropdown', () => ({
    default: () => null,
    UnAuthenticatedAppsDropdown: () => null,
}));

vi.mock('@proton/components/containers/heading/UserDropdown', () => ({
    default: () => null,
}));

vi.mock('./SettingsDropdown', () => ({
    SettingsDropdown: () => null,
}));

vi.mock('../../hooks/useHelpAndFeedback', () => ({
    useHelpAndFeedback: () => ({ openHelpAndFeedback: vi.fn(), modals: null }),
}));

const renderGuestHeader = ({ isSignInTruncated }: { isSignInTruncated: boolean }) => {
    mocks.isSignInTruncated = isSignInTruncated;
    const header = <PageHeader showAppSwitcher={false} />;
    const { rerender } = render(<MemoryRouter>{header}</MemoryRouter>);
    return {
        setSignInTruncated: (isTruncated: boolean) => {
            mocks.isSignInTruncated = isTruncated;
            rerender(<MemoryRouter>{header}</MemoryRouter>);
        },
    };
};

const tabTo = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
    while (document.activeElement !== screen.getByRole('button', { name })) {
        await user.tab();
    }
};

const finishClosingTooltips = () => {
    act(() => {
        vi.advanceTimersByTime(250);
    });
    screen
        .queryAllByRole('tooltip')
        .forEach((tooltip) => fireEvent.animationEnd(tooltip, { animationName: 'anime-tooltip-out-last' }));
};

describe('PageHeader', () => {
    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('shows the full Sign in label in a tooltip when a keyboard user reaches the truncated button', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        renderGuestHeader({ isSignInTruncated: true });

        await tabTo(user, 'Sign in');

        expect(screen.getByRole('tooltip', { name: 'Sign in' })).toBeVisible();
    });

    it('shows no tooltip on the Sign in button when its label fits', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        renderGuestHeader({ isSignInTruncated: false });

        await tabTo(user, 'Sign in');

        expect(screen.queryByRole('tooltip', { name: 'Sign in' })).not.toBeInTheDocument();
    });

    it('does not reopen the Sign in tooltip by itself after the label fits and then truncates again', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        const { setSignInTruncated } = renderGuestHeader({ isSignInTruncated: true });

        await tabTo(user, 'Sign in');
        expect(screen.getByRole('tooltip', { name: 'Sign in' })).toBeVisible();

        setSignInTruncated(false);
        finishClosingTooltips();
        expect(screen.queryByRole('tooltip', { name: 'Sign in' })).not.toBeInTheDocument();

        await user.tab();
        expect(screen.getByRole('button', { name: 'Sign in' })).not.toHaveFocus();

        setSignInTruncated(true);
        expect(screen.queryByRole('tooltip', { name: 'Sign in' })).not.toBeInTheDocument();
    });
});
