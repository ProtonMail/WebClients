import React from 'react';
import { MAILBOX_LABEL_IDS, MIME_TYPES } from '@proton/shared/lib/constants';
import { fireEvent } from '@testing-library/dom';
import { getByText as getByTextDefault, getByTestId as getByTestIdDefault, act } from '@testing-library/react';
import { Recipient } from '@proton/shared/lib/interfaces';
import { addDays, addMinutes } from '@proton/shared/lib/date-fns-utc';
import { dateLocale } from '@proton/shared/lib/i18n';
import { format } from 'date-fns';
import loudRejection from 'loud-rejection';
import { render } from '../../../helpers/test/render';
import { setFeatureFlags } from '../../../helpers/test/api';
import { addToCache, minimalCache } from '../../../helpers/test/cache';
import { addApiKeys, clearAll, getDropdown, getModal } from '../../../helpers/test/helper';
import Composer from '../Composer';
import { ID, prepareMessage, props } from './Composer.test.helpers';

loudRejection();

const user = { Name: 'User', Address: 'user@protonmail.com' };

const setupTest = (hasPaidMail: boolean, scheduledTotalCount = 4) => {
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
    setFeatureFlags('ScheduledSend', true);

    addApiKeys(false, user.Address, []);
};

const setupMessage = (subject = '', toList: Recipient[] = []) => {
    prepareMessage({
        localID: ID,
        data: { MIMEType: 'text/plain' as MIME_TYPES, Subject: subject, ToList: toList },
        plainText: '',
    });
};

describe('Composer scheduled messages', () => {
    afterEach(clearAll);

    it('should not see the schedule send when being a free user', async () => {
        setupMessage('Subject', [user as Recipient]);
        setupTest(false);

        const { queryByTestId, getByTestId } = await render(<Composer {...props} />, false);

        getByTestId('composer:send-button');
        const dropdownButton = queryByTestId('dropdown-button');
        expect(dropdownButton).toBeNull();
    });

    it('should show a modal when the user reached scheduled messages limit', async () => {
        setupMessage('Subject', [user as Recipient]);
        setupTest(true, 100);

        const { getByTestId } = await render(<Composer {...props} />, false);

        const dropdownButton = getByTestId('dropdown-button');
        fireEvent.click(dropdownButton);

        const dropdown = await getDropdown();
        const scheduledSendButton = getByTestIdDefault(dropdown, 'composer:schedule-send-button');
        fireEvent.click(scheduledSendButton);

        const { modal } = await getModal();
        getByTextDefault(
            modal,
            'Too many messages waiting to be sent. Please wait until another message has been sent to schedule this one.'
        );
    });

    it('should show a modal when trying to schedule a message without a recipient', async () => {
        setupMessage();
        setupTest(true);

        const { getByTestId } = await render(<Composer {...props} />, false);

        const dropdownButton = getByTestId('dropdown-button');
        fireEvent.click(dropdownButton);

        const dropdown = await getDropdown();
        const scheduledSendButton = getByTestIdDefault(dropdown, 'composer:schedule-send-button');
        fireEvent.click(scheduledSendButton);

        const { modal } = await getModal();
        getByTextDefault(modal, 'No recipient');
    });

    it('should show a modal when trying to schedule a message with a recipient and without subject', async () => {
        setupMessage('', [user as Recipient]);
        setupTest(true);

        const { getByTestId } = await render(<Composer {...props} />, false);

        const dropdownButton = getByTestId('dropdown-button');
        fireEvent.click(dropdownButton);

        const dropdown = await getDropdown();
        const scheduledSendButton = getByTestIdDefault(dropdown, 'composer:schedule-send-button');
        fireEvent.click(scheduledSendButton);

        const { modal } = await getModal();
        getByTextDefault(modal, 'Message without subject?');
    });

    it('should open schedule send modal and change date', async () => {
        setupMessage('Subject', [user as Recipient]);
        setupTest(true);

        const { getByTestId, getByText } = await render(<Composer {...props} />, false);

        const dropdownButton = getByTestId('dropdown-button');
        fireEvent.click(dropdownButton);

        const dropdown = await getDropdown();
        const scheduledSendButton = getByTestIdDefault(dropdown, 'composer:schedule-send-button');
        await act(async () => {
            fireEvent.click(scheduledSendButton);
        });

        getByText('When do you want your message to be sent?');
        const dateInput = getByTestId('composer:schedule-date-input') as HTMLInputElement;
        const timeInput = getByTestId('composer:schedule-time-input') as HTMLInputElement;

        // Check if default date is Tomorrow, 9:00 AM
        expect(dateInput.value).toEqual('Tomorrow');
        expect(timeInput.value).toEqual('9:00 AM');

        // format today date to change the input
        const todayDate = format(new Date(), 'PP', { locale: dateLocale });

        // set date input to today
        fireEvent.change(dateInput, { target: { value: todayDate } });
        fireEvent.keyDown(dateInput, { key: 'Enter' });

        expect(dateInput.value).toEqual('Today');
        expect(timeInput.value).toEqual('9:00 AM');

        const laterDate = format(addDays(new Date(), 5), 'PP', { locale: dateLocale });

        // set date input to 5 days later
        fireEvent.change(dateInput, { target: { value: laterDate } });
        fireEvent.keyDown(dateInput, { key: 'Enter' });

        expect(dateInput.value).toEqual(laterDate);
        expect(timeInput.value).toEqual('9:00 AM');
    });

    it('should disabled schedule send button if date is not valid', async () => {
        setupMessage('Subject', [user as Recipient]);
        setupTest(true);

        const { getByTestId } = await render(<Composer {...props} />, false);

        const dropdownButton = getByTestId('dropdown-button');
        fireEvent.click(dropdownButton);

        const dropdown = await getDropdown();
        const scheduledSendButton = getByTestIdDefault(dropdown, 'composer:schedule-send-button');
        await act(async () => {
            fireEvent.click(scheduledSendButton);
        });

        const dateInput = getByTestId('composer:schedule-date-input') as HTMLInputElement;
        const timeInput = getByTestId('composer:schedule-time-input') as HTMLInputElement;
        const button = getByTestId('modal-footer:set-button') as HTMLButtonElement;

        // set date input to the past
        const previousDate = format(addDays(new Date(), -5), 'PP', { locale: dateLocale });

        fireEvent.change(dateInput, { target: { value: previousDate } });
        fireEvent.keyDown(dateInput, { key: 'Enter' });

        expect(dateInput.value).toEqual(previousDate);
        expect(timeInput.value).toEqual('9:00 AM');
        expect(button.disabled).toBeTruthy();

        // set date input too far in the future
        const laterDate = format(addDays(new Date(), 50), 'PP', { locale: dateLocale });

        fireEvent.change(dateInput, { target: { value: laterDate } });
        fireEvent.keyDown(dateInput, { key: 'Enter' });

        expect(dateInput.value).toEqual(laterDate);
        expect(timeInput.value).toEqual('9:00 AM');
        expect(button.disabled).toBeTruthy();

        // set date input to today, and time in the past
        const todayDate = format(new Date(), 'PP', { locale: dateLocale });
        const todayTime = format(addMinutes(new Date(), -5), 'p', { locale: dateLocale });

        fireEvent.change(dateInput, { target: { value: todayDate } });
        fireEvent.keyDown(dateInput, { key: 'Enter' });

        fireEvent.change(timeInput, { target: { value: todayTime } });
        fireEvent.keyDown(timeInput, { key: 'Enter' });

        expect(dateInput.value).toEqual('Today');
        expect(timeInput.value).toEqual(todayTime);
        expect(button.disabled).toBeTruthy();
    });
});
