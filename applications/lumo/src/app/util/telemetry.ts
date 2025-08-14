import { telemetry } from '@proton/shared/lib/telemetry';

export const sendNewMessageDataEvent = (
    actionType: 'send' | 'edit' | 'regenerate',
    isNewConversation: boolean,
    isWebSearchButtonToggled: boolean,
    hasAttachments: boolean,
    isGhostConversation: boolean
) => {
    telemetry.sendCustomEvent('lumo-user-prompt-event', {
        actionType,
        isNewConversation,
        isWebSearchButtonToggled,
        hasAttachments,
        isGhostConversation,
    });
};

export const sendUpgradeButtonClickedEvent = ({
    feature,
    buttonType,
    to,
}: {
    feature: string;
    buttonType?: string;
    to?: string;
}) => {
    telemetry.sendCustomEvent('lumo-upgrade-button-clicked', {
        feature,
        buttonType,
        to,
    });
};

/**
 * Telemetry events for the composer component
 */
const sendLumoComposerEvent = (eventType: string, eventData?: Record<string, any>) => {
    telemetry.sendCustomEvent('lumo-composer-event', {
        eventType,
        ...eventData,
    });
};

export const sendWebSearchButtonToggledEvent = (isToggled: boolean) => {
    sendLumoComposerEvent('web-search', {
        action: isToggled ? 'disable' : 'enable',
    });
};

export const sendFileUploadEvent = () => {
    sendLumoComposerEvent('file-upload');
};

export const sendFileUploadFromDriveEvent = () => {
    sendLumoComposerEvent('file-upload-drive');
};

export const sendVoiceEntryClickEvent = () => {
    sendLumoComposerEvent('voice-entry');
};

/**
 * Telemetry events for the file upload
 */
const sendLumoFileUploadEvent = (eventType: string, eventData?: Record<string, any>) => {
    telemetry.sendCustomEvent('lumo-file-upload-event', {
        eventType,
        ...eventData,
    });
};

export const sendFileUploadFinishEvent = (
    fileSize: number,
    fileType: string,
    processedStatus: boolean,
    unsupported: boolean,
    error: boolean,
    processingDurationMs: number
) => {
    sendLumoFileUploadEvent('single-file-upload', {
        fileSize,
        fileType,
        processedStatus,
        unsupported,
        error,
        processingDurationMs,
    });
};

/**
 * Telemetry events for the subscription modal
 */

const sendLumoSubscriptionModalEvent = (event: string, upsellRef?: string) => {
    telemetry.sendCustomEvent('lumo-subscription-modal-event', {
        upsellRef,
        event,
    });
};

export const sendSubscriptionModalSubscribedEvent = (upsellRef?: string) => {
    sendLumoSubscriptionModalEvent('subscribed', upsellRef);
};

export const sendSubscriptionModalInitializedEvent = (upsellRef?: string) => {
    sendLumoSubscriptionModalEvent('initialized', upsellRef);
};

/**
 * Telemetry events for messages
 */

const sendLumoMessageEvent = (eventType: string, eventData?: Record<string, any>) => {
    telemetry.sendCustomEvent('lumo-message-event', {
        eventType,
        ...eventData,
    });
};

export const sendMessageSendEvent = () => {
    sendLumoMessageEvent('send');
};

export const sendMessageGenerationAbortedEvent = () => {
    sendLumoMessageEvent('abort');
};
export const sendMessageEditEvent = () => {
    sendLumoMessageEvent('edit');
};

export const sendMessageRegenerateEvent = () => {
    sendLumoMessageEvent('regenerate');
};
export const sendMessageCopyEvent = () => {
    sendLumoMessageEvent('copy');
};

/**
 * Telemetry events for conversations
 */

const sendLumoConversationEvent = (eventType: string, eventData?: Record<string, any>) => {
    telemetry.sendCustomEvent('lumo-conversation-event', {
        eventType,
        ...eventData,
    });
};

export const sendConversationNewChatEvent = (guest: boolean) => {
    sendLumoConversationEvent('new', {
        guest,
    });
};

export const sendConversationDeleteEvent = () => {
    sendLumoConversationEvent('delete');
};

export const sendConversationFavoriteEvent = (guest: boolean, favorited?: boolean, location?: 'sidebar' | 'header') => {
    sendLumoConversationEvent('favorite', {
        action: !favorited ? 'add' : 'remove',
        guest,
        location,
    });
};

export const sendConversationEditTitleEvent = (location?: 'sidebar' | 'header') => {
    sendLumoConversationEvent('edit-title', {
        location,
    });
};
