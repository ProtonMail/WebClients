import { telemetry } from '@proton/shared/lib/telemetry';

/**
 * The shared telemetry singleton can only send events once it has been
 * initialised with a valid UID and the user has telemetry enabled. When that's
 * not the case (e.g. guests without a session, or users who opted out of
 * telemetry), attempting to send events makes the singleton report a
 * "telemetry has not been initialised" message to Sentry for every interaction.
 *
 * We therefore track whether telemetry is usable at the Lumo level and skip
 * sending events entirely when it isn't.
 */
let telemetryEnabled = false;

export const setLumoTelemetryEnabled = (enabled: boolean) => {
    telemetryEnabled = enabled;
};

const sendLumoCustomEvent: (typeof telemetry)['sendCustomEvent'] = (...args) => {
    if (!telemetryEnabled) {
        return;
    }

    return telemetry.sendCustomEvent(...args);
};

export const sendNewMessageDataEvent = (
    actionType: 'send' | 'edit' | 'regenerate',
    isNewConversation: boolean,
    isWebSearchButtonToggled: boolean,
    hasAttachments: boolean,
    isGhostConversation: boolean
) => {
    sendLumoCustomEvent('lumo-user-prompt-event', {
        actionType,
        isNewConversation,
        isWebSearchButtonToggled,
        hasAttachments,
        isGhostConversation,
    });
};

export const sendUpgradeButtonClickedEvent = ({
    feature,
    // buttonType,
    to,
}: {
    feature: string;
    // buttonType?: string;
    to?: string;
}) => {
    sendLumoCustomEvent('lumo-upgrade-button-clicked', {
        feature,
        // buttonType,
        to,
    });
};

/**
 * Telemetry events for the composer component
 */
const sendLumoComposerEvent = (eventType: string, eventData?: Record<string, any>) => {
    sendLumoCustomEvent('lumo-composer-event', {
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
    sendLumoCustomEvent('lumo-file-upload-event', {
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
    sendLumoCustomEvent('lumo-subscription-modal-event', {
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
    sendLumoCustomEvent('lumo-message-event', {
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
    sendLumoCustomEvent('lumo-conversation-event', {
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

/**
 * Telemetry events for projects
 */

const sendLumoProjectEvent = (eventType: string, eventData?: Record<string, any>) => {
    sendLumoCustomEvent('lumo-project-event', {
        eventType,
        ...eventData,
    });
};

export const sendProjectCreateEvent = () => {
    sendLumoProjectEvent('create');
};

export const sendProjectDeleteEvent = () => {
    sendLumoProjectEvent('delete');
};

export const sendProjectDriveFolderLinkEvent = () => {
    sendLumoProjectEvent('drive-folder-link');
};

export const sendProjectDriveFolderUnlinkEvent = () => {
    sendLumoProjectEvent('drive-folder-unlink');
};

/**
 * Telemetry events for the guest notification card
 */

const sendLumoGuestNotificationEvent = (eventType: string, eventData?: Record<string, any>) => {
    sendLumoCustomEvent('lumo-guest-notification-event', {
        eventType,
        ...eventData,
    });
};

export const sendGuestNotificationDismissedEvent = (messageCount: number) => {
    sendLumoGuestNotificationEvent('dismissed', { messageCount });
};

export const sendGuestNotificationCtaClickedEvent = (messageCount: number) => {
    sendLumoGuestNotificationEvent('cta-clicked', { messageCount });
};

/**
 * Telemetry events for the ghost chat button
 */

export const sendGhostChatToggledEvent = (enabled: boolean) => {
    sendLumoCustomEvent('lumo-ghost-chat-toggled', { enabled });
};
