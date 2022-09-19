import React from 'react';
import { Router } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';

import { CALENDAR_FLAGS, MAX_CALENDARS_FREE, MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import { MEMBER_PERMISSIONS } from '@proton/shared/lib/calendar/permissions';
import createCache from '@proton/shared/lib/helpers/cache';
import { UserModel } from '@proton/shared/lib/interfaces';
import { CALENDAR_DISPLAY, CALENDAR_TYPE } from '@proton/shared/lib/interfaces/calendar';
import { addressBuilder } from '@proton/testing/lib/builders';

import { CacheProvider } from '../../cache';
import ModalsProvider from '../../modals/Provider';
import PersonalCalendarsSection, { PersonalCalendarsSectionProps } from './PersonalCalendarsSection';

jest.mock('../../../hooks/useApi', () => ({
    __esModule: true,
    default: jest.fn(() => jest.fn().mockResolvedValue({})),
}));

jest.mock('../../../hooks/useEventManager', () => () => ({}));
jest.mock('../../eventManager/calendar/useCalendarsInfoListener', () => () => ({}));
jest.mock('../../eventManager/calendar/ModelEventManagerProvider', () => ({
    useCalendarModelEventManager: jest.fn(() => ({ call: jest.fn() })),
}));
jest.mock('@proton/components/hooks/useNotifications', () => () => ({}));
jest.mock('@proton/components/hooks/useFeature', () => jest.fn(() => ({ feature: { Value: true } })));
jest.mock('@proton/components/hooks/useConfig', () => () => ({ APP_NAME: 'proton-calendar', APP_VERSION: 'test' }));
jest.mock('@proton/components/hooks/useEarlyAccess', () => () => ({}));

function renderComponent(props?: Partial<PersonalCalendarsSectionProps>) {
    const defaultProps: PersonalCalendarsSectionProps = {
        addresses: [addressBuilder()],
        calendars: [],
        calendarInvitations: [],
        // defaultCalendar?: Calendar;
        user: { isFree: true, hasPaidMail: false, hasNonDelinquentScope: true } as UserModel,
    };

    return (
        <ModalsProvider>
            <Router history={createMemoryHistory()}>
                <CacheProvider cache={createCache()}>
                    <PersonalCalendarsSection {...defaultProps} {...props} />
                </CacheProvider>
            </Router>
        </ModalsProvider>
    );
}

describe('PersonalCalendarsSection', () => {
    const generateSimpleCalendar = (i: number) => ({
        ID: `id-${i}`,
        Name: `name-${i}`,
        Description: `description-${i}`,
        Type: CALENDAR_TYPE.PERSONAL,
        Flags: CALENDAR_FLAGS.ACTIVE,
        Email: 'email',
        Color: '#f00',
        Display: CALENDAR_DISPLAY.VISIBLE,
        Permissions: MEMBER_PERMISSIONS.OWNS,
        Owner: { Email: 'email' },
        Members: [
            {
                ID: `member-${i}`,
                Email: 'email',
                Permissions: MEMBER_PERMISSIONS.OWNS,
                AddressID: `address-id-${i}`,
                Flags: CALENDAR_FLAGS.ACTIVE,
                Color: '#f00',
                Display: CALENDAR_DISPLAY.VISIBLE,
                CalendarID: `id-${i}`,
                Name: `name-${i}`,
                Description: `description-${i}`,
            },
        ],
    });
    it('displays the calendar limit warning when the limit is reached', () => {
        const calendarsFree = Array(MAX_CALENDARS_FREE)
            .fill(1)
            .map((_, index) => generateSimpleCalendar(index));
        const calendarsPaid = Array(MAX_CALENDARS_PAID)
            .fill(1)
            .map((_, index) => generateSimpleCalendar(index));

        const { rerender } = render(
            renderComponent({
                calendars: calendarsFree,
            })
        );
        const createCalendarCopy = 'Create calendar';
        const descriptionCopy = 'Create a calendar to stay on top of your schedule while keeping your data secure.';

        // Free user reached limit
        expect(
            screen.getByText(
                /You have reached the maximum number of personal calendars you can create within your plan./
            )
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                `Upgrade to a Mail paid plan to create up to ${MAX_CALENDARS_PAID} calendars, allowing you to make calendars for work, to share with friends, and just for yourself.`
            )
        ).toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).toBeDisabled();
        expect(screen.getByText(descriptionCopy)).toBeInTheDocument();

        // Free user with extra calendars due to EasySwitch
        rerender(
            renderComponent({
                calendars: calendarsPaid,
            })
        );
        expect(
            screen.getByText(
                /You have reached the maximum number of personal calendars you can create within your plan./
            )
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                `Upgrade to a Mail paid plan to create up to ${MAX_CALENDARS_PAID} calendars, allowing you to make calendars for work, to share with friends, and just for yourself.`
            )
        ).toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).toBeInTheDocument();
        expect(screen.getByText(descriptionCopy)).toBeInTheDocument();

        // Paid VPN user with no Mail can only create one calendar
        rerender(
            renderComponent({
                calendars: calendarsFree,
            })
        );
        expect(
            screen.getByText(
                /You have reached the maximum number of personal calendars you can create within your plan./
            )
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                `Upgrade to a Mail paid plan to create up to ${MAX_CALENDARS_PAID} calendars, allowing you to make calendars for work, to share with friends, and just for yourself.`
            )
        ).toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).toBeInTheDocument();
        expect(screen.getByText(descriptionCopy)).toBeInTheDocument();

        // Paid user reached limit
        rerender(
            renderComponent({
                calendars: calendarsPaid,
                user: { isFree: false, hasPaidMail: true, hasNonDelinquentScope: true } as UserModel,
            })
        );
        expect(
            screen.getByText(
                `You have reached the maximum number of personal calendars you can create within your plan.`
            )
        ).toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).toBeDisabled();
        expect(screen.getByText(descriptionCopy)).toBeInTheDocument();

        // Delinquent paid user reached limit
        rerender(
            renderComponent({
                calendars: calendarsPaid,
                user: { isFree: false, hasPaidMail: true, hasNonDelinquentScope: false } as UserModel,
            })
        );
        expect(
            screen.queryByText(
                `You have reached the maximum number of personal calendars you can create within your plan.`
            )
        ).not.toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).toBeDisabled();
        expect(screen.getByText(descriptionCopy)).toBeInTheDocument();

        // Free user without calendars
        rerender(renderComponent());

        expect(
            screen.queryByText(
                `You have reached the maximum number of personal calendars you can create within your plan.`
            )
        ).not.toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).toBeInTheDocument();
        expect(screen.getByText(descriptionCopy)).toBeInTheDocument();
    });
});
