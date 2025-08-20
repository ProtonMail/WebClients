import {
    act,
    fireEvent,
    getByTestId as getByTestIdDefault,
    getByText as getByTextDefault,
    screen,
    waitFor,
} from '@testing-library/react';
import { format, getUnixTime, set } from 'date-fns';
import { enUS } from 'date-fns/locale';
import loudRejection from 'loud-rejection';

import { getModelState } from '@proton/account/test';
import { mockPlansApi } from '@proton/components/hooks/helpers/test';
import { FeatureCode } from '@proton/features';
import type { MessageStateWithData } from '@proton/mail/store/messages/messagesTypes';
import type { MIME_TYPES } from '@proton/shared/lib/constants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { addDays, addMinutes } from '@proton/shared/lib/date-fns-utc';
import type { MailSettings, Recipient, UserModel } from '@proton/shared/lib/interfaces';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';
import { getFeatureFlagsState } from '@proton/testing/lib/features';

import type { MailState } from 'proton-mail/store/store';

import { getMinScheduleTime } from '../../../helpers/schedule';
import { addApiMock } from '../../../helpers/test/api';
import { minimalCache } from '../../../helpers/test/cache';
import { addApiKeys, clearAll, getDropdown } from '../../../helpers/test/helper';
import { ID, getMessage, renderComposer } from './Composer.test.helpers';

loudRejection();

const user = { Name: 'User', Address: 'user@protonmail.com' };

export const getUser = (hasPaidMail: boolean) => {
    return {
        Email: 'Email',
        DisplayName: 'DisplayName',
        Name: 'Name',
        hasPaidMail,
        UsedSpace: 10,
        MaxSpace: 100,
        Flags: { 'has-a-byoe-address': false },
    } as UserModel;
};

const getPreloadState = ({
    hasPaidMail,
    featureFlagActive = true,
    showSpotlight = false,
    scheduledTotalCount = 4,
}: {
    hasPaidMail: boolean;
    featureFlagActive?: boolean;
    showSpotlight?: boolean;
    scheduledTotalCount?: number;
}) => {
    return {
        user: getModelState(getUser(hasPaidMail)),
        mailSettings: getModelState({ ViewMode: VIEW_MODE.SINGLE } as MailSettings),
        features: getFeatureFlagsState([
            [FeatureCode.ScheduledSendFreemium, featureFlagActive],
            [FeatureCode.SpotlightScheduledSend, showSpotlight],
        ]),
        messageCounts: getModelState([
            {
                LabelID: MAILBOX_LABEL_IDS.SCHEDULED,
                Unread: 1,
                Total: scheduledTotalCount,
            },
        ]),
    };
};

const setupTest = () => {
    minimalCache();

    addApiKeys(false, user.Address, []);
};

const setupMessage = (Subject = '', ToList: Recipient[] = [], scheduledAt?: number) => {
    return getMessage({
        localID: ID,
        data: { MIMEType: 'text/plain' as MIME_TYPES, Subject, ToList },
        messageDocument: { plainText: '' },
        ...(scheduledAt ? { draftFlags: { scheduledAt } } : {}),
    });
};

const helper = async (message: MessageStateWithData, preloadedState: Partial<MailState>) => {
    const composerID = 'composer-test-id';
    const { store, ...rest } = await renderComposer({
        preloadedState,
        message,
    });
    return { store, composerID, ...rest };
};

describe('Composer scheduled messages', () => {
    beforeEach(() => {
        clearAll();
        addApiMock('core/v4/features/SpotlightScheduledSend/value', jest.fn, 'put');
        mockPlansApi();
    });
    afterEach(() => {
        jest.useRealTimers();
    });
    afterAll(() => {
        clearAll();
    });

    it('Should see the schedule send when FF is active', async () => {
        const message = setupMessage('Subject', [user as Recipient]);

        await helper(message, getPreloadState({ hasPaidMail: false, featureFlagActive: true }));

        expect(screen.getByTestId('composer:send-button')).toBeTruthy();
        expect(screen.getByTestId('composer:scheduled-send:open-dropdown')).toBeTruthy();
    });

    it('Should not see the schedule send when FF is not active', async () => {
        const message = setupMessage('Subject', [user as Recipient]);
        setupTest();

        await helper(message, getPreloadState({ hasPaidMail: false, featureFlagActive: false }));

        expect(screen.getByTestId('composer:send-button')).toBeTruthy();
        expect(screen.queryByTestId('composer:scheduled-send:open-dropdown')).toBeNull();
    });

    describe('Dropdown', () => {
        it('Should contain default fields', async () => {
            // Monday 2 2023
            const fakeNow = new Date(2023, 0, 2, 10, 0, 0);
            jest.useFakeTimers().setSystemTime(fakeNow.getTime());

            const message = setupMessage('Subject', [user as Recipient]);
            setupTest();

            await helper(
                message,
                getPreloadState({
                    hasPaidMail: false,
                    featureFlagActive: true,
                })
            );

            const dropdownButton = screen.getByTestId('composer:scheduled-send:open-dropdown');
            fireEvent.click(dropdownButton);

            expect(screen.getByTestId('composer:schedule-send:dropdown-title')).toBeTruthy();
            expect(screen.getByTestId('composer:schedule-send:tomorrow')).toBeTruthy();
            expect(screen.getByTestId('composer:schedule-send:next-monday')).toBeTruthy();
            expect(screen.getByTestId('composer:schedule-send:custom')).toBeTruthy();
            // Scheduled At should not be there
            expect(screen.queryByTestId('composer:schedule-send-as-scheduled')).toBeNull();

            expect(screen.queryByTestId('composer:schedule-send:tomorrow')).toHaveTextContent('January 3rd at 8:00 AM');
            expect(screen.queryByTestId('composer:schedule-send:next-monday')).toHaveTextContent(
                'January 9th at 8:00 AM'
            );
        });

        it('Should not contain "next monday" entry on "sunday"', async () => {
            // Sunday 1 2023
            const fakeNow = new Date(2023, 0, 1, 10, 0, 0);
            jest.useFakeTimers().setSystemTime(fakeNow.getTime());

            const message = setupMessage('Subject', [user as Recipient]);
            setupTest();

            await helper(
                message,
                getPreloadState({
                    hasPaidMail: false,
                    featureFlagActive: true,
                })
            );

            const dropdownButton = screen.getByTestId('composer:scheduled-send:open-dropdown');
            fireEvent.click(dropdownButton);

            expect(screen.getByTestId('composer:schedule-send:dropdown-title')).toBeTruthy();
            expect(screen.getByTestId('composer:schedule-send:tomorrow')).toBeTruthy();
            expect(screen.queryByTestId('composer:schedule-send:next-monday')).toBeNull();
            expect(screen.getByTestId('composer:schedule-send:custom')).toBeTruthy();
            // Scheduled At should not be there
            expect(screen.queryByTestId('composer:schedule-send-as-scheduled')).toBeNull();

            expect(screen.queryByTestId('composer:schedule-send:tomorrow')).toHaveTextContent('January 2nd at 8:00 AM');
        });

        it.each`
            expected            | date
            ${'Tomorrow'}       | ${new Date(2023, 0, 1, 7, 59, 0)}
            ${'Tomorrow'}       | ${new Date(2023, 0, 1, 8, 0, 0)}
            ${'Tomorrow'}       | ${new Date(2023, 0, 1, 10, 0, 0)}
            ${'In the morning'} | ${new Date(2023, 0, 1, 0, 0, 1)}
            ${'In the morning'} | ${new Date(2023, 0, 1, 2, 0, 0)}
            ${'In the morning'} | ${new Date(2023, 0, 1, 7, 30, 0)}
        `('Should display "$expected" on "$date"', async ({ expected, date }) => {
            jest.useFakeTimers().setSystemTime(date.getTime());

            const message = setupMessage('Subject', [user as Recipient]);
            setupTest();

            await helper(
                message,
                getPreloadState({
                    hasPaidMail: false,
                    featureFlagActive: true,
                })
            );

            const dropdownButton = screen.getByTestId('composer:scheduled-send:open-dropdown');
            fireEvent.click(dropdownButton);

            expect(screen.queryByTestId('composer:schedule-send:tomorrow')).toHaveTextContent(expected);
        });

        it('Should contain "as scheduled" field when editing', async () => {
            // Sunday 1 2023
            const fakeNow = new Date(2023, 0, 1, 10, 0, 0);
            jest.useFakeTimers().setSystemTime(fakeNow.getTime());

            const message = setupMessage('Subject', [user as Recipient], getUnixTime(new Date(2023, 0, 5, 10, 0, 0)));
            setupTest();

            await helper(
                message,
                getPreloadState({
                    hasPaidMail: false,
                    featureFlagActive: true,
                })
            );

            const dropdownButton = screen.getByTestId('composer:scheduled-send:open-dropdown');
            fireEvent.click(dropdownButton);

            const asScheduledButton = screen.getByTestId('composer:schedule-send-as-scheduled');
            expect(asScheduledButton).toHaveTextContent('January 5th at 10:00 AM');
        });
    });

    describe('Spotlight', () => {
        it('Should be displayed on composer opening', async () => {
            const message = setupMessage('Subject', [user as Recipient]);
            setupTest();

            await helper(
                message,
                getPreloadState({
                    hasPaidMail: false,
                    featureFlagActive: true,
                    showSpotlight: true,
                })
            );

            const spotlightTitle = screen.queryByTestId('composer:schedule-send:spotlight-title');
            expect(spotlightTitle).toBeTruthy();
        });
        it('Should be closed when dropdown is clicked', async () => {
            const message = setupMessage('Subject', [user as Recipient]);
            setupTest();

            await helper(
                message,
                getPreloadState({
                    hasPaidMail: false,
                    featureFlagActive: true,
                    showSpotlight: true,
                })
            );

            const spotlightTitle = screen.queryByTestId('composer:schedule-send:spotlight-title');
            expect(spotlightTitle).toBeTruthy();

            const dropdownButton = screen.getByTestId('composer:scheduled-send:open-dropdown');
            fireEvent.click(dropdownButton);

            await waitFor(() => {
                expect(screen.queryByTestId('composer:schedule-send:spotlight-title')).toBeNull();
            });
        });
    });

    describe('Upsell modal', () => {
        it('Should be displayed to free users', async () => {
            const message = setupMessage('Subject', [user as Recipient]);
            setupTest();

            await helper(
                message,
                getPreloadState({
                    hasPaidMail: false,
                    featureFlagActive: true,
                    showSpotlight: false,
                })
            );

            const dropdownButton = screen.getByTestId('composer:scheduled-send:open-dropdown');
            fireEvent.click(dropdownButton);

            const customDropdownButton = screen.getByTestId('composer:schedule-send:custom');
            fireEvent.click(customDropdownButton);

            expect(screen.queryByTestId('composer:schedule-send:upsell-modal')).toBeTruthy();
        });

        it('Should be hidden for paid users', async () => {
            const message = setupMessage('Subject', [user as Recipient]);
            setupTest();

            await helper(
                message,
                getPreloadState({
                    hasPaidMail: true,
                    featureFlagActive: true,
                    showSpotlight: false,
                })
            );

            const dropdownButton = screen.getByTestId('composer:scheduled-send:open-dropdown');
            fireEvent.click(dropdownButton);

            const customDropdownButton = screen.getByTestId('composer:schedule-send:custom');
            await act(async () => {
                fireEvent.click(customDropdownButton);
            });

            expect(screen.queryByTestId('composer:schedule-send:upsell-modal')).toBeNull();
        });
    });

    it('should show a modal when the user reached scheduled messages limit', async () => {
        const message = setupMessage('Subject', [user as Recipient]);
        setupTest();

        await helper(message, getPreloadState({ hasPaidMail: true, scheduledTotalCount: 100 }));

        const sendActions = screen.getByTestId('composer:send-actions');
        const dropdownButton = getByTestIdDefault(sendActions, 'composer:scheduled-send:open-dropdown');
        fireEvent.click(dropdownButton);

        const dropdown = await getDropdown();
        const scheduledSendButton = getByTestIdDefault(dropdown, 'composer:schedule-send:custom');
        fireEvent.click(scheduledSendButton);

        screen.getByText(
            'Too many messages waiting to be sent. Please wait until another message has been sent to schedule this one.'
        );
    });

    it('should show a modal when trying to schedule a message without a recipient', async () => {
        const message = setupMessage();
        setupTest();

        await helper(message, getPreloadState({ hasPaidMail: true }));

        const sendActions = screen.getByTestId('composer:send-actions');
        const dropdownButton = getByTestIdDefault(sendActions, 'composer:scheduled-send:open-dropdown');
        fireEvent.click(dropdownButton);

        const dropdown = await getDropdown();
        const scheduledSendButton = getByTestIdDefault(dropdown, 'composer:schedule-send:custom');
        fireEvent.click(scheduledSendButton);

        const modal = screen.getByTestId('composer:modal:norecipients');
        getByTextDefault(modal, 'Recipient missing');
    });

    it('Should show a modal when trying to schedule a message with a recipient and without subject', async () => {
        const message = setupMessage('', [user as Recipient]);
        setupTest();

        await helper(message, getPreloadState({ hasPaidMail: true }));

        const sendActions = screen.getByTestId('composer:send-actions');
        const dropdownButton = getByTestIdDefault(sendActions, 'composer:scheduled-send:open-dropdown');
        fireEvent.click(dropdownButton);

        const dropdown = await getDropdown();
        const scheduledSendButton = getByTestIdDefault(dropdown, 'composer:schedule-send:custom');
        fireEvent.click(scheduledSendButton);

        const modal = await screen.findByTestId('composer:modal:nosubject');
        getByTextDefault(modal, 'Subject missing');
    });

    describe('Scheduled send modal', () => {
        const mockedDate = set(new Date(), {
            hours: 7,
            minutes: 10,
            seconds: 0,
            milliseconds: 0,
            month: 0,
            date: 1,
            year: 2023,
        });

        beforeEach(() => {
            jest.useFakeTimers({ now: mockedDate.getTime() });
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should open schedule time and see tomorrow as default value', async () => {
            const message = setupMessage('Subject', [user as Recipient]);
            setupTest();

            await helper(message, getPreloadState({ hasPaidMail: true }));

            const sendActions = screen.getByTestId('composer:send-actions');
            const dropdownButton = getByTestIdDefault(sendActions, 'composer:scheduled-send:open-dropdown');
            fireEvent.click(dropdownButton);

            const dropdown = await getDropdown();
            const scheduledSendButton = getByTestIdDefault(dropdown, 'composer:schedule-send:custom');
            await act(async () => {
                fireEvent.click(scheduledSendButton);
            });

            screen.getByTestId('composer:schedule-send:custom-modal:title');
            const dateInput = screen.getByTestId('composer:schedule-date-input') as HTMLInputElement;
            const timeInput = screen.getByTestId('composer:schedule-time-input') as HTMLInputElement;

            // Check if default date is Tomorrow, 8:00 AM
            expect(dateInput.value).toEqual('Tomorrow');
            expect(timeInput.value).toEqual('8:00 AM');
        });

        it('should open schedule send modal and change date to today', async () => {
            const message = setupMessage('Subject', [user as Recipient]);
            setupTest();

            await helper(message, getPreloadState({ hasPaidMail: true }));

            const sendActions = screen.getByTestId('composer:send-actions');
            const dropdownButton = getByTestIdDefault(sendActions, 'composer:scheduled-send:open-dropdown');
            fireEvent.click(dropdownButton);

            const dropdown = await getDropdown();
            const scheduledSendButton = getByTestIdDefault(dropdown, 'composer:schedule-send:custom');
            await act(async () => {
                fireEvent.click(scheduledSendButton);
            });

            screen.getByTestId('composer:schedule-send:custom-modal:title');
            const dateInput = screen.getByTestId('composer:schedule-date-input') as HTMLInputElement;

            const timeInput = screen.getByTestId('composer:schedule-time-input') as HTMLInputElement;

            // format today date to change the input
            const todayDate = format(new Date(Date.now()), 'PP', { locale: enUS });

            // set date input to today
            fireEvent.change(dateInput, { target: { value: todayDate } });
            fireEvent.keyDown(dateInput, { key: 'Enter' });

            // When choosing today with a time before the current time, the time should be set to the next available time
            const nextAvailableTime = getMinScheduleTime(new Date()) ?? new Date();
            const nextAvailableTimeFormatted = format(nextAvailableTime, 'p', { locale: enUS });

            expect(dateInput.value).toEqual('Today');
            expect(timeInput.value).toEqual(nextAvailableTimeFormatted);

            const laterDate = format(addDays(new Date(Date.now()), 5), 'PP', { locale: enUS });

            // set date input to 5 days later
            fireEvent.change(dateInput, { target: { value: laterDate } });
            fireEvent.keyDown(dateInput, { key: 'Enter' });

            expect(dateInput.value).toEqual(laterDate);
            expect(timeInput.value).toEqual(nextAvailableTimeFormatted);
        });

        it('should open schedule send modal and change date to future', async () => {
            const message = setupMessage('Subject', [user as Recipient]);
            setupTest();

            await helper(message, getPreloadState({ hasPaidMail: true }));

            const sendActions = screen.getByTestId('composer:send-actions');
            const dropdownButton = getByTestIdDefault(sendActions, 'composer:scheduled-send:open-dropdown');
            fireEvent.click(dropdownButton);

            const dropdown = await getDropdown();
            const scheduledSendButton = getByTestIdDefault(dropdown, 'composer:schedule-send:custom');
            await act(async () => {
                fireEvent.click(scheduledSendButton);
            });

            screen.getByTestId('composer:schedule-send:custom-modal:title');
            const dateInput = screen.getByTestId('composer:schedule-date-input') as HTMLInputElement;

            const timeInput = screen.getByTestId('composer:schedule-time-input') as HTMLInputElement;

            const laterDate = format(addDays(new Date(Date.now()), 5), 'PP', { locale: enUS });

            // set date input to 5 days later
            fireEvent.change(dateInput, { target: { value: laterDate } });
            fireEvent.keyDown(dateInput, { key: 'Enter' });

            // Default time is 08:00 AM
            expect(dateInput.value).toEqual(laterDate);
            expect(timeInput.value).toEqual('8:00 AM');
        });

        it('should disable schedule send button display if date is not valid', async () => {
            const message = setupMessage('Subject', [user as Recipient]);
            setupTest();

            await helper(message, getPreloadState({ hasPaidMail: true }));

            const sendActions = screen.getByTestId('composer:send-actions');
            const dropdownButton = getByTestIdDefault(sendActions, 'composer:scheduled-send:open-dropdown');
            fireEvent.click(dropdownButton);

            const dropdown = await getDropdown();
            const scheduledSendButton = getByTestIdDefault(dropdown, 'composer:schedule-send:custom');
            await act(async () => {
                fireEvent.click(scheduledSendButton);
            });

            const dateInput = screen.getByTestId('composer:schedule-date-input') as HTMLInputElement;
            const timeInput = screen.getByTestId('composer:schedule-time-input') as HTMLInputElement;
            const button = screen.getByTestId('modal-footer:set-button') as HTMLButtonElement;

            // set date input to the past
            const previousDate = format(addDays(new Date(), -5), 'PP', { locale: enUS });

            fireEvent.change(dateInput, { target: { value: previousDate } });
            fireEvent.keyDown(dateInput, { key: 'Enter' });

            expect(dateInput.value).toEqual(previousDate);
            expect(timeInput.value).toEqual('8:00 AM');
            expect(button.disabled).toBeTruthy();

            // set date input too far in the future
            const laterDate = format(addDays(new Date(), 91), 'PP', { locale: enUS });

            fireEvent.change(dateInput, { target: { value: laterDate } });
            fireEvent.keyDown(dateInput, { key: 'Enter' });

            expect(dateInput.value).toEqual(laterDate);
            expect(timeInput.value).toEqual('8:00 AM');
            expect(button.disabled).toBeTruthy();

            // set date input to today, and time in the past
            const todayDate = format(Date.now(), 'PP', { locale: enUS });
            const todayTime = format(addMinutes(new Date(Date.now()), -5), 'p', { locale: enUS });

            fireEvent.change(dateInput, { target: { value: todayDate } });
            fireEvent.keyDown(dateInput, { key: 'Enter' });

            fireEvent.change(timeInput, { target: { value: todayTime } });
            fireEvent.keyDown(timeInput, { key: 'Enter' });

            expect(dateInput.value).toEqual('Today');
            expect(timeInput.value).toEqual(todayTime);
            expect(button.disabled).toBeTruthy();
        });
    });
});
