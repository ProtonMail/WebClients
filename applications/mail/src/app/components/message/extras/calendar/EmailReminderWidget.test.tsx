import { fireEvent, render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';

import { MIME_TYPES } from '@proton/shared/lib/constants';
import createCache from '@proton/shared/lib/helpers/cache';
import { CacheProvider } from '@proton/components/containers/cache';
import { getIsEventCancelled } from '@proton/shared/lib/calendar/veventHelper';
import { getParsedHeadersFirstValue } from '@proton/shared/lib/mail/messages';
import useApi from '@proton/components/hooks/useApi';
import useGetCalendarEventRaw from '@proton/components/hooks/useGetCalendarEventRaw';
import { getEvent } from '@proton/shared/lib/api/calendars';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/calendar/constants';
import {
    getDefaultCalendar,
    getMaxUserCalendarsDisabled,
    getDoesCalendarNeedUserAction,
} from '@proton/shared/lib/calendar/calendar';

import EmailReminderWidget from './EmailReminderWidget';

jest.mock('@proton/shared/lib/calendar/integration/getPaginatedEventsByUID', () => ({
    __esModule: true,
    default: () => [],
}));

jest.mock('@proton/shared/lib/calendar/calendar', () => ({
    ...jest.requireActual('@proton/shared/lib/calendar/calendar'),
    getDoesCalendarNeedUserAction: jest.fn(() => false),
    getDefaultCalendar: jest.fn(() => true),
    getCanCreateCalendar: jest.fn(() => true),
    getMaxUserCalendarsDisabled: jest.fn(() => true),
}));
jest.mock('@proton/shared/lib/mail/messages', () => ({
    getParsedHeadersFirstValue: jest.fn(),
}));
jest.mock('./EventReminderText', () => ({
    __esModule: true,
    default: jest.fn(() => <span>EventReminderText</span>),
}));
jest.mock('@proton/components/components/calendarEventDateHeader/CalendarEventDateHeader', () => ({
    __esModule: true,
    default: jest.fn(() => <span>DateHeader</span>),
}));
jest.mock('@proton/components/hooks/useNotifications', () => ({
    __esModule: true,
    default: jest.fn(() => ({ createNotification: jest.fn() })),
}));
jest.mock('@proton/components/hooks/useApi', () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mock('@proton/shared/lib/calendar/veventHelper', () => ({
    getIsEventCancelled: jest.fn(() => false),
}));
jest.mock('@proton/components/hooks/useConfig', () => () => ({ APP_NAME: 'proton-calendar', APP_VERSION: 'test' }));
jest.mock('@proton/components/hooks/useUser', () => () => [{ isFree: true }]);
jest.mock('@proton/components/hooks/useContactEmails', () => () => []);
jest.mock('@proton/components/hooks/useGetAddressKeys', () => () => []);
jest.mock('@proton/components/hooks/useCalendars', () => ({
    useGetCalendars: jest.fn(
        () => () =>
            Promise.resolve([
                {
                    ID: 'id1',
                    Name: 'calendar1',
                    Description: 'description1',
                    Display: 1,
                    Color: '#f00',
                    Flags: 1,
                    Type: 0,
                },
            ])
    ),
}));
jest.mock('@proton/components/hooks/useCalendarUserSettings', () => ({
    useGetCalendarUserSettings: jest.fn(() => () => Promise.resolve({})),
}));
jest.mock('@proton/components/hooks/useGetCalendarEventRaw', () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mock('@proton/components/hooks/useAddresses', () => ({
    __esModule: true,
    default: jest.fn(() => [
        [
            {
                Email: 'test@pm.gg',
                Status: 1,
                Receive: 1,
                Send: 1,
            },
        ],
    ]),
    useGetAddresses: jest.fn(),
}));

const mockedGetParsedHeadersFirstValue = getParsedHeadersFirstValue as jest.Mock<
    ReturnType<typeof getParsedHeadersFirstValue>
>;
const mockedGetDefaultCalendar = getDefaultCalendar as jest.Mock<any>;
const mockedGetDoesCalendarNeedUserAction = getDoesCalendarNeedUserAction as jest.Mock<
    ReturnType<typeof getDoesCalendarNeedUserAction>
>;
const mockedGetMaxUserCalendarsDisabled = getMaxUserCalendarsDisabled as jest.Mock<
    ReturnType<typeof getMaxUserCalendarsDisabled>
>;

const mockedGetIsEventCancelled = getIsEventCancelled as jest.Mock<ReturnType<typeof getIsEventCancelled>>;
const mockedUseApi = useApi as jest.Mock<(args: any) => Promise<any>>;
const mockedUseGetCalendarEventRaw = useGetCalendarEventRaw as jest.Mock<ReturnType<() => () => Promise<any>>>;

const getSkeleton = () => screen.getByTestId('calendar-widget-widget-skeleton') as HTMLDivElement;

const mockedVeventComponent = {
    summary: { value: 'summary' },
    location: { value: 'location' },
    organizer: { value: 'organizer' },
    attendee: [{ value: 'attendee1' }, { value: 'attendee2' }],
    dtstart: {
        value: {
            year: 1970,
            month: 1,
            day: 1,
            hours: 0,
            minutes: 0,
            seconds: 0,
            isUTC: true,
        },
    },
    dtend: {
        value: {
            year: 1970,
            month: 1,
            day: 1,
            hours: 2,
            minutes: 0,
            seconds: 0,
            isUTC: true,
        },
    },
    sequence: { value: 0 },
};

const getFakeRawCalendarEventPromise = () =>
    new Promise((resolve) =>
        setTimeout(
            () =>
                resolve({
                    veventComponent: mockedVeventComponent,
                }),
            1000
        )
    );

function renderComponent() {
    const defaultMessage = {
        localID: 'localID',
        data: {
            ID: 'ID',
            Order: 1,
            ConversationID: 'ConversationID',
            Subject: 'Subject',
            Unread: 0,
            Sender: {
                Name: 'SenderName',
                Address: 'SenderAddress',
            },
            Flags: 1,
            IsReplied: 1,
            IsRepliedAll: 1,
            IsForwarded: 1,
            ToList: [],
            CCList: [],
            BCCList: [],
            Time: 1,
            Size: 1,
            NumAttachments: 1,
            AddressID: 'AddressID',
            ExternalID: 'ExternalID',
            Body: 'Body',
            MIMEType: MIME_TYPES.DEFAULT,
            Header: 'Header',
            ParsedHeaders: { header1key: 'header1value' },
            ReplyTo: {
                Name: 'ReplyToName',
                Address: 'ReplyToAddress',
            },
            ReplyTos: [],
            Attachments: [],
            LabelIDs: [],
        },
    };

    return (
        <CacheProvider cache={createCache()}>
            <Router history={createMemoryHistory()}>
                <EmailReminderWidget message={defaultMessage} />
            </Router>
        </CacheProvider>
    );
}

describe('EmailReminderWidget', () => {
    const fakeNow = new Date(Date.UTC(1969, 11, 31, 8, 9, 10));

    beforeAll(() => {
        jest.useFakeTimers('modern').setSystemTime(fakeNow.getTime());
    });

    beforeEach(() => {
        mockedGetParsedHeadersFirstValue.mockImplementation((_, key) => {
            if (key === 'X-Pm-Calendar-Calendarid') {
                return 'id1';
            }

            if (key === 'X-Pm-Calendar-Sequence') {
                return '0';
            }

            return key;
        });
        mockedGetIsEventCancelled.mockImplementation(() => false);
        mockedUseApi.mockImplementation(
            () => () =>
                Promise.resolve({ Event: { CalendarID: 'id1' }, calendars: [{ ID: 'X-Pm-Calendar-Calendarid' }] })
        );
        mockedUseGetCalendarEventRaw.mockImplementation(() => () => getFakeRawCalendarEventPromise());
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.clearAllMocks();
    });

    it('does not render anything when necessary headers are not present', () => {
        mockedGetParsedHeadersFirstValue.mockImplementation(() => undefined);

        const { container } = render(renderComponent());

        expect(container).toBeEmptyDOMElement();
    });

    it('renders the widget and the necessary information', async () => {
        render(renderComponent());

        await waitFor(() => {
            expect(getSkeleton()).toBeInTheDocument();
        });

        jest.runAllTimers();

        await waitForElementToBeRemoved(() => getSkeleton());

        await waitFor(() => {
            expect((screen.getByText(new RegExp(`Open in ${CALENDAR_APP_NAME}`)) as HTMLAnchorElement).href).toBe(
                'http://localhost/event?Action=VIEW&EventID=X-Pm-Calendar-Eventid&CalendarID=id1&RecurrenceID=X-Pm-Calendar-Occurrence'
            );
            expect(screen.getByText(/DateHeader/)).toBeInTheDocument();

            expect(screen.getByText(/summary/)).toBeInTheDocument();
            expect(screen.getByText(/^location/)).toBeInTheDocument();
            expect(screen.getByText(/organizer/)).toBeInTheDocument();
            expect(screen.getByText(/EventReminderText/)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole(/button/));

        expect(screen.getByText(/attendee1/)).toBeInTheDocument();
        expect(screen.getByText(/attendee2/)).toBeInTheDocument();
    });

    it('renders the widget when the event has been cancelled', async () => {
        mockedGetIsEventCancelled.mockImplementation(() => true);

        render(renderComponent());

        await waitFor(() => {
            expect(getSkeleton()).toBeInTheDocument();
        });

        jest.runAllTimers();

        await waitForElementToBeRemoved(() => getSkeleton());

        expect(screen.queryByText(new RegExp(`Open in ${CALENDAR_APP_NAME}`))).toBeInTheDocument();
        expect(screen.queryByText(/Event was canceled/)).toBeInTheDocument();
    });

    it('displays an error instead of the widget when there has been a breaking change', async () => {
        mockedGetParsedHeadersFirstValue.mockImplementation((_, key) => {
            if (key === 'X-Pm-Calendar-Calendarid') {
                return 'id1';
            }

            if (key === 'X-Pm-Calendar-Sequence') {
                return '-1';
            }

            return key;
        });
        mockedUseGetCalendarEventRaw.mockImplementation(
            () => () => Promise.resolve({ veventComponent: mockedVeventComponent })
        );

        render(renderComponent());

        await waitForElementToBeRemoved(() => getSkeleton());

        jest.runAllTimers();

        expect(screen.queryByText(new RegExp(`Open in ${CALENDAR_APP_NAME}`))).not.toBeInTheDocument();
        expect(screen.queryByText(new RegExp('Event was updated. This reminder is out-of-date.'))).toBeInTheDocument();
    });

    it('displays an error instead of the widget when the event does not exist anymore', async () => {
        mockedUseApi.mockImplementation(() => (args: any) => {
            if (args.url === getEvent('id1', 'X-Pm-Calendar-Eventid').url) {
                return Promise.reject();
            }

            return Promise.resolve({ Event: { CalendarID: 'id1' }, calendars: [{}] });
        });

        render(renderComponent());

        await waitForElementToBeRemoved(() => getSkeleton());

        expect(screen.queryByText(new RegExp(`Open in ${CALENDAR_APP_NAME}`))).not.toBeInTheDocument();
        expect(screen.queryByText(new RegExp('Event is no longer in your calendar'))).toBeInTheDocument();
    });

    describe('decryption error', () => {
        beforeEach(() => {
            mockedUseGetCalendarEventRaw.mockImplementation(
                // eslint-disable-next-line prefer-promise-reject-errors
                () => () => Promise.reject({ message: 'DECRYPTION_FAILED' })
            );
        });

        describe('needs user action', () => {
            it('displays an error instead of the widget when the calendar needs a reset or passphrase update', async () => {
                mockedGetDoesCalendarNeedUserAction.mockImplementation(() => true);

                render(renderComponent());

                await waitForElementToBeRemoved(() => getSkeleton());

                expect(screen.queryByText(new RegExp(`Open in ${CALENDAR_APP_NAME}`))).not.toBeInTheDocument();
                expect(
                    screen.queryByText(
                        new RegExp(
                            'Event details are encrypted. Sign in again to restore Calendar and decrypt your data.'
                        )
                    )
                ).toBeInTheDocument();
                expect(screen.queryByText(new RegExp('Learn more'))).toBeInTheDocument();
                expect(screen.queryByText(new RegExp(`Open ${CALENDAR_APP_NAME}`))).toBeInTheDocument();
            });

            it('displays an error instead of the widget when calendars must be reactivated', async () => {
                mockedGetDefaultCalendar.mockImplementation(() => false);
                mockedGetMaxUserCalendarsDisabled.mockImplementation(() => false);

                render(renderComponent());

                await waitForElementToBeRemoved(() => getSkeleton());

                expect(screen.queryByText(new RegExp(`Open in ${CALENDAR_APP_NAME}`))).not.toBeInTheDocument();
                expect(
                    screen.queryByText(
                        new RegExp(
                            'Event details are encrypted. Sign in again to restore Calendar and decrypt your data.'
                        )
                    )
                ).toBeInTheDocument();
                expect(screen.queryByText(new RegExp('Learn more'))).toBeInTheDocument();
                expect(screen.queryByText(new RegExp(`Open ${CALENDAR_APP_NAME}`))).toBeInTheDocument();
            });
        });

        describe('does not need user action', () => {
            it('displays an error instead of the widget when the event cannot be decrypted', async () => {
                mockedGetDoesCalendarNeedUserAction.mockImplementation(() => false);
                render(renderComponent());

                await waitForElementToBeRemoved(() => getSkeleton());

                expect(screen.queryByText(new RegExp(`Open in ${CALENDAR_APP_NAME}`))).not.toBeInTheDocument();
                expect(screen.queryByText(new RegExp('Event details cannot be decrypted.'))).toBeInTheDocument();
                expect(screen.queryByText(new RegExp('Why not?'))).toBeInTheDocument();
            });
        });
    });
});
