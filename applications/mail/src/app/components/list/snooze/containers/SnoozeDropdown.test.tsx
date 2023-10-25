import { fireEvent, render } from '@testing-library/react';
import { nextMonday } from 'date-fns';

import { useUser } from '@proton/components/hooks';

import useSnooze from '../../../../hooks/actions/useSnooze';
import { useAppDispatch } from '../../../../logic/store';
import { Element } from '../../../../models/element';
import SnoozeDropdown from './SnoozeDropdown';

jest.mock('@proton/components/hooks/useUser');
jest.mock('@proton/components/components/link/useSettingsLink');
jest.mock('../../../../logic/store', () => ({
    useAppDispatch: jest.fn().mockReturnValue(jest.fn()),
}));
jest.mock('../../../../hooks/actions/useSnooze', () => ({
    __esModule: true,
    default: jest.fn().mockReturnValue({
        canSnooze: true,
        canUnsnooze: true,
        isSnoozeEnabled: true,
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
    isSnoozeEnabled: true,
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
    const useAppDispatchMock = useAppDispatch as jest.Mock;

    beforeAll(() => {
        useUserMock.mockImplementation(() => [{ hasPaidMail: false }, jest.fn]);
    });

    afterAll(() => {
        useUserMock.mockClear();
        useSnoozeMock.mockClear();
        useAppDispatchMock.mockClear();
    });

    it('should not return anything when flag is disabled', () => {
        useSnoozeMock.mockReturnValue({ ...useSnoozeProps, isSnoozeEnabled: false });

        const { queryByTestId } = render(<SnoozeDropdown elements={[element]} />);
        expect(queryByTestId('dropdown-button')).toBeNull();
    });

    it('should not return anything when cannot snooze or unsnooze', () => {
        useSnoozeMock.mockReturnValue({ ...useSnoozeProps, canSnooze: false, canUnsnooze: false });

        const { queryByTestId } = render(<SnoozeDropdown elements={[element]} />);
        expect(queryByTestId('dropdown-button')).toBeNull();
    });

    it('should not return anything when element is an empty array', () => {
        useSnoozeMock.mockReturnValue({ ...useSnoozeProps });

        const { queryByTestId } = render(<SnoozeDropdown elements={[]} />);
        expect(queryByTestId('dropdown-button')).toBeNull();
    });

    it('should open dropdown with all Monday options', () => {
        jest.useFakeTimers({ now: nextMonday(new Date()).getTime() });

        const { getByTestId } = render(<SnoozeDropdown elements={[element]} />);
        const button = getByTestId('dropdown-button');
        fireEvent.click(button);

        expect(useAppDispatchMock).toHaveBeenCalled();
        expect(getByTestId('snooze-duration-tomorrow'));
        expect(getByTestId('snooze-duration-later'));
        expect(getByTestId('snooze-duration-weekend'));
        expect(getByTestId('snooze-duration-nextweek'));
    });

    it('should open dropdown with all Monday options and unsnooze', () => {
        jest.useFakeTimers({ now: nextMonday(new Date()).getTime() });
        useSnoozeMock.mockReturnValue({ ...useSnoozeProps, canUnsnooze: true });

        const { getByTestId } = render(<SnoozeDropdown elements={[element]} />);
        const button = getByTestId('dropdown-button');
        fireEvent.click(button);

        expect(useAppDispatchMock).toHaveBeenCalled();
        expect(getByTestId('snooze-duration-tomorrow'));
        expect(getByTestId('snooze-duration-later'));
        expect(getByTestId('snooze-duration-weekend'));
        expect(getByTestId('snooze-duration-nextweek'));
        expect(getByTestId('snooze-duration-unsnooze'));
    });

    it('should call snooze method when pressing any option', () => {
        const spySnooze = jest.fn();
        useUserMock.mockImplementation(() => [{ hasPaidMail: true }, jest.fn]);
        useSnoozeMock.mockReturnValue({ ...useSnoozeProps, snooze: spySnooze });

        const { getByTestId } = render(<SnoozeDropdown elements={[element]} />);
        const button = getByTestId('dropdown-button');
        fireEvent.click(button);

        fireEvent.click(getByTestId('snooze-duration-tomorrow'));
        expect(spySnooze).toHaveBeenCalledTimes(1);
        expect(spySnooze).toHaveBeenCalledWith({ elements: [element], duration: 'tomorrow', snoozeTime: undefined });
    });

    it('should call unsnooze method when pressing the button', () => {
        const spySnooze = jest.fn();
        useUserMock.mockImplementation(() => [{ hasPaidMail: true }, jest.fn]);
        useSnoozeMock.mockReturnValue({ ...useSnoozeProps, unsnooze: spySnooze, canUnsnooze: true });

        const { getByTestId } = render(<SnoozeDropdown elements={[element]} />);
        const button = getByTestId('dropdown-button');
        fireEvent.click(button);

        fireEvent.click(getByTestId('snooze-duration-unsnooze'));
        expect(spySnooze).toHaveBeenCalledTimes(1);
        expect(spySnooze).toHaveBeenCalledWith([element]);
    });

    it('should call custom click method when pressing button', () => {
        const spyCustom = jest.fn();
        useUserMock.mockImplementation(() => [{ hasPaidMail: true }, jest.fn]);
        useSnoozeMock.mockReturnValue({ ...useSnoozeProps, handleCustomClick: spyCustom });

        const { getByTestId } = render(<SnoozeDropdown elements={[element]} />);
        const button = getByTestId('dropdown-button');
        fireEvent.click(button);

        const customButton = getByTestId('snooze-duration-custom');
        fireEvent.click(customButton);
        expect(spyCustom).toHaveBeenCalledTimes(1);
    });

    it('should open upsell modal when free user press the custom button', async () => {
        const { getByTestId } = render(<SnoozeDropdown elements={[element]} />);
        const button = getByTestId('dropdown-button');
        fireEvent.click(button);

        const customButton = getByTestId('snooze-duration-custom');
        fireEvent.click(customButton);

        setTimeout(() => {
            getByTestId('composer:snooze-message:upsell-modal');
        }, 1);
    });
});
