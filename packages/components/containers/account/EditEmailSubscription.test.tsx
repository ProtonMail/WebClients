import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { sub } from 'date-fns';
import type { MockedFunction } from 'vitest';

import { useUser } from '@proton/account/user/hooks';
import { userSettingsActions } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { mockUseConfig } from '@proton/app-context/testing/mockUseConfig';
import { useApi } from '@proton/app-context/useApi';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { APPS } from '@proton/shared/lib/constants';
import { NEWSLETTER_SUBSCRIPTIONS_BITS } from '@proton/shared/lib/helpers/newsletter';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

import EditEmailSubscription from './EditEmailSubscription';

vi.mock('@proton/app-context/useApi');
const mockedUseApi = useApi as MockedFunction<any>;
let mockedApi: ReturnType<typeof mockedUseApi>;

vi.mock('../../hooks/useEventManager', () => ({ __esModule: true, default: () => ({ call: vi.fn() }) }));

vi.mock('@proton/redux-shared-store/sharedProvider');
const mockedUseDispatch = useDispatch as MockedFunction<typeof useDispatch>;

vi.mock('@proton/hooks/useLoading', () => ({ __esModule: true, default: () => [false, vi.fn((fn) => fn())] }));

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: vi.fn() }),
}));

vi.mock('@proton/account/user/hooks');
const mockedUseUser = useUser as MockedFunction<any>;

vi.mock('@proton/account/userSettings/hooks');
const mockedUseUserSettings = useUserSettings as MockedFunction<any>;

const user: Partial<UserModel> = {
    CreateTime: Math.floor(sub(new Date(), { weeks: 1 }).getTime() / 1000),
};

const paidUser = {
    ...user,
    isPaid: true,
};

describe('EditEmailSubscription', () => {
    beforeEach(() => {
        mockedApi = vi.fn();
        mockedUseDispatch.mockReturnValue(vi.fn());
        mockedUseApi.mockReturnValue(mockedApi);
        mockedUseUserSettings.mockReturnValue([{ EarlyAccess: 1, News: 0 }]);
        mockedUseUser.mockReturnValue([user]);
        mockUseConfig();
    });

    it('should have all expected toggles as a paid user', () => {
        mockedUseUser.mockReturnValue([paidUser]);
        render(<EditEmailSubscription />);

        expect(screen.getByText('Proton important announcements'));
        expect(screen.getByText('Proton for Business communications'));
        expect(screen.getByText('Proton newsletter'));
        expect(screen.getByText('Proton offers and promotions'));
        expect(screen.getByText('Proton welcome emails'));
        expect(screen.getByText('Proton Mail and Calendar product updates'));
        expect(screen.getByText('Proton Drive product updates'));
        expect(screen.getByText('Proton Pass product updates'));
        expect(screen.getByText('Proton VPN product updates'));
        expect(screen.getByText('In-app notifications'));
    });

    it('should have all expected toggles as a free user', () => {
        render(<EditEmailSubscription />);

        expect(screen.getByText('Proton important announcements'));
        expect(screen.getByText('Proton for Business communications'));
        expect(screen.getByText('Proton newsletter'));
        expect(screen.getByText('Proton offers and promotions'));
        expect(screen.getByText('Proton welcome emails'));
        expect(screen.getByText('Proton Mail and Calendar product updates'));
        expect(screen.getByText('Proton Drive product updates'));
        expect(screen.getByText('Proton Pass product updates'));
        expect(screen.getByText('Proton VPN product updates'));
        expect(screen.getByText('In-app notifications'));
    });

    it('should not have FEATURES toggle', () => {
        render(<EditEmailSubscription />);

        expect(screen.queryByText('Proton product announcements')).not.toBeInTheDocument();
    });

    it('should toggle nothing', () => {
        const { container } = render(<EditEmailSubscription />);

        const checkedToggles = container.querySelectorAll('[checked=""]');
        expect(checkedToggles).toHaveLength(0);
    });

    it('should toggle everything', () => {
        mockedUseUser.mockReturnValue([paidUser]);
        mockedUseUserSettings.mockReturnValue([{ EarlyAccess: 1, News: 20479 }]);
        const { container } = render(<EditEmailSubscription />);

        const checkedToggles = container.querySelectorAll('[checked=""]');
        expect(checkedToggles).toHaveLength(10);
    });

    it('should call api on update', async () => {
        mockedUseUserSettings.mockReturnValue([
            {
                News:
                    NEWSLETTER_SUBSCRIPTIONS_BITS.FEATURES |
                    NEWSLETTER_SUBSCRIPTIONS_BITS.INBOX_NEWS |
                    NEWSLETTER_SUBSCRIPTIONS_BITS.DRIVE_NEWS,
            },
        ]);
        render(<EditEmailSubscription />);

        const toggleContent = screen.getByText('Proton Mail and Calendar product updates');
        fireEvent.click(toggleContent);

        await waitFor(() => expect(mockedApi).toHaveBeenCalledTimes(1));
        expect(mockedApi).toHaveBeenCalledWith({
            data: { InboxNews: false },
            method: 'PATCH',
            url: 'core/v4/settings/news',
        });
    });

    it('should show the frequency inline and keep the details in a tooltip in VPN settings', () => {
        mockUseConfig({ APP_NAME: APPS.PROTONVPN_SETTINGS });
        render(<EditEmailSubscription />);

        expect(screen.getByText('Email subscriptions')).toBeInTheDocument();
        expect(screen.getByText('Proton newsletter').closest('label')).toHaveTextContent('1 email per month');
        expect(screen.getByText('Recovery checklist').closest('label')).toHaveTextContent('1-4 emails per year');
        // Only in the info tooltips, which screen readers read out
        expect(screen.getByText(/Get the latest privacy news/)).toHaveClass('sr-only');
        expect(screen.getByText(/Reminders to keep your recovery methods up to date/)).toHaveClass('sr-only');
    });

    it('should show the frequency and the details on separate lines in the lite app', () => {
        mockUseConfig({ APP_NAME: APPS.PROTONACCOUNTLITE });
        render(<EditEmailSubscription />);

        expect(screen.getAllByText('1 email per month').length).toBeGreaterThan(0);
        expect(
            screen.getByText('Get the latest privacy news and what is going on in the Proton universe.')
        ).toBeInTheDocument();
    });

    it('should reload the settings from the server when the update fails', async () => {
        const dispatch = vi.fn().mockResolvedValue(undefined);
        mockedUseDispatch.mockReturnValue(dispatch);
        mockedApi.mockRejectedValue(new Error('Network error'));
        mockedUseUserSettings.mockReturnValue([{ News: NEWSLETTER_SUBSCRIPTIONS_BITS.INBOX_NEWS }]);
        render(<EditEmailSubscription />);

        fireEvent.click(screen.getByText('Proton Mail and Calendar product updates'));

        await waitFor(() => expect(dispatch).toHaveBeenCalledTimes(2));
        expect(dispatch).toHaveBeenNthCalledWith(1, userSettingsActions.update({ UserSettings: { News: 0 } }));
        // The reload is a thunk
        expect(dispatch).toHaveBeenNthCalledWith(2, expect.any(Function));
    });

    it('should call api on update, adding features', async () => {
        mockedUseUserSettings.mockReturnValue([
            { News: NEWSLETTER_SUBSCRIPTIONS_BITS.FEATURES | NEWSLETTER_SUBSCRIPTIONS_BITS.INBOX_NEWS },
        ]);
        render(<EditEmailSubscription />);

        const toggleContent = screen.getByText('Proton Mail and Calendar product updates');
        fireEvent.click(toggleContent);

        await waitFor(() => expect(mockedApi).toHaveBeenCalledTimes(1));
        expect(mockedApi).toHaveBeenCalledWith({
            data: { Features: false, InboxNews: false },
            method: 'PATCH',
            url: 'core/v4/settings/news',
        });
    });

    it('should update global feature news flag when one product feature news is updated', async () => {
        render(<EditEmailSubscription />);

        const toggleContent = screen.getByText('Proton Drive product updates');
        fireEvent.click(toggleContent);

        await waitFor(() => expect(mockedApi).toHaveBeenCalledTimes(1));
        expect(mockedApi).toHaveBeenCalledWith({
            data: { DriveNews: true, Features: true },
            method: 'PATCH',
            url: 'core/v4/settings/news',
        });
    });

    describe('when user is not in beta', () => {
        it('should not display `beta announcements` toggle', () => {
            mockedUseUserSettings.mockReturnValue([{ EarlyAccess: 0, News: 4095 }]);
            render(<EditEmailSubscription />);

            expect(screen.queryByText('Proton beta announcements')).toBeNull();
        });
    });
});
