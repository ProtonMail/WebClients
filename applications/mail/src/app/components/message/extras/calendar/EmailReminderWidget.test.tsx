import { BrowserRouter } from 'react-router-dom';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { mocked } from 'jest-mock';

import { FeaturesProvider, useAddresses } from '@proton/components';
import AuthenticationProvider from '@proton/components/containers/authentication/Provider';
import { CacheProvider } from '@proton/components/containers/cache';
import useApi from '@proton/components/hooks/useApi';
import useGetCalendarEventRaw from '@proton/components/hooks/useGetCalendarEventRaw';
import useNotifications from '@proton/components/hooks/useNotifications';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/calendar/constants';
import { addDays } from '@proton/shared/lib/date-fns-utc';
import { toUTCDate } from '@proton/shared/lib/date/timezone';
import createCache from '@proton/shared/lib/helpers/cache';
import { Nullable } from '@proton/shared/lib/interfaces';
import { VERIFICATION_STATUS } from '@proton/srp/lib/constants';
import {
    addressBuilder,
    calendarBuilder,
    calendarEventBuilder,
    messageBuilder,
    mockApi,
    mockNotifications,
    rest,
    server,
    veventBuilder,
} from '@proton/testing';

import { authentication, tick } from '../../../../helpers/test/render';
import EmailReminderWidget from './EmailReminderWidget';

jest.mock('@proton/components/hooks/useNotifications');
jest.mock('@proton/components/hooks/useModals');
jest.mock('@proton/components/hooks/useApi');
jest.mock('@proton/components/hooks/useGetCalendarEventRaw');
jest.mock('@proton/components/hooks/useAddresses');

jest.mock('./EventReminderText', () => ({
    __esModule: true,
    default: jest.fn(() => <span>EventReminderText</span>),
}));
jest.mock('@proton/components/components/calendarEventDateHeader/CalendarEventDateHeader', () => ({
    __esModule: true,
    default: jest.fn(() => <span>DateHeader</span>),
}));
jest.mock('@proton/components/hooks/useConfig', () => () => ({ APP_NAME: 'proton-calendar', APP_VERSION: 'test' }));

const mockedUseApi = mocked(useApi);
const mockedUseNotifications = mocked(useNotifications);
const mockedUseGetCalendarEventRaw = mocked(useGetCalendarEventRaw);
const mockedUseAddresses = mocked(useAddresses);

function renderComponent(overrides?: any) {
    window.history.pushState({}, 'Calendar', '/');

    const Wrapper = ({ children }: any) => (
        <AuthenticationProvider store={authentication}>
            <CacheProvider cache={createCache()}>
                <FeaturesProvider>
                    <BrowserRouter>{children}</BrowserRouter>
                </FeaturesProvider>
            </CacheProvider>
        </AuthenticationProvider>
    );

    return {
        ...render(<EmailReminderWidget message={messageBuilder({ overrides })} />, { wrapper: Wrapper }),
        skeleton: screen.queryByTestId('calendar-widget-widget-skeleton') as HTMLDivElement,
    };
}

describe('EmailReminderWidget', () => {
    beforeAll(() => server.listen());

    afterAll(() => server.close());

    beforeEach(() => {
        mockedUseApi.mockImplementation(() => mockApi);
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
                    selfAddressData: { isOrganizer: false, isAttendee: false },
                    veventComponent: veventBuilder(),
                    encryptionData: {
                        encryptingAddressID: undefined,
                        sharedSessionKey: undefined,
                        calendarSessionKey: undefined,
                    },
                })
        );
        mockedUseAddresses.mockImplementation(() => [[addressBuilder({})], false, null]);
        server.use(
            rest.get(`/core/v4/features`, (req, res, ctx) => {
                return res.once(ctx.json({}));
            })
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

        fireEvent.click(screen.getByRole(/button/));

        expect(screen.getByText(/visionary@proton.black/)).toBeInTheDocument();
        expect(screen.getByText(/calendar@proton.black/)).toBeInTheDocument();
    });

    it('renders the widget when the event has been cancelled', async () => {
        server.use(
            rest.get(`/calendar/v1/:calendarId/events/:eventId`, (req, res, ctx) => {
                return res.once(
                    ctx.json({
                        Event: calendarEventBuilder({
                            traits: 'canceled',
                        }),
                    })
                );
            })
        );

        const { skeleton } = renderComponent();

        expect(skeleton).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByText(/Event was canceled/)).toBeInTheDocument());

        await tick();

        expect(screen.queryByText(new RegExp(`Open in ${CALENDAR_APP_NAME}`))).toBeInTheDocument();
    });

    it('displays an error instead of the widget when there has been a breaking change', async () => {
        mockedUseGetCalendarEventRaw.mockImplementation(
            () => () =>
                Promise.resolve({
                    verificationStatus: VERIFICATION_STATUS.SIGNED_AND_VALID,
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
        await waitFor(() =>
            expect(screen.queryByText(/Event was updated. This reminder is out-of-date./)).toBeInTheDocument()
        );
        expect(screen.queryByText(new RegExp(`Open in ${CALENDAR_APP_NAME}`))).not.toBeInTheDocument();
    });

    it('displays an error instead of the widget when the event does not exist anymore', async () => {
        server.use(
            rest.get(`/calendar/v1/:calendarId/events/:eventId`, (req, res, ctx) => {
                return res.once(ctx.status(404));
            })
        );

        const { skeleton } = renderComponent();

        expect(skeleton).toBeInTheDocument();

        await waitFor(() =>
            expect(screen.queryByText(new RegExp('Event is no longer in your calendar'))).toBeInTheDocument()
        );

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
            async function displaysErrorWithoutButtonInsteadOfWidget() {
                const { skeleton } = renderComponent();

                expect(skeleton).toBeInTheDocument();

                await waitFor(() =>
                    expect(
                        screen.queryByText(
                            /Event details are encrypted. Sign in again to restore Calendar and decrypt your data./
                        )
                    ).toBeInTheDocument()
                );

                expect(screen.queryByText(new RegExp(`Open in ${CALENDAR_APP_NAME}`))).not.toBeInTheDocument();
                expect(screen.queryByText(/Learn more/)).toBeInTheDocument();
                expect(screen.queryByText(new RegExp(`Open ${CALENDAR_APP_NAME}`))).toBeInTheDocument();
            }

            it('displays an error instead of the widget when the calendar needs a reset', async () => {
                server.use(
                    rest.get(`/calendar/v1`, (req, res, ctx) => {
                        return res.once(
                            ctx.json({
                                Calendars: [calendarBuilder({ traits: 'resetNeeded' })],
                            })
                        );
                    })
                );

                await displaysErrorWithoutButtonInsteadOfWidget();
            });

            it('displays an error instead of the widget when the calendar needs a passphrase update', async () => {
                const calendar = calendarBuilder({ traits: 'updatePassphrase' });

                server.use(
                    rest.get(`/calendar/v1`, (req, res, ctx) => {
                        return res.once(
                            ctx.json({
                                Calendars: [calendar],
                            })
                        );
                    }),
                    rest.get(`/calendar/v1/${calendar.ID}/keys/all`, (req, res, ctx) => {
                        return res.once(ctx.json({}));
                    }),
                    rest.get(`/calendar/v1/${calendar.ID}/passphrases`, (req, res, ctx) => {
                        return res.once(ctx.json({}));
                    }),
                    rest.get(`/calendar/v1/${calendar.ID}/members`, (req, res, ctx) => {
                        return res.once(ctx.json({}));
                    })
                );

                await displaysErrorWithoutButtonInsteadOfWidget();
            });
        });

        describe('does not need user action', () => {
            it('displays an error instead of the widget when the event cannot be decrypted', async () => {
                const { skeleton } = renderComponent();

                expect(skeleton).toBeInTheDocument();

                await waitFor(() =>
                    expect(screen.queryByText(new RegExp('Event details cannot be decrypted.'))).toBeInTheDocument()
                );
                expect(screen.queryByText(new RegExp(`Open in ${CALENDAR_APP_NAME}`))).not.toBeInTheDocument();
                expect(screen.queryByText(new RegExp('Why not?'))).toBeInTheDocument();
            });
        });
    });

    async function errorAndNoWidget(skeleton: Nullable<HTMLDivElement>) {
        expect(skeleton).toBeInTheDocument();
        await waitFor(() => expect(screen.getByText(/Event is no longer in your calendar/)).toBeInTheDocument());
        expect(screen.queryByText(/DateHeader/)).not.toBeInTheDocument();
    }

    it('displays an error and no widget if the `until` is expired', async () => {
        mockedUseGetCalendarEventRaw.mockImplementation(
            () => () =>
                Promise.resolve({
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
            rest.get(`/calendar/v1/events`, (req, res, ctx) => {
                return res.once(
                    ctx.json({
                        Events: [calendarEventBuilder(), { Exdates: [123] }],
                    })
                );
            })
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
            rest.get(`/calendar/v1/events`, (req, res, ctx) => {
                return res.once(
                    ctx.json({
                        Events: [],
                    })
                );
            })
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
            rest.get(`/calendar/v1/:calendarId/events/:eventId`, () => {
                throw new Error('Anything can happen');
            })
        );

        server.use(
            rest.get(`/calendar/v1/events`, (req, res, ctx) => {
                return res.once(
                    ctx.json({
                        Events: [],
                    })
                );
            })
        );

        const { skeleton } = renderComponent();

        await errorAndNoWidget(skeleton);
    });

    it('falls back to calling by uid in case the main api call fails', async () => {
        server.use(
            rest.get(`/calendar/v1/:calendarId/events/:eventId`, () => {
                throw new Error('Anything can happen');
            })
        );
        server.use(
            rest.get(`/calendar/v1/events`, (req, res, ctx) => {
                return res.once(
                    ctx.json({
                        Events: [calendarEventBuilder()],
                    })
                );
            })
        );

        const { skeleton } = renderComponent();

        expect(skeleton).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByText(/DateHeader/)).toBeInTheDocument());
    });

    it('displays a generic error when both event API calls fail', async () => {
        server.use(
            rest.get(`/calendar/v1/:calendarId/events/:eventId`, () => {
                throw new Error('Anything can happen');
            })
        );

        server.use(
            rest.get(`/calendar/v1/events`, () => {
                throw new Error('Anything can happen in the fallback');
            })
        );

        const { skeleton } = renderComponent();

        expect(skeleton).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByText(/DateHeader/)).not.toBeInTheDocument());
        expect(mockedUseNotifications().createNotification).toHaveBeenCalledWith({
            type: 'error',
            text: expect.stringContaining('Anything can happen in the fallback'),
        });
    });
});
