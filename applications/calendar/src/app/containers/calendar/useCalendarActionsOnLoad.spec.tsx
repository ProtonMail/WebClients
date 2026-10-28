import { Router } from 'react-router-dom';

import { renderHook } from '@testing-library/react-hooks';
import { createMemoryHistory } from 'history';

import { changeCalendarVisiblity } from '@proton/calendar/calendars/actions';
import NotificationsProvider from '@proton/components/containers/notifications/Provider';

import { useCalendarDispatch } from '../../store/hooks';
import type { UseCalendarActionsOnLoadParameters } from './useCalendarActionsOnLoad';
import { useCalendarActionsOnLoad } from './useCalendarActionsOnLoad';

jest.mock('../../store/hooks', () => ({
    useCalendarDispatch: jest.fn(),
}));

jest.mock('@proton/calendar/calendars/actions', () => ({
    changeCalendarVisiblity: jest.fn(),
}));

describe('useCalendarActionsOnLoad', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const defaultDependencies = {
        cachedCalendars: {},
        isEventCreationDisabled: false,
        activeAddresses: [{ ID: '1', Email: 'test@proton.me' }],
        createEventCalendar: { ID: '1', Name: 'Test Calendar' },
        createEventCalendarBootstrap: { ID: '1', Name: 'Test Calendar' },
        canCreateBooking: true,
        isWelcomeFlowDone: true,
    };

    const setupTest = ({
        create,
        update,
        openBookingCreationSidebar = jest.fn(),
        dependencies,
        searchParams,
    }: Omit<UseCalendarActionsOnLoadParameters, 'dependencies' | 'openBookingCreationSidebar'> & {
        openBookingCreationSidebar?: () => void;
        dependencies?: Partial<UseCalendarActionsOnLoadParameters['dependencies']>;
        searchParams: string;
    }) => {
        const history = createMemoryHistory({ initialEntries: ['/' + searchParams] });

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <NotificationsProvider>
                <Router history={history}>{children}</Router>
            </NotificationsProvider>
        );

        const { result } = renderHook(
            () =>
                useCalendarActionsOnLoad({
                    create,
                    update,
                    openBookingCreationSidebar,
                    // @ts-expect-error - dependencies is optional
                    dependencies: { ...defaultDependencies, ...dependencies },
                }),
            { wrapper }
        );

        return { result, history };
    };

    it('should not run any actions if there is no search params', () => {
        const create = jest.fn();
        const update = jest.fn();

        const mockDispatch = jest.fn();
        (useCalendarDispatch as jest.Mock).mockReturnValue(mockDispatch);

        setupTest({
            create,
            update,
            searchParams: '',
        });

        expect(mockDispatch).not.toHaveBeenCalled();
        expect(create).not.toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();
    });

    it('should run the create action when having the proper search params', () => {
        const create = jest.fn();
        const update = jest.fn();

        const mockDispatch = jest.fn();
        (useCalendarDispatch as jest.Mock).mockReturnValue(mockDispatch);

        const { history } = setupTest({
            create,
            update,
            searchParams: '?action=create',
        });

        expect(create).toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();

        expect(history.location.search).toBe('');
    });

    it('should not run the create action if one of the dependencies is not met', () => {
        const create = jest.fn();
        const update = jest.fn();

        const mockDispatch = jest.fn();
        (useCalendarDispatch as jest.Mock).mockReturnValue(mockDispatch);

        setupTest({
            create,
            update,
            searchParams: '?action=create',
            dependencies: {
                activeAddresses: [],
            },
        });

        expect(create).not.toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();
    });

    it('should run the update action when having the proper seacrch params', () => {
        const create = jest.fn();
        const update = jest.fn();

        const mockDispatch = jest.fn();
        (useCalendarDispatch as jest.Mock).mockReturnValue(mockDispatch);

        const eventId = 'event-id';
        const calendarId = 'calendar-id';

        const { history } = setupTest({
            create,
            update,
            searchParams: `?action=edit&eventId=${eventId}&calendarId=${calendarId}`,
            dependencies: {
                cachedCalendars: {
                    // @ts-expect-error - this is just an empty object to mock the present of the cached calendar
                    [calendarId]: {},
                },
            },
        });

        expect(create).not.toHaveBeenCalled();
        expect(update).toHaveBeenCalledWith(eventId, calendarId);

        expect(history.location.search).toBe('');
    });

    it('should not run the update action if one of the dependencies is not met', () => {
        const create = jest.fn();
        const update = jest.fn();

        const mockDispatch = jest.fn();
        (useCalendarDispatch as jest.Mock).mockReturnValue(mockDispatch);

        const eventId = 'event-id';
        const calendarId = 'calendar-id';

        setupTest({
            create,
            update,
            searchParams: `?action=edit&eventId=${eventId}&calendarId=${calendarId}`,
            dependencies: {
                createEventCalendar: undefined,
            },
        });

        expect(create).not.toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();
    });

    it('should update the calendar visibility if the calendar is not visible', () => {
        const create = jest.fn();
        const update = jest.fn();

        const mockDispatch = jest.fn();
        (useCalendarDispatch as jest.Mock).mockReturnValue(mockDispatch);
        (changeCalendarVisiblity as jest.Mock).mockReturnValue(Promise.resolve());

        const eventId = 'event-id';
        const calendarId = 'calendar-id';

        setupTest({
            create,
            update,
            searchParams: `?action=edit&eventId=${eventId}&calendarId=${calendarId}`,
            dependencies: {
                cachedCalendars: {},
            },
        });

        expect(changeCalendarVisiblity).toHaveBeenCalledWith({ calendarID: calendarId, display: true });
    });

    describe('create-booking action', () => {
        it('should open the booking creation sidebar and clean up the search params', () => {
            const create = jest.fn();
            const update = jest.fn();
            const openBookingCreationSidebar = jest.fn();
            (useCalendarDispatch as jest.Mock).mockReturnValue(jest.fn());

            const { history } = setupTest({
                create,
                update,
                openBookingCreationSidebar,
                searchParams: '?action=create-booking',
            });

            expect(openBookingCreationSidebar).toHaveBeenCalledTimes(1);
            expect(create).not.toHaveBeenCalled();
            expect(update).not.toHaveBeenCalled();
            expect(history.location.search).toBe('');
        });

        it('should wait until a booking page can be created', () => {
            const openBookingCreationSidebar = jest.fn();
            (useCalendarDispatch as jest.Mock).mockReturnValue(jest.fn());

            const { history } = setupTest({
                create: jest.fn(),
                update: jest.fn(),
                openBookingCreationSidebar,
                searchParams: '?action=create-booking',
                dependencies: { canCreateBooking: false },
            });

            expect(openBookingCreationSidebar).not.toHaveBeenCalled();
            expect(history.location.search).toBe('?action=create-booking');
        });

        it('should wait until the welcome flow is done', () => {
            const openBookingCreationSidebar = jest.fn();
            (useCalendarDispatch as jest.Mock).mockReturnValue(jest.fn());

            setupTest({
                create: jest.fn(),
                update: jest.fn(),
                openBookingCreationSidebar,
                searchParams: '?action=create-booking',
                dependencies: { isWelcomeFlowDone: false },
            });

            expect(openBookingCreationSidebar).not.toHaveBeenCalled();
        });

        it('should keep other search params when cleaning up', () => {
            const openBookingCreationSidebar = jest.fn();
            (useCalendarDispatch as jest.Mock).mockReturnValue(jest.fn());

            const { history } = setupTest({
                create: jest.fn(),
                update: jest.fn(),
                openBookingCreationSidebar,
                searchParams: '?action=create-booking&foo=bar',
            });

            expect(openBookingCreationSidebar).toHaveBeenCalledTimes(1);
            expect(history.location.search).toBe('?foo=bar');
        });
    });
});
