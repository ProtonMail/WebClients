import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { sub } from 'date-fns';

import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import useApi from '@proton/components/hooks/useApi';
import { useDispatch } from '@proton/redux-shared-store';
import { NEWSLETTER_SUBSCRIPTIONS_BITS } from '@proton/shared/lib/helpers/newsletter';
import type { UserModel } from '@proton/shared/lib/interfaces';

import EditEmailSubscription from './EditEmailSubscription';

jest.mock('@proton/components/hooks/useApi');
const mockedUseApi = useApi as jest.MockedFunction<any>;
let mockedApi: ReturnType<typeof mockedUseApi>;

jest.mock('../../hooks/useEventManager', () => () => ({ call: jest.fn() }));

jest.mock('@proton/redux-shared-store');
const mockedUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;

jest.mock('@proton/hooks/useLoading', () => () => [false, jest.fn((fn) => fn())]);

jest.mock('../../hooks/useNotifications', () => () => ({ createNotification: jest.fn() }));

jest.mock('@proton/account/user/hooks');
const mockedUseUser = useUser as jest.MockedFunction<any>;

jest.mock('@proton/account/userSettings/hooks');
const mockedUseUserSettings = useUserSettings as jest.MockedFunction<any>;

const user: Partial<UserModel> = {
    CreateTime: Math.floor(sub(new Date(), { weeks: 1 }).getTime() / 1000),
};

const paidUser = {
    ...user,
    isPaid: true,
};

describe('EditEmailSubscription', () => {
    beforeEach(() => {
        mockedApi = jest.fn();
        mockedUseDispatch.mockReturnValue(jest.fn());
        mockedUseApi.mockReturnValue(mockedApi);
        mockedUseUserSettings.mockReturnValue([{ EarlyAccess: 1, News: 0 }]);
        mockedUseUser.mockReturnValue([user]);
    });

    it('should have all expected toggles as a paid user', () => {
        mockedUseUser.mockReturnValue([paidUser]);
        render(<EditEmailSubscription />);

        expect(screen.getByText('Proton important announcements'));
        expect(screen.getByText('Proton for Business newsletter'));
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
        expect(screen.getByText('Proton for Business newsletter'));
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
