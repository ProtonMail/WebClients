import React from 'react';

import { fireEvent, screen, waitFor } from '@testing-library/dom';
import { act, getByTestId as getByTestIdDefault, getByText as getByTextDefault } from '@testing-library/react';
import { format, getUnixTime } from 'date-fns';
import { enUS } from 'date-fns/locale';
import loudRejection from 'loud-rejection';

import { MAILBOX_LABEL_IDS, MIME_TYPES } from '@proton/shared/lib/constants';
import { addDays, addMinutes } from '@proton/shared/lib/date-fns-utc';
import { Recipient } from '@proton/shared/lib/interfaces';

import { addApiMock, setFeatureFlags } from '../../../helpers/test/api';
import { addToCache, minimalCache } from '../../../helpers/test/cache';
import { addApiKeys, clearAll, getDropdown } from '../../../helpers/test/helper';
import { render } from '../../../helpers/test/render';
import Composer from '../Composer';
import { ID, prepareMessage, props } from './Composer.test.helpers';

loudRejection();

const user = { Name: 'User', Address: 'user@protonmail.com' };

const setupTest = ({
    hasPaidMail,
    scheduledTotalCount = 4,
    featureFlagActive = true,
    showSpotlight = false,
}: {
    hasPaidMail: boolean;
    scheduledTotalCount?: number;
    featureFlagActive?: boolean;
    showSpotlight?: boolean;
}) => {
    minimalCache();
    addToCache('User', {
        Email: 'Email',
        DisplayName: 'DisplayName',
        Name: 'Name',
        hasPaidMail,
        UsedSpace: 10,
        MaxSpace: 100,
    });
    addToCache('MailSettings', { ViewMode: 1 });
    addToCache('MessageCounts', [{ LabelID: MAILBOX_LABEL_IDS.SCHEDULED, Unread: 1, Total: scheduledTotalCount }]);

    setFeatureFlags('ScheduledSendFreemium', featureFlagActive);
    setFeatureFlags('SpotlightScheduledSend', showSpotlight);

    addApiKeys(false, user.Address, []);
};

const setupMessage = (subject = '', toList: Recipient[] = [], scheduledAt?: number) => {
    prepareMessage({
        localID: ID,
        data: { MIMEType: 'text/plain' as MIME_TYPES, Subject: subject, ToList: toList },
        messageDocument: { plainText: '' },
        ...(scheduledAt ? { draftFlags: { scheduledAt } } : {}),
    });
};

describe('Composer scheduled messages', () => {
    beforeEach(() => {
        addApiMock('core/v4/features/SpotlightScheduledSend/value', jest.fn, 'put');
    });
    afterEach(() => {
        jest.useRealTimers();
        clearAll();
    });

    it('Should see the schedule send when FF is active', async () => {
        setupMessage('Subject', [user as Recipient]);
        setupTest({ hasPaidMail: false, featureFlagActive: true });

        const { queryByTestId } = await render(<Composer {...props} />, false);

        expect(queryByTestId('composer:send-button')).toBeTruthy();
        expect(queryByTestId('composer:scheduled-send:open-dropdown')).toBeTruthy();
    });

    it('Should not see the schedule send when FF is not active', async () => {
        setupMessage('Subject', [user as Recipient]);
        setupTest({ hasPaidMail: false, featureFlagActive: false });

        const { queryByTestId } = await render(<Composer {...props} />, false);

        expect(queryByTestId('composer:send-button')).toBeTruthy();
        expect(queryByTestId('composer:scheduled-send:open-dropdown')).toBeNull();
    });

    describe('Dropdown', () => {
        it('Should contain default fields', async () => {
            // Sunday 1 2023
            const fakeNow = new Date(2023, 0, 1, 10, 0, 0);
            jest.useFakeTimers('modern').setSystemTime(fakeNow.getTime());

            setupMessage('Subject', [user as Recipient]);
            setupTest({ hasPaidMail: false, featureFlagActive: true });

            await render(<Composer {...props} />, false);

            const dropdownButton = screen.getByTestId('composer:scheduled-send:open-dropdown');
            fireEvent.click(dropdownButton);

            expect(screen.queryByTestId('composer:schedule-send:dropdown-title')).toBeTruthy();
            expect(screen.queryByTestId('composer:schedule-send:tomorrow')).toBeTruthy();
            expect(screen.queryByTestId('composer:schedule-send:next-monday')).toBeTruthy();
            expect(screen.queryByTestId('composer:schedule-send:custom')).toBeTruthy();
            // Scheduled At should not be there
            expect(screen.queryByTestId('composer:schedule-send-as-scheduled')).toBeNull();

            expect(screen.queryByTestId('composer:schedule-send:tomorrow')).toHaveTextContent('January 2nd at 8:00 AM');
            expect(screen.queryByTestId('composer:schedule-send:next-monday')).toHaveTextContent(
                'January 2nd at 8:00 AM'
            );
        });

        it.each`
            display             | date
            ${'Tomorrow'}       | ${new Date('2023-01-01T07:59:00')}
            ${'Tomorrow'}       | ${new Date('2023-01-01T08:00:00')}
            ${'Tomorrow'}       | ${new Date('2023-01-01T10:00:00')}
            ${'In the morning'} | ${new Date('2023-01-01T01:00:00')}
            ${'In the morning'} | ${new Date('2023-01-01T03:00:00')}
            ${'In the morning'} | ${new Date('2023-01-01T07:57:00')}
        `('Should display "$display" on "$date"', async ({ display, date }) => {
            jest.useFakeTimers('modern').setSystemTime(date.getTime());

            setupMessage('Subject', [user as Recipient]);
            setupTest({ hasPaidMail: false, featureFlagActive: true });

            await render(<Composer {...props} />, false);

            const dropdownButton = screen.getByTestId('composer:scheduled-send:open-dropdown');
            fireEvent.click(dropdownButton);

            expect(screen.queryByTestId('composer:schedule-send:tomorrow')).toHaveTextContent(display);
        });

        it('Should contain "as scheduled" field when editing', async () => {
            // Sunday 1 2023
            const fakeNow = new Date(2023, 0, 1, 10, 0, 0);
            jest.useFakeTimers('modern').setSystemTime(fakeNow.getTime());

            setupMessage('Subject', [user as Recipient], getUnixTime(new Date(2023, 0, 5, 10, 0, 0)));
            setupTest({ hasPaidMail: false, featureFlagActive: true });

            await render(<Composer {...props} />, false);

            const dropdownButton = screen.getByTestId('composer:scheduled-send:open-dropdown');
            fireEvent.click(dropdownButton);

            const asScheduledButton = screen.getByTestId('composer:schedule-send-as-scheduled');
            expect(asScheduledButton).toHaveTextContent('January 5th at 10:00 AM');
        });
    });

    describe('Spotlight', () => {
        it('Should be displayed on composer opening', async () => {
            setupMessage('Subject', [user as Recipient]);
            setupTest({ hasPaidMail: false, featureFlagActive: true, showSpotlight: true });

            await render(<Composer {...props} />, false);

            let spotlightTitle = screen.queryByTestId('composer:schedule-send:spotlight-title');
            expect(spotlightTitle).toBeTruthy();
        });
        it('Should be closed when dropdown is clicked', async () => {
            setupMessage('Subject', [user as Recipient]);
            setupTest({ hasPaidMail: false, featureFlagActive: true, showSpotlight: true });

            await render(<Composer {...props} />, false);

            let spotlightTitle = screen.queryByTestId('composer:schedule-send:spotlight-title');
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
            setupMessage('Subject', [user as Recipient]);
            setupTest({ hasPaidMail: false, featureFlagActive: true, showSpotlight: false });

            await render(<Composer {...props} />, false);

            const dropdownButton = screen.getByTestId('composer:scheduled-send:open-dropdown');
            fireEvent.click(dropdownButton);

            const customDropdownButton = screen.getByTestId('composer:schedule-send:custom');
            fireEvent.click(customDropdownButton);

            expect(screen.queryByTestId('composer:schedule-send:upsell-modal')).toBeTruthy();
        });

        it('Should be hidden for paid users', async () => {
            setupMessage('Subject', [user as Recipient]);
            setupTest({ hasPaidMail: true, featureFlagActive: true, showSpotlight: false });

            await render(<Composer {...props} />, false);

            const dropdownButton = screen.getByTestId('composer:scheduled-send:open-dropdown');
            fireEvent.click(dropdownButton);

            const customDropdownButton = screen.getByTestId('composer:schedule-send:custom');
            fireEvent.click(customDropdownButton);

            expect(screen.queryByTestId('composer:schedule-send:upsell-modal')).toBeNull();
        });
    });

    it('should show a modal when the user reached scheduled messages limit', async () => {
        setupMessage('Subject', [user as Recipient]);
        setupTest({ hasPaidMail: true, scheduledTotalCount: 100 });

        const { getByTestId, getByText } = await render(<Composer {...props} />, false);

        const sendActions = getByTestId('composer:send-actions');
        const dropdownButton = getByTestIdDefault(sendActions, 'composer:scheduled-send:open-dropdown');
        fireEvent.click(dropdownButton);

        const dropdown = await getDropdown();
        const scheduledSendButton = getByTestIdDefault(dropdown, 'composer:schedule-send:custom');
        fireEvent.click(scheduledSendButton);

        getByText(
            'Too many messages waiting to be sent. Please wait until another message has been sent to schedule this one.'
        );
    });

    it('should show a modal when trying to schedule a message without a recipient', async () => {
        setupMessage();
        setupTest({ hasPaidMail: true });

        const { getByTestId } = await render(<Composer {...props} />, false);

        const sendActions = getByTestId('composer:send-actions');
        const dropdownButton = getByTestIdDefault(sendActions, 'composer:scheduled-send:open-dropdown');
        fireEvent.click(dropdownButton);

        const dropdown = await getDropdown();
        const scheduledSendButton = getByTestIdDefault(dropdown, 'composer:schedule-send:custom');
        fireEvent.click(scheduledSendButton);

        const modal = await getByTestId('composer:modal:norecipients');
        getByTextDefault(modal, 'Recipient missing');
    });

    it('should show a modal when trying to schedule a message with a recipient and without subject', async () => {
        setupMessage('', [user as Recipient]);
        setupTest({ hasPaidMail: true });

        const { getByTestId } = await render(<Composer {...props} />, false);

        const sendActions = getByTestId('composer:send-actions');
        const dropdownButton = getByTestIdDefault(sendActions, 'composer:scheduled-send:open-dropdown');
        fireEvent.click(dropdownButton);

        const dropdown = await getDropdown();
        const scheduledSendButton = getByTestIdDefault(dropdown, 'composer:schedule-send:custom');
        fireEvent.click(scheduledSendButton);

        const modal = await getByTestId('composer:modal:nosubject');
        getByTextDefault(modal, 'Subject missing');
    });

    it('should open schedule send modal and change date', async () => {
        setupMessage('Subject', [user as Recipient]);
        setupTest({ hasPaidMail: true });

        const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => new Date().setHours(12).valueOf());

        const { getByTestId } = await render(<Composer {...props} />, false);

        const sendActions = getByTestId('composer:send-actions');
        const dropdownButton = getByTestIdDefault(sendActions, 'composer:scheduled-send:open-dropdown');
        fireEvent.click(dropdownButton);

        const dropdown = await getDropdown();
        const scheduledSendButton = getByTestIdDefault(dropdown, 'composer:schedule-send:custom');
        await act(async () => {
            fireEvent.click(scheduledSendButton);
        });

        getByTestId('composer:schedule-send:custom-modal:title');
        const dateInput = getByTestId('composer:schedule-date-input') as HTMLInputElement;
        const timeInput = getByTestId('composer:schedule-time-input') as HTMLInputElement;

        // Check if default date is Tomorrow, 8:00 AM
        expect(dateInput.value).toEqual('Tomorrow');
        expect(timeInput.value).toEqual('8:00 AM');

        // format today date to change the input
        const todayDate = format(new Date(Date.now()), 'PP', { locale: enUS });

        // set date input to today
        fireEvent.change(dateInput, { target: { value: todayDate } });
        fireEvent.keyDown(dateInput, { key: 'Enter' });

        expect(dateInput.value).toEqual('Today');
        expect(timeInput.value).toEqual('8:00 AM');

        const laterDate = format(addDays(new Date(Date.now()), 5), 'PP', { locale: enUS });

        // set date input to 5 days later
        fireEvent.change(dateInput, { target: { value: laterDate } });
        fireEvent.keyDown(dateInput, { key: 'Enter' });

        expect(dateInput.value).toEqual(laterDate);
        expect(timeInput.value).toEqual('8:00 AM');

        dateSpy.mockRestore();
    });

    it('should disable schedule send button display if date is not valid', async () => {
        setupMessage('Subject', [user as Recipient]);
        setupTest({ hasPaidMail: true });

        const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => new Date().setHours(12).valueOf());

        const { getByTestId } = await render(<Composer {...props} />, false);

        const sendActions = getByTestId('composer:send-actions');
        const dropdownButton = getByTestIdDefault(sendActions, 'composer:scheduled-send:open-dropdown');
        fireEvent.click(dropdownButton);

        const dropdown = await getDropdown();
        const scheduledSendButton = getByTestIdDefault(dropdown, 'composer:schedule-send:custom');
        await act(async () => {
            fireEvent.click(scheduledSendButton);
        });

        const dateInput = getByTestId('composer:schedule-date-input') as HTMLInputElement;
        const timeInput = getByTestId('composer:schedule-time-input') as HTMLInputElement;
        const button = getByTestId('modal-footer:set-button') as HTMLButtonElement;

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

        dateSpy.mockRestore();
    });
});
