import { renderHook } from '@testing-library/react-hooks';

import { useCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import { useCalendars } from '@proton/calendar/calendars/hooks';

import useNewEmailNotification from 'proton-mail/hooks/mailbox/notifications/useNewEmailNotification';
import { useApplyEncryptedSearch } from 'proton-mail/hooks/mailbox/useApplyEncryptedSearch';
import { useMailboxFavicon } from 'proton-mail/hooks/mailbox/useMailboxFavicon';
import { useMailboxPageTitle } from 'proton-mail/hooks/mailbox/useMailboxPageTitle';
import usePreLoadElements from 'proton-mail/hooks/mailbox/usePreLoadElements';
import useInboxBadgeCount from 'proton-mail/hooks/useInboxBadgeCount';
import useInboxDesktopElementId from 'proton-mail/hooks/useInboxDesktopElementId';
import useMailtoHash from 'proton-mail/hooks/useMailtoHash';

import { useMailboxContainerSideEffects } from './useMailboxContainerSideEffects';

jest.mock('proton-mail/hooks/useMailtoHash', () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mock('proton-mail/hooks/useInboxDesktopElementId', () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mock('proton-mail/hooks/mailbox/useApplyEncryptedSearch', () => ({
    useApplyEncryptedSearch: jest.fn(),
}));
jest.mock('proton-mail/hooks/mailbox/useMailboxPageTitle', () => ({
    useMailboxPageTitle: jest.fn(),
}));
jest.mock('proton-mail/hooks/mailbox/useMailboxFavicon', () => ({
    useMailboxFavicon: jest.fn(),
}));
jest.mock('proton-mail/hooks/useInboxBadgeCount', () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mock('proton-mail/hooks/mailbox/notifications/useNewEmailNotification', () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mock('@proton/calendar/calendars/hooks', () => ({
    useCalendars: jest.fn(),
}));
jest.mock('@proton/calendar/calendarUserSettings/hooks', () => ({
    useCalendarUserSettings: jest.fn(),
}));
jest.mock('proton-mail/hooks/mailbox/usePreLoadElements', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('proton-mail/hooks/drawer/useAutoOpenContactsDrawer', () => ({
    __esModule: true,
    default: jest.fn(),
}));

const props = {
    labelID: 'inbox',
    isSearch: false,
    elementsParams: { something: 'value' } as any,
    handleCheckAll: jest.fn(),
    elements: [{ ID: '1' }] as any,
    loading: false,
};

describe('useMailboxContainerSideEffects', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call all hooks with the correct parameters', () => {
        renderHook(() => useMailboxContainerSideEffects(props));

        expect(useMailtoHash).toHaveBeenCalledWith({ isSearch: props.isSearch });
        expect(useInboxDesktopElementId).toHaveBeenCalledWith({ isSearch: props.isSearch });
        expect(useApplyEncryptedSearch).toHaveBeenCalledWith(props.elementsParams);
        expect(useMailboxPageTitle).toHaveBeenCalledWith(props.labelID);
        expect(useMailboxFavicon).toHaveBeenCalledWith(props.labelID);
        expect(useInboxBadgeCount).toHaveBeenCalled();
        expect(useNewEmailNotification).toHaveBeenCalled();
        expect(useCalendars).toHaveBeenCalled();
        expect(useCalendarUserSettings).toHaveBeenCalled();
        expect(usePreLoadElements).toHaveBeenCalledWith({
            elements: props.elements,
            labelID: props.labelID,
            loading: props.loading,
        });

        const mockCallback = (useNewEmailNotification as jest.Mock).mock.calls[0][0];
        mockCallback();

        expect(props.handleCheckAll).toHaveBeenCalledWith(false);
    });

    it('should call useNewEmailNotification with a callback that calls handleCheckAll(false)', () => {
        const handleCheckAll = jest.fn();
        renderHook(() => useMailboxContainerSideEffects({ ...props, handleCheckAll }));

        const callback = (useNewEmailNotification as jest.Mock).mock.calls[0][0];
        callback();

        expect(handleCheckAll).toHaveBeenCalledWith(false);
    });

    it('should pass correct parameters when props change', () => {
        const { rerender } = renderHook((props) => useMailboxContainerSideEffects(props), {
            initialProps: props,
        });

        const updatedProps = {
            ...props,
            labelID: 'sent',
            isSearch: true,
            elementsParams: { key: 'value2' } as any,
        };

        rerender(updatedProps);

        expect(useMailtoHash).toHaveBeenLastCalledWith({ isSearch: true });
        expect(useInboxDesktopElementId).toHaveBeenLastCalledWith({ isSearch: true });
        expect(useApplyEncryptedSearch).toHaveBeenLastCalledWith(updatedProps.elementsParams);
        expect(useMailboxPageTitle).toHaveBeenLastCalledWith('sent');
        expect(useMailboxFavicon).toHaveBeenLastCalledWith('sent');
    });
});
