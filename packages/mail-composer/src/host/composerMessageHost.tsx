import type { ComponentType, ReactNode } from 'react';
import { createContext, useContext } from 'react';

import type { StatusIcon } from '@proton/mail-message/models/crypto';
import type {
    GetMessageKeys,
    MessageState,
    MessageStateWithData,
    OutsideKey,
} from '@proton/mail-message/store/messages/messagesTypes';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

import type { AttachmentAction } from '../attachments/attachmentListTypes';
import type { PendingUpload } from '../attachments/uploadTypes';

export interface EncryptionStatusIconProps extends Partial<StatusIcon> {
    loading?: boolean;
    disabled?: boolean;
    useTooltip?: boolean;
    className?: string;
    shouldHaveHref?: boolean;
}

export interface AttachmentListProps {
    attachments: Attachment[];
    pendingUploads?: PendingUpload[];
    message: MessageStateWithData;
    primaryAction: AttachmentAction;
    secondaryAction: AttachmentAction;
    collapsable: boolean;
    onRemoveAttachment?: (attachment: Attachment) => Promise<void>;
    onRemoveUpload?: (pendingUpload: PendingUpload) => Promise<void>;
    className?: string;
    outsideKey?: OutsideKey;
    noPaddingTop?: boolean;
}

export interface UseMessageResult {
    message: MessageState;
    messageLoaded: boolean;
    bodyLoaded: boolean;
}

/**
 * Message and mail settings hooks tied to the mail app's stores, and the message UI the composer shares with the reader.
 * The value must be a stable object (a module constant), because its hooks are called on every render.
 */
export interface ComposerMessageHost {
    useMessage: (localID: string, conversationID?: string) => UseMessageResult;
    useGetMessageKeys: () => GetMessageKeys;
    useInitializeMessage: () => (localID: string, labelID?: string) => Promise<void>;
    useLoadRemoteImages: (localID: string) => () => Promise<void>;
    useLoadEmbeddedImages: (localID: string) => () => Promise<void>;
    useCreateDraft: () => (message: MessageStateWithData) => Promise<void>;
    useSaveDraft: (params?: { onMessageAlreadySent?: () => void }) => (message: MessageStateWithData) => Promise<void>;
    useDeleteDraft: () => (message: MessageState) => Promise<void>;
    useMailSettings: () => [MailSettings, boolean];
    useGetMailSettings: () => () => Promise<MailSettings>;
    EncryptionStatusIcon: ComponentType<EncryptionStatusIconProps>;
    AttachmentList: ComponentType<AttachmentListProps>;
}

const ComposerMessageHostContext = createContext<ComposerMessageHost | undefined>(undefined);

export const ComposerMessageHostProvider = ({ host, children }: { host: ComposerMessageHost; children: ReactNode }) => (
    <ComposerMessageHostContext.Provider value={host}>{children}</ComposerMessageHostContext.Provider>
);

export const useComposerMessageHost = () => {
    const host = useContext(ComposerMessageHostContext);
    if (!host) {
        throw new Error('useComposerMessageHost must be used inside a ComposerMessageHostProvider');
    }
    return host;
};
