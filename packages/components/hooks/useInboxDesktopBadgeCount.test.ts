import { renderHook } from '@testing-library/react-hooks';

import { useConversationCounts, useMailSettings } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { UNREAD_FAVICON } from '@proton/shared/lib/mail/mailSettings';

import { useInboxDesktopBadgeCount } from './';

jest.mock('@proton/components/hooks/useConversationCounts');
jest.mock('@proton/components/hooks/useMailSettings');
jest.mock('@proton/shared/lib/helpers/desktop');

declare const global: {
    protonDesktopAPI?: any;
};

const originalWindow = { ...window };

describe('useInboxDesktopBadgeCount', () => {
    const isElectronAppMock = isElectronApp as jest.Mock;
    const useConversationCountsMock = useConversationCounts as jest.Mock;
    const useMailSettingsMock = useMailSettings as jest.Mock;
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
        isElectronAppMock.mockReturnValue(false);
        useConversationCountsMock.mockReturnValue([]);
        useMailSettingsMock.mockReturnValue([{}]);

        renderHook(() => useInboxDesktopBadgeCount());
        expect(ipcInboxMessageBrokerMock.send).not.toHaveBeenCalled();
    });

    it('should call with 0 when unread favicon is disabled', () => {
        isElectronAppMock.mockReturnValue(true);
        useConversationCountsMock.mockReturnValue([]);
        useMailSettingsMock.mockReturnValue([{ UnreadFavicon: UNREAD_FAVICON.DISABLED }]);

        renderHook(() => useInboxDesktopBadgeCount());
        expect(ipcInboxMessageBrokerMock.send).toHaveBeenCalledWith('updateNotification', 0);
    });

    it('should call with not call when unread enabled but no count', () => {
        isElectronAppMock.mockReturnValue(true);
        useConversationCountsMock.mockReturnValue([]);
        useMailSettingsMock.mockReturnValue([{ UnreadFavicon: UNREAD_FAVICON.ENABLED }]);

        renderHook(() => useInboxDesktopBadgeCount());
        expect(ipcInboxMessageBrokerMock.send).not.toHaveBeenCalled();
    });

    it('should call with 1 when unread enabled and count', () => {
        isElectronAppMock.mockReturnValue(true);
        useConversationCountsMock.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 1, Total: 1 }]]);
        useMailSettingsMock.mockReturnValue([{ UnreadFavicon: UNREAD_FAVICON.ENABLED }]);

        renderHook(() => useInboxDesktopBadgeCount());
        expect(ipcInboxMessageBrokerMock.send).toHaveBeenCalledWith('updateNotification', 1);
    });

    it('should call with 100 when unread enabled and count', () => {
        isElectronAppMock.mockReturnValue(true);
        useConversationCountsMock.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 100, Total: 100 }]]);
        useMailSettingsMock.mockReturnValue([{ UnreadFavicon: UNREAD_FAVICON.ENABLED }]);

        renderHook(() => useInboxDesktopBadgeCount());
        expect(ipcInboxMessageBrokerMock.send).toHaveBeenCalledWith('updateNotification', 100);
    });

    it('should call with 0 when unread enabled and no unread', () => {
        isElectronAppMock.mockReturnValue(true);
        useConversationCountsMock.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Total: 1 }]]);
        useMailSettingsMock.mockReturnValue([{ UnreadFavicon: UNREAD_FAVICON.ENABLED }]);

        renderHook(() => useInboxDesktopBadgeCount());
        expect(ipcInboxMessageBrokerMock.send).toHaveBeenCalledWith('updateNotification', 0);
    });
});
