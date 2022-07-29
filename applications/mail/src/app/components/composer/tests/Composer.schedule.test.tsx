import React from 'react';

import { fireEvent } from '@testing-library/dom';
import { act, getByTestId as getByTestIdDefault, getByText as getByTextDefault } from '@testing-library/react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import loudRejection from 'loud-rejection';

import { MAILBOX_LABEL_IDS, MIME_TYPES } from '@proton/shared/lib/constants';
import { addDays, addMinutes } from '@proton/shared/lib/date-fns-utc';
import { Recipient } from '@proton/shared/lib/interfaces';

import { setFeatureFlags } from '../../../helpers/test/api';
import { addToCache, minimalCache } from '../../../helpers/test/cache';
import { addApiKeys, clearAll, getDropdown } from '../../../helpers/test/helper';
import { render } from '../../../helpers/test/render';
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
        messageDocument: { plainText: '' },
    });
};

describe('Composer scheduled messages', () => {
    afterEach(clearAll);

    it('should not see the schedule send when being a free user', async () => {
        setupMessage('Subject', [user as Recipient]);
        setupTest(false);

        const { getByTestId, queryAllByTestId } = await render(<Composer {...props} />, false);

        getByTestId('composer:send-button');
        const dropdownButton = queryAllByTestId('dropdown-button');
        expect(dropdownButton.length).toBeLessThan(2);
    });

    it('should show a modal when the user reached scheduled messages limit', async () => {
        setupMessage('Subject', [user as Recipient]);
        setupTest(true, 100);

        const { getByTestId, getByText } = await render(<Composer {...props} />, false);

        const sendActions = getByTestId('composer:send-actions');
        const dropdownButton = getByTestIdDefault(sendActions, 'dropdown-button');
        fireEvent.click(dropdownButton);

        const dropdown = await getDropdown();
        const scheduledSendButton = getByTestIdDefault(dropdown, 'composer:schedule-send-button');
        fireEvent.click(scheduledSendButton);

        getByText(
            'Too many messages waiting to be sent. Please wait until another message has been sent to schedule this one.'
        );
    });

    it('should show a modal when trying to schedule a message without a recipient', async () => {
        setupMessage();
        setupTest(true);

        const { getByTestId } = await render(<Composer {...props} />, false);

        const sendActions = getByTestId('composer:send-actions');
        const dropdownButton = getByTestIdDefault(sendActions, 'dropdown-button');
        fireEvent.click(dropdownButton);

        const dropdown = await getDropdown();
        const scheduledSendButton = getByTestIdDefault(dropdown, 'composer:schedule-send-button');
        fireEvent.click(scheduledSendButton);

        const modal = await getByTestId('composer:modal:norecipients');
        getByTextDefault(modal, 'Recipient missing');
    });

    it('should show a modal when trying to schedule a message with a recipient and without subject', async () => {
        setupMessage('', [user as Recipient]);
        setupTest(true);

        const { getByTestId } = await render(<Composer {...props} />, false);

        const sendActions = getByTestId('composer:send-actions');
        const dropdownButton = getByTestIdDefault(sendActions, 'dropdown-button');
        fireEvent.click(dropdownButton);

        const dropdown = await getDropdown();
        const scheduledSendButton = getByTestIdDefault(dropdown, 'composer:schedule-send-button');
        fireEvent.click(scheduledSendButton);

        const modal = await getByTestId('composer:modal:nosubject');
        getByTextDefault(modal, 'Subject missing');
    });

    it('should open schedule send modal and change date', async () => {
        setupMessage('Subject', [user as Recipient]);
        setupTest(true);

        const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => new Date().setHours(12).valueOf());

        const { getByTestId, getByText } = await render(<Composer {...props} />, false);

        const sendActions = getByTestId('composer:send-actions');
        const dropdownButton = getByTestIdDefault(sendActions, 'dropdown-button');
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
        const todayDate = format(new Date(Date.now()), 'PP', { locale: enUS });

        // set date input to today
        fireEvent.change(dateInput, { target: { value: todayDate } });
        fireEvent.keyDown(dateInput, { key: 'Enter' });

        expect(dateInput.value).toEqual('Today');
        expect(timeInput.value).toEqual('9:00 AM');

        const laterDate = format(addDays(new Date(Date.now()), 5), 'PP', { locale: enUS });

        // set date input to 5 days later
        fireEvent.change(dateInput, { target: { value: laterDate } });
        fireEvent.keyDown(dateInput, { key: 'Enter' });

        expect(dateInput.value).toEqual(laterDate);
        expect(timeInput.value).toEqual('9:00 AM');

        dateSpy.mockRestore();
    });

    it('should disabled schedule send button if date is not valid', async () => {
        setupMessage('Subject', [user as Recipient]);
        setupTest(true);

        const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => new Date().setHours(12).valueOf());

        const { getByTestId } = await render(<Composer {...props} />, false);

        const sendActions = getByTestId('composer:send-actions');
        const dropdownButton = getByTestIdDefault(sendActions, 'dropdown-button');
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
        const previousDate = format(addDays(new Date(), -5), 'PP', { locale: enUS });

        fireEvent.change(dateInput, { target: { value: previousDate } });
        fireEvent.keyDown(dateInput, { key: 'Enter' });

        expect(dateInput.value).toEqual(previousDate);
        expect(timeInput.value).toEqual('9:00 AM');
        expect(button.disabled).toBeTruthy();

        // set date input too far in the future
        const laterDate = format(addDays(new Date(), 50), 'PP', { locale: enUS });

        fireEvent.change(dateInput, { target: { value: laterDate } });
        fireEvent.keyDown(dateInput, { key: 'Enter' });

        expect(dateInput.value).toEqual(laterDate);
        expect(timeInput.value).toEqual('9:00 AM');
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
