import { renderHook } from '@testing-library/react-hooks';

import * as desktopHelpers from '@proton/shared/lib/helpers/desktop';

import { useMailboxCounter } from 'proton-mail/hooks/mailboxCounter/useMailboxCounter';
import useInboxBadgeCount from 'proton-mail/hooks/useInboxBadgeCount';

jest.mock('@proton/shared/lib/helpers/desktop');
const desktopHelpersMock = desktopHelpers as jest.MockedObject<typeof desktopHelpers>;

jest.mock('proton-mail/hooks/mailboxCounter/useMailboxCounter');
const mockUseMailboxCounter = useMailboxCounter as jest.Mock;

declare const global: {
    ipcInboxMessageBroker?: any;
};

const originalWindow = { ...window };

const mockInboxUnread = (unread: number | undefined) => {
    mockUseMailboxCounter.mockReturnValue({
        loading: false,
        counterMap: {},
        getLocationCount: jest.fn().mockReturnValue({ Unread: unread, Total: unread ?? 0 }),
        getCurrentLocationCount: jest.fn(),
    });
};

describe('useInboxBadgeCount', () => {
    const ipcInboxMessageBrokerMock = {
        send: jest.fn(),
    };

    beforeEach(() => {
        // @ts-ignore
        const windowSpy = jest.spyOn(global, 'window', 'get');
        windowSpy.mockReturnValue({ ...originalWindow, ipcInboxMessageBroker: ipcInboxMessageBrokerMock });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should not call when not on desktop', () => {
        desktopHelpersMock.isElectronMail = false;
        mockInboxUnread(0);

        renderHook(() => useInboxBadgeCount());
        expect(ipcInboxMessageBrokerMock.send).not.toHaveBeenCalled();
    });

    it('should call with 0 when no count', () => {
        desktopHelpersMock.isElectronMail = true;
        mockInboxUnread(undefined);

        renderHook(() => useInboxBadgeCount());
        expect(ipcInboxMessageBrokerMock.send).toHaveBeenCalledWith('updateNotification', 0);
    });

    it('should call with 0 when negative count', () => {
        desktopHelpersMock.isElectronMail = true;
        mockInboxUnread(-1);

        renderHook(() => useInboxBadgeCount());
        expect(ipcInboxMessageBrokerMock.send).toHaveBeenCalledWith('updateNotification', 0);
    });

    it('should call with 1 when 1 unread', () => {
        desktopHelpersMock.isElectronMail = true;
        mockInboxUnread(1);

        renderHook(() => useInboxBadgeCount());
        expect(ipcInboxMessageBrokerMock.send).toHaveBeenCalledWith('updateNotification', 1);
    });

    it('should call with 100 when 100 unread', () => {
        desktopHelpersMock.isElectronMail = true;
        mockInboxUnread(100);

        renderHook(() => useInboxBadgeCount());
        expect(ipcInboxMessageBrokerMock.send).toHaveBeenCalledWith('updateNotification', 100);
    });
});
