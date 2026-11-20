import { fireEvent, render, screen } from '@testing-library/react';
import { nextMonday } from 'date-fns';
import type { Mock } from 'vitest';

import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import useSnooze from '../../../../hooks/actions/useSnooze';
import type { Element } from '../../../../models/element';
import { useMailDispatch } from '../../../../store/hooks';
import SnoozeDropdown from './SnoozeDropdown';

vi.mock('@proton/account/user/hooks');
vi.mock('@proton/account/userSettings/hooks');
vi.mock('@proton/components/components/link/useSettingsLink');
vi.mock('../components/SnoozeUpsellModal', () => ({
    __esModule: true,
    default: () => {
        const { createElement } = require('react');
        return createElement('div', { 'data-testid': 'composer:snooze-message:upsell-modal' });
    },
}));
vi.mock('../../../../store/hooks', () => ({
    useMailDispatch: vi.fn().mockReturnValue(vi.fn()),
    useMailSelector: vi.fn().mockReturnValue(vi.fn()),
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

const useSnoozeProps = {
    canSnooze: true,
    canUnsnooze: true,
    snooze: vi.fn(),
    unsnooze: vi.fn(),
    handleClose: vi.fn(),
    handleCustomClick: vi.fn(),
    snoozeState: 'snooze-selection',
};

const element: Element = {
    ID: 'id',
    ConversationID: 'conversationId',
    Subject: 'subject',
    Unread: 0,
};

describe('Snooze dropdown', () => {
    const useUserMock = useUser as Mock;
    const useSnoozeMock = useSnooze as Mock;
    const useAppDispatchMock = useMailDispatch as Mock;
    const useUserSettingsMock = useUserSettings as Mock;

    beforeAll(() => {
        useUserMock.mockImplementation(() => [{ hasPaidMail: false }, vi.fn]);
        useUserSettingsMock.mockImplementation(() => [{ WeekStart: 1 }, vi.fn]);
    });

    afterAll(() => {
        useUserMock.mockClear();
        useSnoozeMock.mockClear();
        useAppDispatchMock.mockClear();
        useUserSettingsMock.mockClear();
    });

    afterEach(() => {
        vi.useRealTimers();
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
        vi.useFakeTimers({ now: nextMonday(new Date()).getTime() });

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
        vi.useFakeTimers({ now: nextMonday(new Date()).getTime() });
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
        const spySnooze = vi.fn();
        useUserMock.mockImplementation(() => [{ hasPaidMail: true }, vi.fn]);
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
        const spySnooze = vi.fn();
        useUserMock.mockImplementation(() => [{ hasPaidMail: true }, vi.fn]);
        useSnoozeMock.mockReturnValue({ ...useSnoozeProps, unsnooze: spySnooze, canUnsnooze: true });

        render(<SnoozeDropdown labelID={MAILBOX_LABEL_IDS.INBOX} elements={[element]} />);
        const button = screen.getByTestId('dropdown-button');
        fireEvent.click(button);

        fireEvent.click(screen.getByTestId('snooze-duration-unsnooze'));
        expect(spySnooze).toHaveBeenCalledTimes(1);
        expect(spySnooze).toHaveBeenCalledWith([element], 'HOVER_BUTTONS');
    });

    it('should call custom click method when pressing button', async () => {
        const spyCustom = vi.fn();
        useUserMock.mockImplementation(() => [{ hasPaidMail: true }, vi.fn]);
        useSnoozeMock.mockReturnValue({ ...useSnoozeProps, handleCustomClick: spyCustom });

        render(<SnoozeDropdown labelID={MAILBOX_LABEL_IDS.INBOX} elements={[element]} />);
        const button = screen.getByTestId('dropdown-button');
        fireEvent.click(button);

        const customButton = screen.getByTestId('snooze-duration-custom');
        fireEvent.click(customButton);
        expect(spyCustom).toHaveBeenCalledTimes(1);
    });

    it('should open upsell modal when free user press the custom button', async () => {
        useUserMock.mockImplementation(() => [{ hasPaidMail: false }, vi.fn]);

        render(<SnoozeDropdown labelID={MAILBOX_LABEL_IDS.INBOX} elements={[element]} />);
        const button = screen.getByTestId('dropdown-button');
        fireEvent.click(button);

        const customButton = screen.getByTestId('snooze-duration-custom');
        fireEvent.click(customButton);

        await screen.findByTestId('composer:snooze-message:upsell-modal');
    });
});
