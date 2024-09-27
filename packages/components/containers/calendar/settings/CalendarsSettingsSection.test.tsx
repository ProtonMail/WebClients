import { Router } from 'react-router';

import { render, screen, within } from '@testing-library/react';
import { createMemoryHistory } from 'history';

import { type IconName } from '@proton/components/components/icon/Icon';
import { MAX_CALENDARS_FREE, MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import {
    ADDRESS_RECEIVE,
    ADDRESS_SEND,
    ADDRESS_STATUS,
    BRAND_NAME,
    MAIL_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import type { RequireOnly, Subscription, UserModel } from '@proton/shared/lib/interfaces';
import type { SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import {
    addressBuilder,
    generateHolidaysCalendars,
    generateOwnedPersonalCalendars,
    generateSharedCalendars,
    generateSubscribedCalendars,
} from '@proton/testing/lib/builders';
import { mockUseAuthentication } from '@proton/testing/lib/mockUseAuthentication';

import type { CalendarsSettingsSectionProps } from './CalendarsSettingsSection';
import CalendarsSettingsSection from './CalendarsSettingsSection';

jest.mock('../../../hooks/useCalendarShareInvitations', () =>
    jest.fn().mockReturnValue({
        loading: false,
        invitations: [],
    })
);
jest.mock('../../../hooks/useCalendarShareInvitationActions', () =>
    jest.fn().mockReturnValue({
        accept: () => {},
        reject: () => {},
    })
);
jest.mock('../../../hooks/useConfig', () => () => ({
    CLIENT_TYPE: 1,
    CLIENT_SECRET: 'not_so_secret',
    APP_VERSION: 'test',
    APP_NAME: 'proton-calendar',
    API_URL: 'api',
    LOCALES: {},
    DATE_VERSION: 'test',
    COMMIT: 'test',
    BRANCH: 'test',
    SENTRY_DSN: 'test',
    VERSION_PATH: 'test',
}));
jest.mock('../../../hooks/useAppTitle', () => jest.fn().mockReturnValue(undefined));
jest.mock('../../../hooks/useApi', () => jest.fn(() => jest.fn().mockResolvedValue({})));

jest.mock('../../../hooks/useEventManager', () => () => ({}));
jest.mock('../../eventManager/calendar/useCalendarsInfoListener', () => () => ({}));
jest.mock('../../eventManager/calendar/CalendarModelEventManagerProvider', () => ({
    useCalendarModelEventManager: jest.fn(() => ({ call: jest.fn() })),
}));
jest.mock('@proton/components/hooks/useNotifications', () => () => ({}));
jest.mock('@proton/features/useFeature', () => jest.fn(() => ({ feature: { Value: true } })));
jest.mock('@proton/components/hooks/useEarlyAccess', () => () => ({}));

jest.mock('@proton/calendar/holidaysDirectory/hooks', () => ({
    __esModule: true,
    default: jest.fn(() => []),
}));

let memoryHistory = createMemoryHistory();

const renderComponent = ({
    user,
    addresses = [addressBuilder()],
    calendars,
    myCalendars,
    subscribedCalendars,
    sharedCalendars,
    unknownCalendars = [],
    holidaysCalendars = [],
}: RequireOnly<
    CalendarsSettingsSectionProps,
    'user' | 'calendars' | 'myCalendars' | 'sharedCalendars' | 'subscribedCalendars'
>) => {
    const config = {
        icon: 'calendar' as IconName,
        to: '/calendars',
        text: 'Calendars',
        subsections: [
            { text: 'My calendars', id: 'my-calendars' },
            { text: 'Other calendars', id: 'other-calendars' },
        ],
    };

    const subscription = {} as Subscription;
    mockUseAuthentication({ mode: '' } as any);

    render(
        <Router history={memoryHistory}>
            <CalendarsSettingsSection
                config={config}
                user={user}
                subscription={subscription}
                addresses={addresses}
                calendars={calendars}
                myCalendars={myCalendars}
                subscribedCalendars={subscribedCalendars}
                sharedCalendars={sharedCalendars}
                holidaysCalendars={holidaysCalendars}
                unknownCalendars={unknownCalendars}
            />
        </Router>
    );
};

describe('My calendars section', () => {
    const createCalendarText = `Create calendar`;
    const addCalendarText = `Add calendar from URL`;
    const addHolidaysCalendarText = `Add public holidays`;
    const limitReachedFreeText = `You've reached the maximum number of calendars available in your plan. To add a new calendar, remove another calendar or upgrade your ${BRAND_NAME} plan to a ${MAIL_SHORT_APP_NAME} paid plan.`;
    const limitReachedPaidText = `You've reached the maximum number of calendars available in your plan. To add a new calendar, remove an existing one.`;

    describe('for a Mail free user', () => {
        it('allows the user to create both personal and other calendars if under the limit', () => {
            const user = { isFree: false, hasPaidMail: false, hasNonDelinquentScope: true } as UserModel;

            const myCalendars: VisualCalendar[] = [];
            const sharedCalendars: VisualCalendar[] = [];
            const subscribedCalendars = generateSubscribedCalendars(1);
            const calendars = [...myCalendars, ...sharedCalendars, ...subscribedCalendars];

            renderComponent({
                user,
                calendars,
                myCalendars,
                sharedCalendars,
                subscribedCalendars,
            });

            expect(screen.queryAllByText(limitReachedFreeText)).toHaveLength(0);
            expect(screen.queryAllByText(createCalendarText)).toHaveLength(1);
            expect(screen.queryAllByText(addCalendarText)).toHaveLength(1);
            expect(screen.queryAllByText(addHolidaysCalendarText)).toHaveLength(1);
        });

        it('displays the limit reached message in both "My calendars" and "Other calendars" section when the user reaches the calendar limit with personal owned calendars', () => {
            const user = { isFree: false, hasPaidMail: false, hasNonDelinquentScope: true } as UserModel;

            const myCalendars = generateOwnedPersonalCalendars(MAX_CALENDARS_FREE);
            const sharedCalendars: VisualCalendar[] = [];
            const subscribedCalendars: SubscribedCalendar[] = [];
            const calendars = [...myCalendars, ...sharedCalendars, ...subscribedCalendars];

            renderComponent({
                user,
                calendars,
                myCalendars,
                sharedCalendars,
                subscribedCalendars,
            });

            expect(screen.queryAllByText(limitReachedFreeText)).toHaveLength(2);
            expect(screen.queryAllByText(createCalendarText)).toHaveLength(0);
            expect(screen.queryAllByText(addCalendarText)).toHaveLength(0);
        });

        it('displays the limit reached message only in "Other calendars" section when the user reached the calendar limit with shared and subscribed calendars (only possible for pre-plans-migration users), and allows creation of owned personal calendars', () => {
            const user = { isFree: false, hasPaidMail: false, hasNonDelinquentScope: true } as UserModel;

            const myCalendars: VisualCalendar[] = [];
            const sharedCalendars = generateSharedCalendars(MAX_CALENDARS_FREE - 2);
            const subscribedCalendars = generateSubscribedCalendars(2);
            const calendars = [...myCalendars, ...sharedCalendars, ...subscribedCalendars];

            renderComponent({
                user,
                calendars,
                myCalendars,
                sharedCalendars,
                subscribedCalendars,
            });

            expect(screen.queryAllByText(limitReachedFreeText)).toHaveLength(1);
            expect(screen.queryAllByText(createCalendarText)).toHaveLength(1);
        });

        it('prevents user from creating MAX_CALENDARS_FREE other calendars by displaying limit reached message', () => {
            const user = { isFree: false, hasPaidMail: false, hasNonDelinquentScope: true } as UserModel;

            const myCalendars: VisualCalendar[] = [];
            const sharedCalendars = generateSharedCalendars(1);
            const subscribedCalendars = generateSubscribedCalendars(MAX_CALENDARS_FREE - 2);
            const calendars = [...myCalendars, ...sharedCalendars, ...subscribedCalendars];

            renderComponent({
                user,
                calendars,
                myCalendars,
                sharedCalendars,
                subscribedCalendars,
            });

            expect(screen.queryAllByText(limitReachedFreeText)).toHaveLength(1);
            expect(screen.queryAllByText(createCalendarText)).toHaveLength(1);
            expect(screen.queryAllByText(addCalendarText)).toHaveLength(0);
            expect(screen.queryAllByText(addHolidaysCalendarText)).toHaveLength(0);
        });

        it('prevents user without active addresses from creating personal or other calendars', () => {
            const user = { isFree: true, hasPaidMail: false, hasNonDelinquentScope: true } as UserModel;
            const addresses = [
                {
                    ...addressBuilder(),
                    Receive: ADDRESS_RECEIVE.RECEIVE_NO,
                    Send: ADDRESS_SEND.SEND_NO,
                    Status: ADDRESS_STATUS.STATUS_DISABLED,
                },
            ];

            const myCalendars = generateOwnedPersonalCalendars(0);
            const sharedCalendars = generateSharedCalendars(0);
            const subscribedCalendars = generateSubscribedCalendars(0);
            const calendars = [...myCalendars, ...sharedCalendars, ...subscribedCalendars];

            renderComponent({
                user,
                addresses,
                calendars,
                myCalendars,
                sharedCalendars,
                subscribedCalendars,
            });

            const createCalendarButton = screen.getByText(createCalendarText);
            const addCalendarButton = screen.getByText(addCalendarText);
            const addHolidaysCalendarButton = screen.getByText(addHolidaysCalendarText);

            expect(screen.queryAllByText(limitReachedPaidText)).toHaveLength(0);
            expect(createCalendarButton).toBeInTheDocument();
            expect(createCalendarButton).toBeDisabled();
            expect(addCalendarButton).toBeInTheDocument();
            expect(addCalendarButton).toBeDisabled();
            expect(addHolidaysCalendarButton).toBeInTheDocument();
            expect(addHolidaysCalendarButton).toBeDisabled();
        });

        it('prevents delinquent user from creating personal or other calendars', () => {
            const user = { isFree: true, hasPaidMail: false, hasNonDelinquentScope: false } as UserModel;

            const myCalendars = generateOwnedPersonalCalendars(0);
            const sharedCalendars = generateSharedCalendars(0);
            const subscribedCalendars = generateSubscribedCalendars(0);
            const calendars = [...myCalendars, ...sharedCalendars, ...subscribedCalendars];

            renderComponent({
                user,
                calendars,
                myCalendars,
                sharedCalendars,
                subscribedCalendars,
            });

            const createCalendarButton = screen.getByText(createCalendarText);
            const addCalendarButton = screen.getByText(addCalendarText);
            const addHolidaysCalendarButton = screen.getByText(addHolidaysCalendarText);

            expect(screen.queryAllByText(limitReachedPaidText)).toHaveLength(0);
            expect(createCalendarButton).toBeInTheDocument();
            expect(createCalendarButton).toBeDisabled();
            expect(addCalendarButton).toBeInTheDocument();
            expect(addCalendarButton).toBeDisabled();
            expect(addHolidaysCalendarButton).toBeInTheDocument();
            expect(addHolidaysCalendarButton).toBeDisabled();
        });
    });

    describe('for a Mail paid user', () => {
        it('allows the user to create both personal and other calendars if under the limit', () => {
            const user = { isFree: false, hasPaidMail: true, hasNonDelinquentScope: true } as UserModel;

            const myCalendars = generateOwnedPersonalCalendars(7);
            const sharedCalendars = generateSharedCalendars(4);
            const subscribedCalendars = generateSubscribedCalendars(5);
            const calendars = [...myCalendars, ...sharedCalendars, ...subscribedCalendars];

            renderComponent({
                user,
                calendars,
                myCalendars,
                sharedCalendars,
                subscribedCalendars,
            });

            expect(screen.queryAllByText(limitReachedFreeText)).toHaveLength(0);
            expect(screen.queryAllByText(createCalendarText)).toHaveLength(1);
            expect(screen.queryAllByText(addCalendarText)).toHaveLength(1);
            expect(screen.queryAllByText(addHolidaysCalendarText)).toHaveLength(1);
        });

        it('displays the limit reached message in both "My calendars" and "Other calendars" section when the user reaches the calendar limit with personal owned calendars', () => {
            const user = { isFree: false, hasPaidMail: true, hasNonDelinquentScope: true } as UserModel;

            const myCalendars = generateOwnedPersonalCalendars(MAX_CALENDARS_PAID);
            const sharedCalendars: VisualCalendar[] = [];
            const subscribedCalendars: SubscribedCalendar[] = [];
            const calendars = [...myCalendars, ...sharedCalendars, ...subscribedCalendars];

            renderComponent({
                user,
                calendars,
                myCalendars,
                sharedCalendars,
                subscribedCalendars,
            });

            expect(screen.queryAllByText(limitReachedPaidText)).toHaveLength(2);
            expect(screen.queryAllByText(createCalendarText)).toHaveLength(0);
            expect(screen.queryAllByText(addCalendarText)).toHaveLength(0);
            expect(screen.queryAllByText(addHolidaysCalendarText)).toHaveLength(0);
        });

        it('prevents user from creating MAX_CALENDARS_PAID other calendars by display limit reached message', () => {
            const user = { isFree: false, hasPaidMail: true, hasNonDelinquentScope: true } as UserModel;

            const myCalendars: VisualCalendar[] = [];
            const sharedCalendars = generateSharedCalendars(MAX_CALENDARS_PAID - 2);
            const subscribedCalendars = generateSubscribedCalendars(1);
            const calendars = [...myCalendars, ...sharedCalendars, ...subscribedCalendars];

            renderComponent({
                user,
                calendars,
                myCalendars,
                sharedCalendars,
                subscribedCalendars,
            });

            expect(screen.queryAllByText(limitReachedPaidText)).toHaveLength(1);
            expect(screen.queryAllByText(createCalendarText)).toHaveLength(1);
            expect(screen.queryAllByText(addCalendarText)).toHaveLength(0);
            expect(screen.queryAllByText(addHolidaysCalendarText)).toHaveLength(0);
        });

        it('prevents user without active addresses from creating personal or other calendars', () => {
            const user = { isFree: false, hasPaidMail: true, hasNonDelinquentScope: true } as UserModel;
            const addresses = [
                {
                    ...addressBuilder(),
                    Receive: ADDRESS_RECEIVE.RECEIVE_NO,
                    Send: ADDRESS_SEND.SEND_NO,
                    Status: ADDRESS_STATUS.STATUS_DISABLED,
                },
            ];

            const myCalendars = generateOwnedPersonalCalendars(2);
            const sharedCalendars = generateSharedCalendars(0);
            const subscribedCalendars = generateSubscribedCalendars(0);
            const calendars = [...myCalendars, ...sharedCalendars, ...subscribedCalendars];

            renderComponent({
                user,
                addresses,
                calendars,
                myCalendars,
                sharedCalendars,
                subscribedCalendars,
            });

            const createCalendarButton = screen.getByText(createCalendarText);
            const addCalendarButton = screen.getByText(addCalendarText);
            const addHolidaysCalendarButton = screen.getByText(addHolidaysCalendarText);

            expect(screen.queryAllByText(limitReachedPaidText)).toHaveLength(0);
            expect(createCalendarButton).toBeInTheDocument();
            expect(createCalendarButton).toBeDisabled();
            expect(addCalendarButton).toBeInTheDocument();
            expect(addCalendarButton).toBeDisabled();
            expect(addHolidaysCalendarButton).toBeInTheDocument();
            expect(addHolidaysCalendarButton).toBeDisabled();
        });

        it('prevents delinquent user from creating personal or other calendars', () => {
            const user = { isFree: false, hasPaidMail: true, hasNonDelinquentScope: false } as UserModel;

            const myCalendars = generateOwnedPersonalCalendars(1);
            const sharedCalendars = generateSharedCalendars(1);
            const subscribedCalendars = generateSubscribedCalendars(1);
            const calendars = [...myCalendars, ...sharedCalendars, ...subscribedCalendars];

            renderComponent({
                user,
                calendars,
                myCalendars,
                sharedCalendars,
                subscribedCalendars,
            });

            const createCalendarButton = screen.getByText(createCalendarText);
            const addCalendarButton = screen.getByText(addCalendarText);
            const addHolidaysCalendarButton = screen.getByText(addHolidaysCalendarText);

            expect(screen.queryAllByText(limitReachedPaidText)).toHaveLength(0);
            expect(createCalendarButton).toBeInTheDocument();
            expect(createCalendarButton).toBeDisabled();
            expect(addCalendarButton).toBeInTheDocument();
            expect(addCalendarButton).toBeDisabled();
            expect(addHolidaysCalendarButton).toBeInTheDocument();
            expect(addHolidaysCalendarButton).toBeDisabled();
        });
    });

    describe("displays user's calendars", () => {
        it('in their respective sections', async () => {
            const user = { isFree: false, hasPaidMail: true, hasNonDelinquentScope: true } as UserModel;

            const myCalendars = generateOwnedPersonalCalendars(2, [{ name: 'Calendar 1' }, { name: 'Calendar 2' }]);
            const subscribedCalendars = generateSubscribedCalendars(2, [
                { name: 'Calendar 3' },
                { name: 'Calendar 4' },
            ]);
            const sharedCalendars = generateSharedCalendars(2, [{ name: 'Calendar 5' }, { name: 'Calendar 6' }]);
            const holidaysCalendars = generateHolidaysCalendars(2, [{ name: 'Calendar 7' }, { name: 'Calendar 8' }]);

            const calendars = [...myCalendars, ...sharedCalendars, ...holidaysCalendars, ...subscribedCalendars];

            renderComponent({
                user,
                calendars,
                myCalendars,
                sharedCalendars,
                holidaysCalendars,
                subscribedCalendars,
            });

            const myCalendarsSection = await screen.findByTestId('my-calendars-section');
            const susbcribedCalendarsSection = await screen.findByTestId('subscribed-calendars-section');
            const sharedCalendarsSection = await screen.findByTestId('shared-calendars-section');
            const holidaysCalendarsSection = await screen.findByTestId('holidays-calendars-section');

            within(myCalendarsSection).getByText(myCalendars[0].Name);
            within(myCalendarsSection).getByText(myCalendars[1].Name);

            within(susbcribedCalendarsSection).getByText(subscribedCalendars[0].Name);
            within(susbcribedCalendarsSection).getByText(subscribedCalendars[1].Name);

            within(sharedCalendarsSection).getByText(`${sharedCalendars[0].Name} (${sharedCalendars[0].Owner.Email})`);
            within(sharedCalendarsSection).getByText(`${sharedCalendars[1].Name} (${sharedCalendars[1].Owner.Email})`);

            within(holidaysCalendarsSection).getByText(holidaysCalendars[0].Name);
            within(holidaysCalendarsSection).getByText(holidaysCalendars[1].Name);
        });
    });
});
