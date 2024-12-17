import { act, fireEvent } from '@testing-library/react';
import { addHours, set } from 'date-fns';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { addDays } from '@proton/shared/lib/date-fns-utc';

import { formatDateToHuman } from '../../../helpers/date';
import { clearAll } from '../../../helpers/test/helper';
import { render } from '../../../helpers/test/render';
import useSnooze from '../../../hooks/actions/useSnooze';
import type { MessageStateWithData } from '../../../store/messages/messagesTypes';
import ExtraSnoozedMessage from './ExtraSnoozedMessage';

const mockUseGetElementsFromIDs = jest.fn();
jest.mock('../../../hooks/mailbox/useElements', () => ({
    useGetElementsFromIDs: () => mockUseGetElementsFromIDs,
}));

jest.mock('../../../hooks/actions/useSnooze', () => ({
    __esModule: true,
    default: jest.fn().mockReturnValue({
        canSnooze: true,
        canUnsnooze: true,
        snooze: jest.fn(),
        unsnooze: jest.fn(),
        handleClose: jest.fn(),
        handleCustomClick: jest.fn(),
        snoozeState: 'snooze-selection',
    }),
}));

const getMessage = (sendingDate: Date) => {
    return {
        localID: '1',
        data: {
            ID: '1',
            ConversationID: 'conversation',
            Subject: 'Scheduled message subject',
            SnoozeTime: sendingDate.getTime() / 1000,
            LabelIDs: [MAILBOX_LABEL_IDS.SENT, MAILBOX_LABEL_IDS.SNOOZED],
        },
    } as MessageStateWithData;
};

const todayAtNine = set(new Date(), { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });

describe('Scheduled messages banner', () => {
    const useSnoozeMock = useSnooze as jest.Mock;
    const useGetElementsFromIDsMock = jest.fn();

    beforeAll(() => {
        jest.useFakeTimers({ now: todayAtNine.getTime() });
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    afterEach(clearAll);

    it('should have text will be sent shortly, the unsnooze button must be hidden', async () => {
        const sendingDate = new Date();
        const message = getMessage(sendingDate);

        const { getByTestId, getByText, queryByText } = await render(
            <ExtraSnoozedMessage message={message} currentFolder="INBOX" />
        );

        const { formattedTime } = formatDateToHuman(sendingDate);

        getByTestId('message:snooze-banner');
        getByText(`Snoozed until today, ${formattedTime}`);
        expect(queryByText('Unsnooze')).toBeNull();
    });

    it('should have text will be sent today', async () => {
        const sendingDate = addHours(new Date(), 1);
        const message = getMessage(sendingDate);

        const { getByTestId, getByText } = await render(
            <ExtraSnoozedMessage message={message} currentFolder="INBOX" />
        );

        const { formattedTime } = formatDateToHuman(sendingDate);

        getByTestId('message:snooze-banner');
        const text = `Snoozed until today, ${formattedTime}`;
        getByText(text);
        getByText('Unsnooze');
    });

    it('should have text will be sent tomorrow', async () => {
        const sendingDate = addDays(new Date(), 1);
        const message = getMessage(sendingDate);

        const { getByTestId, getByText } = await render(
            <ExtraSnoozedMessage message={message} currentFolder="INBOX" />
        );

        const { formattedTime } = formatDateToHuman(sendingDate);

        getByTestId('message:snooze-banner');
        getByText(`Snoozed until tomorrow, ${formattedTime}`);
        getByText('Unsnooze');
    });

    it('should have text will be sent in the future', async () => {
        const sendingDate = addDays(new Date(), 100);
        const message = getMessage(sendingDate);

        const { getByTestId, getByText } = await render(
            <ExtraSnoozedMessage message={message} currentFolder="INBOX" />
        );

        const { formattedTime, dateString } = formatDateToHuman(sendingDate);

        getByTestId('message:snooze-banner');
        getByText(`Snoozed until ${dateString} at ${formattedTime}`);
        getByText('Unsnooze');
    });

    it('should call the unsnooze method if has element', async () => {
        const sendingDate = addDays(new Date(), 1);
        const message = getMessage(sendingDate);

        mockUseGetElementsFromIDs.mockReturnValue([{ ID: '1' }]);
        const unsnoozeCall = jest.fn();
        useSnoozeMock.mockReturnValue({
            unsnooze: unsnoozeCall,
            canUnsnooze: true,
        });

        const { getByTestId, getByText } = await render(
            <ExtraSnoozedMessage message={message} currentFolder="INBOX" />
        );

        const { formattedTime } = formatDateToHuman(sendingDate);

        getByTestId('message:snooze-banner');
        getByText(`Snoozed until tomorrow, ${formattedTime}`);
        const editButton = getByText('Unsnooze');

        // Edit the snooze message
        await act(async () => {
            fireEvent.click(editButton);
        });

        // Unsnooze route is called
        expect(unsnoozeCall).toHaveBeenCalled();
    });

    it('should not call the unsnooze method if has element', async () => {
        const sendingDate = addDays(new Date(), 1);
        const message = getMessage(sendingDate);

        mockUseGetElementsFromIDs.mockReturnValue(undefined);
        useGetElementsFromIDsMock.mockReturnValue(undefined);
        const unsnoozeCall = jest.fn();
        useSnoozeMock.mockReturnValue({
            unsnooze: unsnoozeCall,
            canUnsnooze: true,
        });

        const { getByTestId, getByText } = await render(
            <ExtraSnoozedMessage message={message} currentFolder="INBOX" />
        );

        const { formattedTime } = formatDateToHuman(sendingDate);

        getByTestId('message:snooze-banner');
        getByText(`Snoozed until tomorrow, ${formattedTime}`);
        const editButton = getByText('Unsnooze');

        // Edit the snooze message
        await act(async () => {
            fireEvent.click(editButton);
        });

        // Unsnooze route is called
        expect(unsnoozeCall).not.toHaveBeenCalled();
    });

    it('should not display unsnooze button if cannot usnooze', async () => {
        const sendingDate = addDays(new Date(), 1);
        const message = getMessage(sendingDate);

        mockUseGetElementsFromIDs.mockReturnValue(undefined);
        useGetElementsFromIDsMock.mockReturnValue(undefined);
        useSnoozeMock.mockReturnValue({
            canUnsnooze: false,
        });

        const { getByTestId, getByText, queryByText } = await render(
            <ExtraSnoozedMessage message={message} currentFolder="INBOX" />
        );

        const { formattedTime } = formatDateToHuman(sendingDate);

        getByTestId('message:snooze-banner');
        getByText(`Snoozed until tomorrow, ${formattedTime}`);
        const editButton = queryByText('Unsnooze');

        expect(editButton).toBeNull();
    });
});
