import { fireEvent, screen } from '@testing-library/react';
import { addHours, addSeconds } from 'date-fns';

import type { MessageStateWithData } from '@proton/mail/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { addDays } from '@proton/shared/lib/date-fns-utc';

import { formatDateToHuman } from '../../../../helpers/date';
import { addApiMock, clearAll } from '../../../../helpers/test/helper';
import { mailTestRender } from '../../../../helpers/test/render';
import ExtraScheduledMessage from './ExtraScheduledMessage';

const getMessage = (sendingDate: Date) => {
    return {
        localID: '1',
        data: {
            ID: '1',
            Subject: 'Scheduled message subject',
            Time: sendingDate.getTime() / 1000,
            LabelIDs: [MAILBOX_LABEL_IDS.SENT, MAILBOX_LABEL_IDS.SCHEDULED],
        },
    } as MessageStateWithData;
};

describe('Scheduled messages banner', () => {
    afterEach(clearAll);

    it('should show scheduled banner for scheduled messages', async () => {
        const sendingDate = addDays(new Date(), 3);
        const message = getMessage(sendingDate);

        await mailTestRender(<ExtraScheduledMessage message={message} />);

        const { dateString, formattedTime } = formatDateToHuman(sendingDate);

        screen.getByTestId('message:schedule-banner');
        screen.getByText(`This message will be sent on ${dateString} at ${formattedTime}`);
        screen.getByText('Edit');
    });

    it('should have text will be sent tomorrow', async () => {
        const sendingDate = addDays(new Date(), 1);
        const message = getMessage(sendingDate);

        await mailTestRender(<ExtraScheduledMessage message={message} />);

        const { formattedTime } = formatDateToHuman(sendingDate);

        screen.getByTestId('message:schedule-banner');
        const scheduledBannerText = screen.getByText(`This message will be sent tomorrow at ${formattedTime}`);
        expect(scheduledBannerText.innerHTML).toContain('tomorrow');
        screen.getByText('Edit');
    });

    it('should have text will be sent in the morning', async () => {
        const aDayInTheMorningDate = new Date(2020, 0, 1, 8, 0, 0);
        const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => aDayInTheMorningDate.setHours(8).valueOf());

        const sendingDate = addHours(aDayInTheMorningDate, 3);
        const message = getMessage(sendingDate);

        await mailTestRender(<ExtraScheduledMessage message={message} />);

        const { formattedTime } = formatDateToHuman(sendingDate);

        screen.getByTestId('message:schedule-banner');
        const scheduledBannerText = screen.getByText(`This message will be sent in the morning at ${formattedTime}`);
        expect(scheduledBannerText.innerHTML).toContain('in the morning');
        screen.getByText('Edit');

        dateSpy.mockRestore();
    });

    it('should have text will be sent today', async () => {
        const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => new Date().setHours(12).valueOf());

        const sendingDate = addHours(new Date(Date.now()), 3);
        const message = getMessage(sendingDate);

        await mailTestRender(<ExtraScheduledMessage message={message} />);

        const { formattedTime } = formatDateToHuman(sendingDate);

        screen.getByTestId('message:schedule-banner');
        const scheduledBannerText = screen.getByText(`This message will be sent today at ${formattedTime}`);
        expect(scheduledBannerText.innerHTML).toContain('today');
        screen.getByText('Edit');

        dateSpy.mockRestore();
    });

    it('should have text will be sent shortly', async () => {
        const sendingDate = addSeconds(new Date(), 29);
        const message = getMessage(sendingDate);

        await mailTestRender(<ExtraScheduledMessage message={message} />);

        screen.getByTestId('message:schedule-banner');
        screen.getByText(`This message will be sent shortly`);
        expect(screen.queryByTestId(`Edit`)).toBeNull();
    });

    it('should be able to edit the message', async () => {
        const sendingDate = addDays(new Date(), 1);
        const message = getMessage(sendingDate);

        const unscheduleCall = jest.fn();
        addApiMock(`mail/v4/messages/${message.data?.ID}/cancel_send`, unscheduleCall);

        await mailTestRender(<ExtraScheduledMessage message={message} />);

        const { formattedTime } = formatDateToHuman(sendingDate);

        screen.getByTestId('message:schedule-banner');
        screen.getByText(`This message will be sent tomorrow at ${formattedTime}`);
        const editButton = screen.getByText('Edit');

        // Edit the scheduled message
        fireEvent.click(editButton);

        screen.getByText('Edit and reschedule');
        const editDraftButton = screen.getByText('Edit draft');

        // Unschedule the message
        fireEvent.click(editDraftButton);

        // Unschedule route is called
        expect(unscheduleCall).toHaveBeenCalled();
    });
});
