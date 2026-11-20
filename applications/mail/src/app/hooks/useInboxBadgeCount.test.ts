import { renderHook } from '@testing-library/react';
import type { Mock, MockedObject } from 'vitest';

import * as desktopHelpers from '@proton/shared/lib/helpers/desktop';

import { useMailboxCounter } from './mailboxCounter/useMailboxCounter';
import useInboxBadgeCount from './useInboxBadgeCount';

vi.mock('@proton/shared/lib/helpers/desktop');
const desktopHelpersMock = desktopHelpers as MockedObject<typeof desktopHelpers>;

vi.mock('./mailboxCounter/useMailboxCounter');
const mockUseMailboxCounter = useMailboxCounter as Mock;

const mockInboxUnread = (unread: number | undefined) => {
    mockUseMailboxCounter.mockReturnValue({
        loading: false,
        counterMap: {},
        getLocationCount: vi.fn().mockReturnValue({ Unread: unread, Total: unread ?? 0 }),
        getCurrentLocationCount: vi.fn(),
    });
};

describe('useInboxBadgeCount', () => {
    const ipcInboxMessageBrokerMock = {
        send: vi.fn(),
    };

    beforeEach(() => {
        window.ipcInboxMessageBroker = ipcInboxMessageBrokerMock;
    });

    afterEach(() => {
        vi.clearAllMocks();
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
