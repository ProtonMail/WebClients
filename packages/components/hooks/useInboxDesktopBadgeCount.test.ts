import { renderHook } from '@testing-library/react-hooks';

import useInboxDesktopBadgeCount from '@proton/components/hooks/useInboxDesktopBadgeCount';
import { useConversationCounts } from '@proton/mail/store/counts/conversationCounts';
import { useMessageCounts } from '@proton/mail/store/counts/messageCounts';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import * as desktopHelpers from '@proton/shared/lib/helpers/desktop';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

jest.mock('@proton/mail/store/mailSettings/hooks');
jest.mock('@proton/mail/store/counts/conversationCounts');
jest.mock('@proton/mail/store/counts/messageCounts');
jest.mock('@proton/shared/lib/helpers/desktop');
const desktopHelpersMock = desktopHelpers as jest.MockedObject<typeof desktopHelpers>;

declare const global: {
    ipcInboxMessageBroker?: any;
};

const originalWindow = { ...window };

describe('useInboxDesktopBadgeCount', () => {
    const useConversationCountsMock = useConversationCounts as jest.Mock;
    const useMessageCountsMock = useMessageCounts as jest.Mock;
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
        desktopHelpersMock.isElectronMail = false;
        useConversationCountsMock.mockReturnValue([]);
        useMessageCountsMock.mockReturnValue([]);

        renderHook(() => useInboxDesktopBadgeCount());
        expect(ipcInboxMessageBrokerMock.send).not.toHaveBeenCalled();
    });

    it('should call with 0 when no count', () => {
        desktopHelpersMock.isElectronMail = true;
        useMailSettingsMock.mockReturnValue([{ ViewMode: VIEW_MODE.GROUP }]);
        useConversationCountsMock.mockReturnValue([[]]);
        useMessageCountsMock.mockReturnValue([]);

        renderHook(() => useInboxDesktopBadgeCount());
        expect(ipcInboxMessageBrokerMock.send).toHaveBeenCalledWith('updateNotification', 0);
    });

    it('should call with 0 when negative count', () => {
        desktopHelpersMock.isElectronMail = true;
        useMailSettingsMock.mockReturnValue([{ ViewMode: VIEW_MODE.GROUP }]);
        useConversationCountsMock.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: -1, Total: 1 }]]);
        useMessageCountsMock.mockReturnValue([]);

        renderHook(() => useInboxDesktopBadgeCount());
        expect(ipcInboxMessageBrokerMock.send).toHaveBeenCalledWith('updateNotification', 0);
    });

    it('should call with 1 when 1 unread conversation', () => {
        desktopHelpersMock.isElectronMail = true;
        useMailSettingsMock.mockReturnValue([{ ViewMode: VIEW_MODE.GROUP }]);
        useConversationCountsMock.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 1, Total: 1 }]]);
        useMessageCountsMock.mockReturnValue([]);

        renderHook(() => useInboxDesktopBadgeCount());
        expect(ipcInboxMessageBrokerMock.send).toHaveBeenCalledWith('updateNotification', 1);
    });

    it('should call with 100 when 100 unread conversation', () => {
        desktopHelpersMock.isElectronMail = true;
        useMailSettingsMock.mockReturnValue([{ ViewMode: VIEW_MODE.GROUP }]);
        useConversationCountsMock.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 100, Total: 100 }]]);
        useMessageCountsMock.mockReturnValue([]);

        renderHook(() => useInboxDesktopBadgeCount());
        expect(ipcInboxMessageBrokerMock.send).toHaveBeenCalledWith('updateNotification', 100);
    });

    it('should call with 1 when 1 unread message', () => {
        desktopHelpersMock.isElectronMail = true;
        useMailSettingsMock.mockReturnValue([{ ViewMode: VIEW_MODE.SINGLE }]);
        useConversationCountsMock.mockReturnValue([]);
        useMessageCountsMock.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 1, Total: 1 }]]);

        renderHook(() => useInboxDesktopBadgeCount());
        expect(ipcInboxMessageBrokerMock.send).toHaveBeenCalledWith('updateNotification', 1);
    });

    it('should call with 100 when 100 unread message', () => {
        desktopHelpersMock.isElectronMail = true;
        useMailSettingsMock.mockReturnValue([{ ViewMode: VIEW_MODE.SINGLE }]);
        useConversationCountsMock.mockReturnValue([]);
        useMessageCountsMock.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 100, Total: 100 }]]);

        renderHook(() => useInboxDesktopBadgeCount());
        expect(ipcInboxMessageBrokerMock.send).toHaveBeenCalledWith('updateNotification', 100);
    });
});
