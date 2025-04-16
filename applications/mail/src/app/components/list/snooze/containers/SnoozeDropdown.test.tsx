import { fireEvent, render, screen } from '@testing-library/react';
import { nextMonday } from 'date-fns';

import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { useMailDispatch } from 'proton-mail/store/hooks';

import useSnooze from '../../../../hooks/actions/useSnooze';
import type { Element } from '../../../../models/element';
import SnoozeDropdown from './SnoozeDropdown';

jest.mock('@proton/account/user/hooks');
jest.mock('@proton/account/userSettings/hooks');
jest.mock('@proton/components/components/link/useSettingsLink');
jest.mock('proton-mail/store/hooks', () => ({
    useMailDispatch: jest.fn().mockReturnValue(jest.fn()),
    useMailSelector: jest.fn().mockReturnValue(jest.fn()),
}));
jest.mock('proton-mail/hooks/actions/useSnooze', () => ({
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

const useSnoozeProps = {
    canSnooze: true,
    canUnsnooze: true,
    snooze: jest.fn(),
    unsnooze: jest.fn(),
    handleClose: jest.fn(),
    handleCustomClick: jest.fn(),
    snoozeState: 'snooze-selection',
};

const element: Element = {
    ID: 'id',
    ConversationID: 'conversationId',
    Subject: 'subject',
    Unread: 0,
};

describe('Snooze dropdown', () => {
    const useUserMock = useUser as jest.Mock;
    const useSnoozeMock = useSnooze as jest.Mock;
    const useAppDispatchMock = useMailDispatch as jest.Mock;
    const useUserSettingsMock = useUserSettings as jest.Mock;

    beforeAll(() => {
        useUserMock.mockImplementation(() => [{ hasPaidMail: false }, jest.fn]);
        useUserSettingsMock.mockImplementation(() => [{ WeekStart: 1 }, jest.fn]);
    });

    afterAll(() => {
        useUserMock.mockClear();
        useSnoozeMock.mockClear();
        useAppDispatchMock.mockClear();
        useUserSettingsMock.mockClear();
    });

    it('should not return anything when cannot snooze or unsnooze', async () => {
        useSnoozeMock.mockReturnValue({ ...useSnoozeProps, canSnooze: false, canUnsnooze: false });

        render(<SnoozeDropdown labelID={MAILBOX_LABEL_IDS.INBOX} elements={[element]} />);
        expect(screen.queryByTestId('dropdown-button')).toBeNull();
    });

    it('should not return anything when element is an empty array', async () => {
        useSnoozeMock.mockReturnValue({ ...useSnoozeProps });

        render(<SnoozeDropdown labelID={MAILBOX_LABEL_IDS.INBOX} elements={[]} />);
        expect(screen.queryByTestId('dropdown-button')).toBeNull();
    });

    it('should open dropdown with all Monday options', async () => {
        jest.useFakeTimers({ now: nextMonday(new Date()).getTime() });

        render(<SnoozeDropdown labelID={MAILBOX_LABEL_IDS.INBOX} elements={[element]} />);
        const button = screen.getByTestId('dropdown-button');
        fireEvent.click(button);

        expect(useAppDispatchMock).toHaveBeenCalled();
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.getByTestId('snooze-duration-later'));
        expect(screen.getByTestId('snooze-duration-weekend'));
        expect(screen.getByTestId('snooze-duration-nextweek'));
    });

    it('should open dropdown with all Monday options and unsnooze', async () => {
        jest.useFakeTimers({ now: nextMonday(new Date()).getTime() });
        useSnoozeMock.mockReturnValue({ ...useSnoozeProps, canUnsnooze: true });

        render(<SnoozeDropdown labelID={MAILBOX_LABEL_IDS.INBOX} elements={[element]} />);
        const button = screen.getByTestId('dropdown-button');
        fireEvent.click(button);

        expect(useAppDispatchMock).toHaveBeenCalled();
        expect(screen.getByTestId('snooze-duration-tomorrow'));
        expect(screen.getByTestId('snooze-duration-later'));
        expect(screen.getByTestId('snooze-duration-weekend'));
        expect(screen.getByTestId('snooze-duration-nextweek'));
        expect(screen.getByTestId('snooze-duration-unsnooze'));
    });

    it('should call snooze method when pressing any option', async () => {
        const spySnooze = jest.fn();
        useUserMock.mockImplementation(() => [{ hasPaidMail: true }, jest.fn]);
        useSnoozeMock.mockReturnValue({ ...useSnoozeProps, snooze: spySnooze });

        render(<SnoozeDropdown labelID={MAILBOX_LABEL_IDS.INBOX} elements={[element]} />);
        const button = screen.getByTestId('dropdown-button');
        fireEvent.click(button);

        fireEvent.click(screen.getByTestId('snooze-duration-tomorrow'));
        expect(spySnooze).toHaveBeenCalledTimes(1);
        expect(spySnooze).toHaveBeenCalledWith(
            { elements: [element], duration: 'tomorrow', snoozeTime: undefined },
            'HOVER_BUTTONS'
        );
    });

    it('should call unsnooze method when pressing the button', async () => {
        const spySnooze = jest.fn();
        useUserMock.mockImplementation(() => [{ hasPaidMail: true }, jest.fn]);
        useSnoozeMock.mockReturnValue({ ...useSnoozeProps, unsnooze: spySnooze, canUnsnooze: true });

        render(<SnoozeDropdown labelID={MAILBOX_LABEL_IDS.INBOX} elements={[element]} />);
        const button = screen.getByTestId('dropdown-button');
        fireEvent.click(button);

        fireEvent.click(screen.getByTestId('snooze-duration-unsnooze'));
        expect(spySnooze).toHaveBeenCalledTimes(1);
        expect(spySnooze).toHaveBeenCalledWith([element], 'HOVER_BUTTONS');
    });

    it('should call custom click method when pressing button', async () => {
        const spyCustom = jest.fn();
        useUserMock.mockImplementation(() => [{ hasPaidMail: true }, jest.fn]);
        useSnoozeMock.mockReturnValue({ ...useSnoozeProps, handleCustomClick: spyCustom });

        render(<SnoozeDropdown labelID={MAILBOX_LABEL_IDS.INBOX} elements={[element]} />);
        const button = screen.getByTestId('dropdown-button');
        fireEvent.click(button);

        const customButton = screen.getByTestId('snooze-duration-custom');
        fireEvent.click(customButton);
        expect(spyCustom).toHaveBeenCalledTimes(1);
    });

    it('should open upsell modal when free user press the custom button', async () => {
        render(<SnoozeDropdown labelID={MAILBOX_LABEL_IDS.INBOX} elements={[element]} />);
        const button = screen.getByTestId('dropdown-button');
        fireEvent.click(button);

        const customButton = screen.getByTestId('snooze-duration-custom');
        fireEvent.click(customButton);

        setTimeout(() => {
            screen.getByTestId('composer:snooze-message:upsell-modal');
        }, 1);
    });
});
