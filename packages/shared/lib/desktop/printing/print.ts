// NOTE: This should be removed from the codebase once Inbox Desktop App 1.14+ reaches a significant adoption threshold.
import { isMac } from '../../helpers/browser';
import { isElectronMail } from '../../helpers/desktop';
import { hasInboxDesktopFeature, invokeInboxDesktopIPC } from '../ipcHelpers';
import { serializeAndSanitizeDocument } from './serialization';

export const inboxDesktopHasPrintDialogOption = (): boolean => {
    if (!isMac() || !isElectronMail || !window.ipcInboxMessageBroker?.send || !hasInboxDesktopFeature('PrintDialog')) {
        return false;
    }
    return true;
};

export const inboxDesktopPrintDialog = async (doc: Document) => {
    const serializedHTMLContent = await serializeAndSanitizeDocument(doc);
    if (!inboxDesktopHasPrintDialogOption()) {
        return;
    }
    void invokeInboxDesktopIPC({ type: 'togglePrintDialog', payload: serializedHTMLContent });
};
