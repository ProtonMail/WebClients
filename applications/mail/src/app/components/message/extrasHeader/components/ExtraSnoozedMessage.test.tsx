import { fireEvent, screen } from '@testing-library/react';
import { addHours, set } from 'date-fns';
import type { Mock } from 'vitest';

import { formatDateToHuman } from '@proton/mail-message/helpers/date';
import type { MessageStateWithData } from '@proton/mail-message/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { addDays } from '@proton/shared/lib/date-fns-utc';

import { clearAll } from '../../../../helpers/tests/helper';
import { mailTestRender } from '../../../../helpers/tests/render';
import useSnooze from '../../../../hooks/actions/useSnooze';
import ExtraSnoozedMessage from './ExtraSnoozedMessage';

const mockUseGetElementsFromIDs = vi.fn();
vi.mock('../../../../hooks/mailbox/useElements', () => ({
    useGetElementsFromIDs: () => mockUseGetElementsFromIDs,
}));

vi.mock('../../../../hooks/actions/useSnooze', () => ({
    __esModule: true,
    default: vi.fn().mockReturnValue({
        canSnooze: true,
        canUnsnooze: true,
        snooze: vi.fn(),
        unsnooze: vi.fn(),
        handleClose: vi.fn(),
        handleCustomClick: vi.fn(),
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
    const useSnoozeMock = useSnooze as Mock;
    const useGetElementsFromIDsMock = vi.fn();

    beforeAll(() => {
        vi.useFakeTimers({ now: todayAtNine.getTime() });
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    afterEach(clearAll);

    it('should have text will be sent shortly, the unsnooze button must be hidden', async () => {
        const sendingDate = new Date();
        const message = getMessage(sendingDate);

        await mailTestRender(<ExtraSnoozedMessage message={message} />);

        const { formattedTime } = formatDateToHuman(sendingDate);

        screen.getByTestId('message:snooze-banner');
        screen.getByText(`Snoozed until today, ${formattedTime}`);
        expect(screen.queryByText('Unsnooze')).toBeNull();
    });

    it('should have text will be sent today', async () => {
        const sendingDate = addHours(new Date(), 1);
        const message = getMessage(sendingDate);

        await mailTestRender(<ExtraSnoozedMessage message={message} />);

        const { formattedTime } = formatDateToHuman(sendingDate);

        screen.getByTestId('message:snooze-banner');
        const text = `Snoozed until today, ${formattedTime}`;
        screen.getByText(text);
        screen.getByText('Unsnooze');
    });

    it('should have text will be sent tomorrow', async () => {
        const sendingDate = addDays(new Date(), 1);
        const message = getMessage(sendingDate);

        await mailTestRender(<ExtraSnoozedMessage message={message} />);

        const { formattedTime } = formatDateToHuman(sendingDate);

        screen.getByTestId('message:snooze-banner');
        screen.getByText(`Snoozed until tomorrow, ${formattedTime}`);
        screen.getByText('Unsnooze');
    });

    it('should have text will be sent in the future', async () => {
        const sendingDate = addDays(new Date(), 100);
        const message = getMessage(sendingDate);

        await mailTestRender(<ExtraSnoozedMessage message={message} />);

        const { formattedTime, dateString } = formatDateToHuman(sendingDate);

        screen.getByTestId('message:snooze-banner');
        screen.getByText(`Snoozed until ${dateString} at ${formattedTime}`);
        screen.getByText('Unsnooze');
    });

    it('should call the unsnooze method if has element', async () => {
        const sendingDate = addDays(new Date(), 1);
        const message = getMessage(sendingDate);

        mockUseGetElementsFromIDs.mockReturnValue([{ ID: '1' }]);
        const unsnoozeCall = vi.fn();
        useSnoozeMock.mockReturnValue({
            unsnooze: unsnoozeCall,
            canUnsnooze: true,
        });

        await mailTestRender(<ExtraSnoozedMessage message={message} />);

        const { formattedTime } = formatDateToHuman(sendingDate);

        screen.getByTestId('message:snooze-banner');
        screen.getByText(`Snoozed until tomorrow, ${formattedTime}`);
        const editButton = screen.getByText('Unsnooze');

        // Edit the snooze message
        fireEvent.click(editButton);

        // Unsnooze route is called
        expect(unsnoozeCall).toHaveBeenCalled();
    });

    it('should not call the unsnooze method if has element', async () => {
        const sendingDate = addDays(new Date(), 1);
        const message = getMessage(sendingDate);

        mockUseGetElementsFromIDs.mockReturnValue(undefined);
        useGetElementsFromIDsMock.mockReturnValue(undefined);
        const unsnoozeCall = vi.fn();
        useSnoozeMock.mockReturnValue({
            unsnooze: unsnoozeCall,
            canUnsnooze: true,
        });

        await mailTestRender(<ExtraSnoozedMessage message={message} />);

        const { formattedTime } = formatDateToHuman(sendingDate);

        screen.getByTestId('message:snooze-banner');
        screen.getByText(`Snoozed until tomorrow, ${formattedTime}`);
        const editButton = screen.getByText('Unsnooze');

        // Edit the snooze message
        fireEvent.click(editButton);

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

        await mailTestRender(<ExtraSnoozedMessage message={message} />);

        const { formattedTime } = formatDateToHuman(sendingDate);

        screen.getByTestId('message:snooze-banner');
        screen.getByText(`Snoozed until tomorrow, ${formattedTime}`);
        const editButton = screen.queryByText('Unsnooze');

        expect(editButton).toBeNull();
    });
});
