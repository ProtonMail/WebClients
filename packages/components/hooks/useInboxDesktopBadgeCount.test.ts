import { renderHook } from '@testing-library/react-hooks';

import { useConversationCounts } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import * as ipcHelpers from '@proton/shared/lib/desktop/ipcHelpers';

import { useInboxDesktopBadgeCount } from './';

jest.mock('@proton/components/hooks/useConversationCounts');
jest.mock('@proton/shared/lib/desktop/ipcHelpers');
const ipcHelpersMock = ipcHelpers as jest.MockedObject<typeof ipcHelpers>;

declare const global: {
    ipcInboxMessageBroker?: any;
};

const originalWindow = { ...window };

describe('useInboxDesktopBadgeCount', () => {
    const useConversationCountsMock = useConversationCounts as jest.Mock;
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
        ipcHelpersMock.canInvokeInboxDesktopIPC = false;
        useConversationCountsMock.mockReturnValue([]);

        renderHook(() => useInboxDesktopBadgeCount());
        expect(ipcInboxMessageBrokerMock.send).not.toHaveBeenCalled();
    });

    it('should call with not call when no count', () => {
        ipcHelpersMock.canInvokeInboxDesktopIPC = true;
        useConversationCountsMock.mockReturnValue([]);

        renderHook(() => useInboxDesktopBadgeCount());
        expect(ipcInboxMessageBrokerMock.send).not.toHaveBeenCalled();
    });

    it('should call with 1 when 1 unread', () => {
        ipcHelpersMock.canInvokeInboxDesktopIPC = true;
        useConversationCountsMock.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 1, Total: 1 }]]);

        renderHook(() => useInboxDesktopBadgeCount());
        expect(ipcInboxMessageBrokerMock.send).toHaveBeenCalledWith('updateNotification', 1);
    });

    it('should call with 100 when 100 unread', () => {
        ipcHelpersMock.canInvokeInboxDesktopIPC = true;
        useConversationCountsMock.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 100, Total: 100 }]]);

        renderHook(() => useInboxDesktopBadgeCount());
        expect(ipcInboxMessageBrokerMock.send).toHaveBeenCalledWith('updateNotification', 100);
    });
});
