import React from 'react';
import { addDays, addMinutes } from '@proton/shared/lib/date-fns-utc';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { addSeconds } from 'date-fns';
import { fireEvent } from '@testing-library/dom';
import { act, getByText as getByTextDefault } from '@testing-library/react';
import { render } from '../../../helpers/test/render';
import ExtraScheduledMessage from './ExtraScheduledMessage';
import { MessageExtended } from '../../../models/message';
import { formatScheduledDate } from '../../../helpers/date';
import { addApiMock, clearAll, getModal } from '../../../helpers/test/helper';

const getMessage = (sendingDate: Date) => {
    return {
        localID: '1',
        data: {
            ID: '1',
            Subject: 'Scheduled message subject',
            Time: sendingDate.getTime() / 1000,
            LabelIDs: [MAILBOX_LABEL_IDS.SENT, MAILBOX_LABEL_IDS.SCHEDULED],
        },
    } as MessageExtended;
};

describe('Scheduled messages banner', () => {
    afterEach(clearAll);

    it('should show scheduled banner for scheduled messages', async () => {
        const sendingDate = addDays(new Date(), 3);
        const message = getMessage(sendingDate);

        const { getByTestId, getByText } = await render(<ExtraScheduledMessage message={message} />);

        const { dateString, formattedTime } = formatScheduledDate(sendingDate);

        getByTestId('message:schedule-banner');
        getByText(`This message will be sent ${dateString} at ${formattedTime}`);
        getByText('Edit');
    });

    it('should have text will be sent tomorrow', async () => {
        const sendingDate = addDays(new Date(), 1);
        const message = getMessage(sendingDate);

        const { getByTestId, getByText } = await render(<ExtraScheduledMessage message={message} />);

        const { dateString, formattedTime } = formatScheduledDate(sendingDate);

        getByTestId('message:schedule-banner');
        const scheduledBannerText = getByText(`This message will be sent ${dateString} at ${formattedTime}`);
        expect(scheduledBannerText.innerHTML).toContain('tomorrow');
        getByText('Edit');
    });

    it('should have text will be sent today', async () => {
        const sendingDate = addMinutes(new Date(), 20);
        const message = getMessage(sendingDate);

        const { getByTestId, getByText } = await render(<ExtraScheduledMessage message={message} />);

        const { dateString, formattedTime } = formatScheduledDate(sendingDate);

        getByTestId('message:schedule-banner');
        const scheduledBannerText = getByText(`This message will be sent ${dateString} at ${formattedTime}`);
        expect(scheduledBannerText.innerHTML).toContain('today');
        getByText('Edit');
    });

    it('should have text will be sent shortly', async () => {
        const sendingDate = addSeconds(new Date(), 29);
        const message = getMessage(sendingDate);

        const { getByTestId, getByText, queryByTestId } = await render(<ExtraScheduledMessage message={message} />);

        getByTestId('message:schedule-banner');
        getByText(`This message will be sent shortly`);
        expect(queryByTestId(`Edit`)).toBeNull();
    });

    it('should be able to edit the message', async () => {
        const sendingDate = addMinutes(new Date(), 20);
        const message = getMessage(sendingDate);

        const unscheduleCall = jest.fn();
        addApiMock(`mail/v4/messages/${message.data?.ID}/cancel_send`, unscheduleCall);

        const { getByTestId, getByText } = await render(<ExtraScheduledMessage message={message} />);

        const { dateString, formattedTime } = formatScheduledDate(sendingDate);

        getByTestId('message:schedule-banner');
        getByText(`This message will be sent ${dateString} at ${formattedTime}`);
        const editButton = getByText('Edit');

        // Edit the scheduled message
        fireEvent.click(editButton);

        // Unschedule modal opens
        const { modal } = getModal();
        getByTextDefault(modal, 'Edit and reschedule');
        const editDraftButton = getByTextDefault(modal, 'Edit draft');

        await act(async () => {
            // Unschedule the message
            fireEvent.click(editDraftButton);
        });

        // Unschedule route is called
        expect(unscheduleCall).toHaveBeenCalled();
    });
});
