import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import createCache from '@proton/shared/lib/helpers/cache';
import { CALENDAR_SUBSCRIPTION_STATUS } from '@proton/shared/lib/interfaces/calendar';

import { CacheProvider } from '../../cache';
import SubscribedCalendarModal from './SubscribedCalendarModal';

jest.mock('../hooks/useGetCalendarSetup', () => () => ({}));

jest.mock('@proton/components/hooks/useNotifications', () => () => ({}));

jest.mock('../calendarModal/calendarModalState', () => ({
    ...jest.requireActual('../calendarModal/calendarModalState'),
    getDefaultModel: jest.fn(() => ({
        calendarID: '7824929ac66f483ba12ee051c056b9e5',
        name: 'A fake calendar',
        members: [],
        description: 'a fake description',
        color: '#8080FF',
        display: true,
        addressID: 'fa4ea8f5e6ac4df494f8190a6c9d9bd9',
        addressOptions: [],
        duration: 30,
        type: 0,
    })),
}));

const mockApi = jest.fn();
jest.mock('@proton/components/hooks/useApi', () => ({
    __esModule: true,
    default: jest.fn(() => mockApi),
}));

const mockHandleCreateCalendar = jest.fn();
jest.mock('../hooks/useGetCalendarActions', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        handleCreateCalendar: mockHandleCreateCalendar,
    })),
}));

jest.mock('@proton/components/hooks/useEventManager', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        call: jest.fn(),
        subscribe: jest.fn(),
    })),
}));

jest.mock('@proton/components/containers/eventManager/calendar/ModelEventManagerProvider', () => ({
    useCalendarModelEventManager: jest.fn(() => ({
        subscribe: jest.fn(),
    })),
}));

function renderComponent() {
    const Wrapper = ({ children }: { children: any }) => (
        <CacheProvider cache={createCache()}>{children}</CacheProvider>
    );

    return render(<SubscribedCalendarModal open />, { wrapper: Wrapper });
}

describe('SubscribedCalendarModal', () => {
    afterEach(() => {
        mockApi.mockReset();
        mockHandleCreateCalendar.mockReset();
    });

    describe('when validation API returns a validation error', () => {
        beforeEach(() => {
            renderComponent();
            mockApi.mockResolvedValue({ ValidationResult: { Result: CALENDAR_SUBSCRIPTION_STATUS.INVALID_URL } });
        });

        it('should display an error message and not call mockUseGetCalendarActions', async () => {
            const submitButton = screen.getByText('Add calendar', { selector: 'button' });
            const input = screen.getByLabelText('Calendar URL');
            const invalidGoogleCalendarLink = `https://calendar.google.com/public/a.ics`;

            expect(submitButton).toBeDisabled();

            userEvent.paste(input, invalidGoogleCalendarLink);
            expect(submitButton).toBeEnabled();

            userEvent.click(submitButton);

            await waitFor(() => screen.getByText('Invalid URL'));

            expect(mockApi).toHaveBeenCalledTimes(1);
            expect(mockApi).toHaveBeenCalledWith({
                data: { Mode: 1, URL: 'https://calendar.google.com/public/a.ics' },
                method: 'post',
                silence: true,
                url: 'calendar/v1/subscription/validate',
            });

            expect(mockHandleCreateCalendar).not.toHaveBeenCalled();
        });
    });

    describe('when validation returns OK', () => {
        beforeEach(() => {
            renderComponent();
            mockApi.mockResolvedValue({ ValidationResult: { Result: CALENDAR_SUBSCRIPTION_STATUS.OK } });
            mockHandleCreateCalendar.mockImplementation(() => Promise.resolve());
        });

        it('should call `handleCreateCalendar`', async () => {
            const submitButton = screen.getByText('Add calendar', { selector: 'button' });
            const input = screen.getByLabelText('Calendar URL');
            const invalidGoogleCalendarLink = `https://calendar.google.com/public/a.ics`;

            expect(submitButton).toBeDisabled();

            userEvent.paste(input, invalidGoogleCalendarLink);
            expect(submitButton).toBeEnabled();

            userEvent.click(submitButton);

            // wait for the last api call to be made
            await waitFor(() => expect(mockHandleCreateCalendar).toHaveBeenCalledTimes(1));

            expect(mockApi).toHaveBeenCalledTimes(1);
            expect(mockApi).toHaveBeenCalledWith({
                data: { Mode: 1, URL: 'https://calendar.google.com/public/a.ics' },
                method: 'post',
                silence: true,
                url: 'calendar/v1/subscription/validate',
            });

            expect(mockHandleCreateCalendar).toHaveBeenCalledWith(
                'fa4ea8f5e6ac4df494f8190a6c9d9bd9',
                {
                    Color: '#8080FF',
                    Description: 'a fake description',
                    Display: 1,
                    Name: 'https://calendar.google.com/public/a.ics',
                    URL: 'https://calendar.google.com/public/a.ics',
                },
                { DefaultEventDuration: 30, DefaultFullDayNotifications: [], DefaultPartDayNotifications: [] }
            );
        });
    });
});
