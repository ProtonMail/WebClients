import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { sub } from 'date-fns';

import { useApi, useUser, useUserSettings } from '../../hooks';
import EditEmailSubscription from './EditEmailSubscription';

jest.mock('../../hooks/useApi');
const mockedUseApi = useApi as jest.MockedFunction<any>;
let mockedApi: ReturnType<typeof mockedUseApi>;

jest.mock('../../hooks/useEventManager', () => () => ({ call: jest.fn() }));

jest.mock('@proton/hooks/useLoading', () => () => [false, jest.fn((fn) => fn())]);

jest.mock('../../hooks/useNotifications', () => () => ({ createNotification: jest.fn() }));

jest.mock('../../hooks/useUser');
const mockedUseUser = useUser as jest.MockedFunction<any>;

jest.mock('../../hooks/useUserSettings');
const mockedUseUserSettings = useUserSettings as jest.MockedFunction<any>;

describe('EditEmailSubscription', () => {
    beforeEach(() => {
        mockedApi = jest.fn();
        mockedUseApi.mockReturnValue(mockedApi);
        mockedUseUserSettings.mockReturnValue([{ EarlyAccess: 1, News: 0 }]);
        mockedUseUser.mockReturnValue([{ CreateTime: Math.floor(sub(new Date(), { weeks: 1 }).getTime() / 1000) }]);
    });

    it('should have all expected toggles', () => {
        render(<EditEmailSubscription />);

        expect(screen.getByText('Proton important announcements'));
        expect(screen.getByText('Proton for Business newsletter'));
        expect(screen.getByText('Proton newsletter'));
        expect(screen.getByText('Proton beta announcements'));
        expect(screen.getByText('Proton offers and promotions'));
        expect(screen.getByText('Proton welcome emails'));
        expect(screen.getByText('Proton Mail and Calendar new features'));
        expect(screen.getByText('Proton Drive product updates'));
        expect(screen.getByText('Proton VPN product updates'));
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
        mockedUseUserSettings.mockReturnValue([{ EarlyAccess: 1, News: 4095 }]);
        const { container } = render(<EditEmailSubscription />);

        const checkedToggles = container.querySelectorAll('[checked=""]');
        expect(checkedToggles).toHaveLength(10);
    });

    it('should call api on update', async () => {
        render(<EditEmailSubscription />);

        const toggleContent = screen.getByText('Proton offers and promotions');
        await fireEvent.click(toggleContent);

        await waitFor(() => expect(mockedApi).toHaveBeenCalledTimes(1));
        expect(mockedApi).toHaveBeenCalledWith({
            data: { Features: false, Offers: true },
            method: 'PATCH',
            url: 'core/v4/settings/news',
        });
    });

    it('should update global feature news flag when one product feature news is updated', async () => {
        render(<EditEmailSubscription />);

        const toggleContent = screen.getByText('Proton Drive product updates');
        await fireEvent.click(toggleContent);

        await waitFor(() => expect(mockedApi).toHaveBeenCalledTimes(1));
        expect(mockedApi).toHaveBeenCalledWith({
            data: { DriveNews: true, Features: true },
            method: 'PATCH',
            url: 'core/v4/settings/news',
        });
    });

    describe('when user has been created more than one month ago', () => {
        it('should not display `welcome emails` toggle', () => {
            mockedUseUser.mockReturnValue([{ CreateTime: Math.floor(sub(new Date(), { weeks: 5 }).getTime() / 1000) }]);
            render(<EditEmailSubscription />);

            expect(screen.queryByText('Proton welcome emails')).toBeNull();
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
