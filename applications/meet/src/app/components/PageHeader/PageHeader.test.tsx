import { MemoryRouter, Router } from 'react-router-dom';

import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';

import { selectIsGuest } from '@proton/meet/store/slices/userSlice';

import { PageHeader } from './PageHeader';

const mocks = vi.hoisted(() => ({
    isSignInTruncated: false,
    isGuest: true,
    isRecordingSupported: true,
}));

vi.mock('./useIsTextTruncated', () => ({
    useIsTextTruncated: () => ({ ref: () => {}, isTruncated: mocks.isSignInTruncated }),
}));

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetSelector: (selector: unknown) => (selector === selectIsGuest ? mocks.isGuest : undefined),
}));

vi.mock('../../hooks/useMeetingRecorder/hooks/useIsRecordingSupported', () => ({
    useIsRecordingSupported: () => mocks.isRecordingSupported,
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
    SettingsDropdown: () => <button type="button">Settings</button>,
}));

const renderHeaderAt = (pathname: string, { isGuest }: { isGuest: boolean }) => {
    mocks.isGuest = isGuest;
    window.history.pushState({}, '', pathname);
    const history = createMemoryHistory({ initialEntries: [pathname] });
    render(
        <Router history={history}>
            <PageHeader showAppSwitcher={false} />
        </Router>
    );
    return { history };
};

const openMoreOptions = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: 'More options' }));
    return screen.getByRole('dialog', { name: 'More options' });
};

const menuRowNames = (menu: HTMLElement) =>
    within(menu)
        .getAllByRole('button')
        .filter((row) => row.closest('li'))
        .map((row) => row.textContent);

const finishClosingHelpDialog = () => {
    const modalRoot = screen.getByRole('dialog', { name: 'Help and feedback' }).closest('.modal-two') as Element;
    fireEvent.animationEnd(modalRoot, { animationName: 'anime-modal-two-out' });
};

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

const arrowDownTo = async (user: ReturnType<typeof userEvent.setup>, element: HTMLElement) => {
    while (document.activeElement !== element) {
        await user.keyboard('{ArrowDown}');
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
    const initialPathname = window.location.pathname;

    beforeAll(() => {
        const style = document.createElement('style');
        style.textContent = 'dialog { display: block; }';
        document.head.appendChild(style);
    });

    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        mocks.isGuest = true;
        mocks.isRecordingSupported = true;
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        window.history.pushState({}, '', initialPathname);
    });

    it('gives a guest on the join page a More options menu with only Help and feedback, instead of the Help and feedback button', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        renderHeaderAt('/join', { isGuest: true });

        expect(screen.queryByRole('button', { name: 'Help and feedback' })).not.toBeInTheDocument();

        const menu = await openMoreOptions(user);
        expect(menuRowNames(menu)).toEqual(['Help and feedback']);

        await user.click(within(menu).getByRole('button', { name: 'Help and feedback' }));
        expect(screen.getByRole('dialog', { name: 'Help and feedback' })).toBeInTheDocument();
    });

    it('returns focus to More options when a keyboard user closes the Help and feedback dialog opened from it', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        renderHeaderAt('/join', { isGuest: true });

        await tabTo(user, 'More options');
        await user.keyboard('{Enter}');
        const menu = screen.getByRole('dialog', { name: 'More options' });
        await arrowDownTo(user, within(menu).getByRole('button', { name: 'Help and feedback' }));
        await user.keyboard('{Enter}');

        const helpDialog = screen.getByRole('dialog', { name: 'Help and feedback' });
        expect(helpDialog).toContainElement(document.activeElement as HTMLElement);

        await user.keyboard('{Escape}');
        finishClosingHelpDialog();

        expect(screen.queryByRole('dialog', { name: 'Help and feedback' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'More options' })).toHaveFocus();
    });

    it('lists Manage recordings then Help and feedback for a signed-in user on the join page when recording is supported', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        const { history } = renderHeaderAt('/join', { isGuest: false });

        const menu = await openMoreOptions(user);
        expect(menuRowNames(menu)).toEqual(['Manage recordings', 'Help and feedback']);

        await user.click(within(menu).getByRole('button', { name: 'Manage recordings' }));
        expect(history.location.pathname).toBe('/manage-recordings');
    });

    it('lists only Help and feedback for a signed-in user on the join page when recording is not supported', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        mocks.isRecordingSupported = false;
        renderHeaderAt('/join', { isGuest: false });

        const menu = await openMoreOptions(user);
        expect(menuRowNames(menu)).toEqual(['Help and feedback']);
    });

    it('shows More options instead of the settings menu to a signed-in user on the join page', () => {
        renderHeaderAt('/join', { isGuest: false });

        expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Settings' })).not.toBeInTheDocument();
    });

    it('keeps the settings menu and no More options menu for a signed-in user on the dashboard', () => {
        renderHeaderAt('/dashboard', { isGuest: false });

        expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'More options' })).not.toBeInTheDocument();
    });

    it('keeps the Help and feedback button and no More options menu for a guest on the dashboard', () => {
        renderHeaderAt('/dashboard', { isGuest: true });

        expect(screen.getByRole('button', { name: 'Help and feedback' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'More options' })).not.toBeInTheDocument();
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
