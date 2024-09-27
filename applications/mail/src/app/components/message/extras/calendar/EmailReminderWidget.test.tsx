import { BrowserRouter } from 'react-router-dom';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { mocked } from 'jest-mock';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

import { getModelState } from '@proton/account/test';
import {
    AuthenticationProvider,
    CacheProvider,
    useAddresses,
    useGetAddresses,
    useUserSettings,
} from '@proton/components';
import { DrawerProvider } from '@proton/components/hooks/drawer/useDrawer';
import useApi from '@proton/components/hooks/useApi';
import useGetCalendarEventRaw from '@proton/components/hooks/useGetCalendarEventRaw';
import useNotifications from '@proton/components/hooks/useNotifications';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import { addDays } from '@proton/shared/lib/date-fns-utc';
import { toUTCDate } from '@proton/shared/lib/date/timezone';
import createCache from '@proton/shared/lib/helpers/cache';
import type { Nullable, UserSettings } from '@proton/shared/lib/interfaces';
import { DRAWER_VISIBILITY } from '@proton/shared/lib/interfaces';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { VERIFICATION_STATUS } from '@proton/srp/lib/constants';
import {
    addressBuilder,
    calendarBuilder,
    calendarEventBuilder,
    calendarUserSettingsBuilder,
    messageBuilder,
    mockApiWithServer,
    mockDefaultBreakpoints,
    mockNotifications,
    veventBuilder,
} from '@proton/testing';
import { getHandlers } from '@proton/testing/lib/handlers';

import { authentication, getStoreWrapper, tick } from '../../../../helpers/test/render';
import { refresh } from '../../../../store/contacts/contactsActions';
import EmailReminderWidget from './EmailReminderWidget';

const server = setupServer(...getHandlers());

jest.mock('@proton/components/hooks/useNotifications');
jest.mock('@proton/components/hooks/useModals');
jest.mock('@proton/components/hooks/useApi');
jest.mock('@proton/components/hooks/useGetCalendarEventRaw');
jest.mock('@proton/components/hooks/useAddresses');
jest.mock('@proton/components/hooks/useUserSettings');

jest.mock('./EventReminderText', () => ({
    __esModule: true,
    default: jest.fn(() => <span>EventReminderText</span>),
}));
jest.mock('@proton/components/components/calendarEventDateHeader/CalendarEventDateHeader', () => ({
    __esModule: true,
    default: jest.fn(() => <span>DateHeader</span>),
}));
jest.mock('@proton/components/hooks/useConfig', () => () => ({ APP_NAME: 'proton-calendar', APP_VERSION: 'test' }));

// Force narrow mode for "renders the widget and the necessary information" so that we can see the link
// With the drawer we do not have a AppLink anymore, we will open Calendar in the drawer directly
jest.mock('@proton/components/hooks/useActiveBreakpoint', () => () => {
    return mockDefaultBreakpoints;
});

jest.mock('@proton/components/hooks/useUser', () => ({
    __esModule: true,
    default: jest.fn(() => [
        [
            {
                ID: 'id',
            },
        ],
    ]),
    useGetUser: jest.fn(
        () => () =>
            Promise.resolve([
                [
                    {
                        ID: 'id',
                    },
                ],
            ])
    ),
}));

jest.mock('@proton/mail/mailSettings/hooks', () => ({
    useMailSettings: jest.fn(() => [{}, false]),
}));

const mockedUseApi = mocked(useApi);
const mockedUseNotifications = mocked(useNotifications);
const mockedUseGetCalendarEventRaw = mocked(useGetCalendarEventRaw);
const mockedUseAddresses = mocked(useAddresses);
const mockedUseGetAddresses = mocked(useGetAddresses);
const mockedUserSettings = mocked(useUserSettings);

function renderComponent(overrides?: any, preloadedState?: Parameters<typeof getStoreWrapper>[0]) {
    window.history.pushState({}, 'Calendar', '/');

    const { Wrapper: ReduxWrapper, store } = getStoreWrapper({
        calendars: getModelState([calendarBuilder()]),
        calendarUserSettings: getModelState(calendarUserSettingsBuilder()),
        ...preloadedState,
    });

    const Wrapper = ({ children }: any) => (
        <ReduxWrapper>
            <AuthenticationProvider store={authentication}>
                <CacheProvider cache={createCache()}>
                    <DrawerProvider>
                        <BrowserRouter>{children}</BrowserRouter>
                    </DrawerProvider>
                </CacheProvider>
            </AuthenticationProvider>
        </ReduxWrapper>
    );
    store.dispatch(refresh({ contacts: [], contactGroups: [] }));

    return {
        ...render(<EmailReminderWidget message={messageBuilder({ overrides })} />, { wrapper: Wrapper }),
        skeleton: screen.queryByTestId('calendar-widget-widget-skeleton') as HTMLDivElement,
    };
}

describe('EmailReminderWidget', () => {
    beforeAll(() => {
        // Initialize contactsMap
        server.listen();
    });

    afterAll(() => server.close());

    beforeEach(() => {
        mockedUseApi.mockImplementation(() => mockApiWithServer);
        mockedUseNotifications.mockImplementation(() => mockNotifications);
    });

    afterEach(() => {
        server.resetHandlers();
        jest.clearAllMocks();
    });

    beforeEach(() => {
        mockedUseGetCalendarEventRaw.mockImplementation(
            () => () =>
                Promise.resolve({
                    verificationStatus: VERIFICATION_STATUS.SIGNED_AND_VALID,
                    hasDefaultNotifications: true,
                    selfAddressData: { isOrganizer: false, isAttendee: false },
                    veventComponent: veventBuilder(),
                    encryptionData: {
                        encryptingAddressID: undefined,
                        sharedSessionKey: undefined,
                        calendarSessionKey: undefined,
                    },
                })
        );
        const address = addressBuilder({});
        mockedUseAddresses.mockImplementation(() => [[address], false]);
        mockedUseGetAddresses.mockImplementation(() => async () => [address]);
        mockedUserSettings.mockImplementation(() => [
            { HideSidePanel: DRAWER_VISIBILITY.HIDE } as UserSettings,
            false,
            {} as Error,
        ]);
        server.use(
            http.get(
                `/core/v4/features`,
                () => {
                    return new HttpResponse('{}');
                },
                { once: true }
            )
        );
    });

    it('does not render anything when necessary headers are not present', () => {
        const { container } = renderComponent({ ParsedHeaders: {} });

        expect(container).toBeEmptyDOMElement();
    });

    it('renders the widget and the necessary information', async () => {
        const { skeleton } = renderComponent();

        expect(skeleton).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText(/DateHeader/)).toBeInTheDocument();
        });

        await tick();

        expect((screen.getByText(new RegExp(`Open in ${CALENDAR_APP_NAME}`)) as HTMLAnchorElement).href).toBe(
            `http://localhost/event?Action=VIEW&EventID=${encodeURIComponent(
                calendarEventBuilder().ID
            )}&CalendarID=${encodeURIComponent(calendarBuilder().ID)}&RecurrenceID=${encodeURIComponent(
                `${messageBuilder()?.ParsedHeaders['X-Pm-Calendar-Occurrence']}`
            )}`
        );
        expect(screen.getByText(veventBuilder().summary!.value)).toBeInTheDocument();
        expect(screen.getByText(veventBuilder().location!.value)).toBeInTheDocument();
        expect(screen.getByText(/Organizer/)).toBeInTheDocument();

        expect(screen.getByText(/EventReminderText/)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Show' }));

        expect(screen.getByText(/visionary@proton.black/)).toBeInTheDocument();
        expect(screen.getByText(/calendar@proton.black/)).toBeInTheDocument();
    });

    it('renders the widget when the event has been cancelled', async () => {
        server.use(
            http.get(
                `/calendar/v1/:calendarId/events/:eventId`,
                () => {
                    return HttpResponse.json({
                        Event: calendarEventBuilder({
                            traits: 'canceled',
                        }),
                    });
                },
                { once: true }
            )
        );

        const { skeleton } = renderComponent();

        expect(skeleton).toBeInTheDocument();
        await screen.findByText(/Event was canceled/);

        await tick();

        expect(screen.queryByText(new RegExp(`Open in ${CALENDAR_APP_NAME}`))).toBeInTheDocument();
    });

    it('displays an error instead of the widget when there has been a breaking change', async () => {
        mockedUseGetCalendarEventRaw.mockImplementation(
            () => () =>
                Promise.resolve({
                    verificationStatus: VERIFICATION_STATUS.SIGNED_AND_VALID,
                    hasDefaultNotifications: true,
                    selfAddressData: { isOrganizer: false, isAttendee: false },
                    veventComponent: veventBuilder({ overrides: { sequence: { value: 2 } } }),
                    encryptionData: {
                        encryptingAddressID: undefined,
                        sharedSessionKey: undefined,
                        calendarSessionKey: undefined,
                    },
                })
        );

        const { skeleton } = renderComponent();

        expect(skeleton).toBeInTheDocument();
        await screen.findByText(/Event was updated. This reminder is out-of-date./);
        expect(screen.queryByText(new RegExp(`Open in ${CALENDAR_APP_NAME}`))).not.toBeInTheDocument();
    });

    it('displays an error instead of the widget when the event does not exist anymore', async () => {
        server.use(
            http.get(
                `/calendar/v1/:calendarId/events/:eventId`,
                () => {
                    return new HttpResponse(null, { status: 404 });
                },
                { once: true }
            )
        );

        const { skeleton } = renderComponent();

        expect(skeleton).toBeInTheDocument();

        await screen.findByText(new RegExp('Event is no longer in your calendar'));

        expect(screen.queryByText(new RegExp(`Open in ${CALENDAR_APP_NAME}`))).not.toBeInTheDocument();
    });

    describe('decryption error', () => {
        beforeEach(() => {
            mockedUseGetCalendarEventRaw.mockImplementation(
                // eslint-disable-next-line prefer-promise-reject-errors
                () => () => Promise.reject({ message: 'DECRYPTION_FAILED' })
            );
        });

        describe('needs user action', () => {
            async function displaysErrorWithoutButtonInsteadOfWidget(calendars: VisualCalendar[]) {
                const { skeleton } = renderComponent(undefined, { calendars: getModelState(calendars) });

                expect(skeleton).toBeInTheDocument();

                await screen.findByText(
                    /Event details are encrypted. Sign in again to restore Calendar and decrypt your data./
                );

                expect(screen.queryByText(new RegExp(`Open in ${CALENDAR_APP_NAME}`))).not.toBeInTheDocument();
                expect(screen.queryByText(/Learn more/)).toBeInTheDocument();
                expect(screen.queryByText(new RegExp(`Open ${CALENDAR_APP_NAME}`))).toBeInTheDocument();
            }

            it('displays an error instead of the widget when the calendar needs a reset', async () => {
                await displaysErrorWithoutButtonInsteadOfWidget([calendarBuilder({ traits: 'resetNeeded' })]);
            });

            it('displays an error instead of the widget when the calendar needs a passphrase update', async () => {
                const calendar = calendarBuilder({ traits: 'updatePassphrase' });

                server.use(
                    http.get(
                        `/calendar/v1/${calendar.ID}/keys/all`,
                        () => {
                            return HttpResponse.json({});
                        },
                        { once: true }
                    ),
                    http.get(
                        `/calendar/v1/${calendar.ID}/passphrases`,
                        () => {
                            return HttpResponse.json({});
                        },
                        { once: true }
                    ),
                    http.get(
                        `/calendar/v1/${calendar.ID}/members`,
                        () => {
                            return HttpResponse.json({});
                        },
                        { once: true }
                    )
                );

                await displaysErrorWithoutButtonInsteadOfWidget([calendar]);
            });
        });

        describe('does not need user action', () => {
            it('displays an error instead of the widget when the event cannot be decrypted', async () => {
                const { skeleton } = renderComponent();

                expect(skeleton).toBeInTheDocument();

                await screen.findByText(new RegExp('Event details cannot be decrypted.'));
                expect(screen.queryByText(new RegExp(`Open in ${CALENDAR_APP_NAME}`))).not.toBeInTheDocument();
                expect(screen.queryByText(new RegExp('Why not?'))).toBeInTheDocument();
            });
        });
    });

    async function errorAndNoWidget(skeleton: Nullable<HTMLDivElement>) {
        expect(skeleton).toBeInTheDocument();
        await screen.findByText(/Event is no longer in your calendar/);
        expect(screen.queryByText(/DateHeader/)).not.toBeInTheDocument();
    }

    it('displays an error and no widget if the `until` is expired', async () => {
        mockedUseGetCalendarEventRaw.mockImplementation(
            () => () =>
                Promise.resolve({
                    hasDefaultNotifications: true,
                    verificationStatus: VERIFICATION_STATUS.SIGNED_AND_VALID,
                    selfAddressData: { isOrganizer: false, isAttendee: false },
                    veventComponent: {
                        ...veventBuilder(),
                        // override manually as overrides does not work for undefined properties in the builder
                        rrule: {
                            value: {
                                freq: 'DAILY',
                                until: {
                                    ...veventBuilder().dtstart.value,
                                    day: addDays(toUTCDate(veventBuilder().dtstart.value), -1).getDate(),
                                },
                            },
                        },
                    },
                    encryptionData: {
                        encryptingAddressID: undefined,
                        sharedSessionKey: undefined,
                        calendarSessionKey: undefined,
                    },
                })
        );

        const { skeleton } = renderComponent();

        await errorAndNoWidget(skeleton);
    });

    it('displays an error and no widget if the count is not matched', async () => {
        mockedUseGetCalendarEventRaw.mockImplementation(
            () => () =>
                Promise.resolve({
                    hasDefaultNotifications: true,
                    verificationStatus: VERIFICATION_STATUS.SIGNED_AND_VALID,
                    selfAddressData: { isOrganizer: false, isAttendee: false },
                    veventComponent: {
                        ...veventBuilder(),
                        // override manually as overrides does not work for undefined properties in the builder
                        rrule: {
                            value: {
                                freq: 'DAILY',
                                count: 1,
                            },
                        },
                    },
                    encryptionData: {
                        encryptingAddressID: undefined,
                        sharedSessionKey: undefined,
                        calendarSessionKey: undefined,
                    },
                })
        );

        const { skeleton } = renderComponent({
            ParsedHeaders: {
                ...messageBuilder().ParsedHeaders,
                'X-Pm-Calendar-Occurrence': `${new Date(2050, 12, 12).getTime() / 1000}`,
            },
        });

        await errorAndNoWidget(skeleton);
    });

    it('displays an error and no widget if the occurrence is in exdates (the occurrence has been removed from the chain)', async () => {
        server.use(
            http.get(
                `/calendar/v1/events`,
                () => {
                    return HttpResponse.json({
                        Events: [calendarEventBuilder(), { Exdates: [123] }],
                    });
                },
                { once: true }
            )
        );

        const { skeleton } = renderComponent({
            ParsedHeaders: {
                ...messageBuilder().ParsedHeaders,
                'X-Pm-Calendar-Eventisrecurring': '1',
                'X-Pm-Calendar-Occurrence': '123',
                'X-Pm-Calendar-Calendarid': '321',
            },
        });

        await errorAndNoWidget(skeleton);
    });

    it('displays an error and no widget if there are no events found with recurring header', async () => {
        server.use(
            http.get(
                `/calendar/v1/events`,
                () => {
                    return HttpResponse.json({
                        Events: [],
                    });
                },
                { once: true }
            )
        );

        const { skeleton } = renderComponent({
            ParsedHeaders: {
                ...messageBuilder().ParsedHeaders,
                'X-Pm-Calendar-Eventisrecurring': '1',
            },
        });

        await errorAndNoWidget(skeleton);
    });

    it('displays an error and no widget if there are no events found with the first event API call fails', async () => {
        server.use(
            http.get(`/calendar/v1/:calendarId/events/:eventId`, () => {
                return HttpResponse.json({ Error: 'Anything can happen' }, { status: 422 });
            })
        );

        server.use(
            http.get(
                `/calendar/v1/events`,
                () => {
                    return HttpResponse.json({
                        Events: [],
                    });
                },
                { once: true }
            )
        );

        const { skeleton } = renderComponent();

        await errorAndNoWidget(skeleton);
    });

    it('falls back to calling by uid in case the main api call fails', async () => {
        server.use(
            http.get(`/calendar/v1/:calendarId/events/:eventId`, () => {
                return HttpResponse.json({ Error: 'Anything can happen' }, { status: 422 });
            })
        );
        server.use(
            http.get(
                `/calendar/v1/events`,
                () => {
                    return HttpResponse.json({
                        Events: [calendarEventBuilder()],
                    });
                },
                { once: true }
            )
        );

        const { skeleton } = renderComponent();

        expect(skeleton).toBeInTheDocument();
        await screen.findByText(/DateHeader/);
    });

    it('displays a generic error when both event API calls fail', async () => {
        server.use(
            http.get(`/calendar/v1/:calendarId/events/:eventId`, () => {
                return HttpResponse.json({ Error: 'Anything can happen' }, { status: 422 });
            })
        );

        server.use(
            http.get(`/calendar/v1/events`, () => {
                return HttpResponse.json({ Error: 'Anything can happen in the fallback' }, { status: 422 });
            })
        );

        const { skeleton } = renderComponent();

        expect(skeleton).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByText(/DateHeader/)).not.toBeInTheDocument());
        expect(mockedUseNotifications().createNotification).toHaveBeenCalledWith({
            type: 'error',
            text: 'Unknown error',
        });
    });
});
