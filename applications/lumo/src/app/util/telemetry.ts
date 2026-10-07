import { telemetry } from '@proton/shared/lib/telemetry';

import type { WebpageViewMode } from '../components/Conversation/artifact/ArtifactContent';
import type { ArtifactPanelLayout } from '../components/Conversation/artifact/ArtifactPanel';
import type { ArtifactSaveFormat } from '../components/Conversation/artifact/artifactSaveFormats';
import type { ArtifactType } from '../components/Conversation/artifact/parseArtifacts';
import type { ArtifactToolMode } from '../components/Conversation/helper';
import type { ArtifactActionKind } from '../types';

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

export type ArtifactCreationToggleScope = 'conversation' | 'pending-new-chat';

export const sendArtifactCreationToggledEvent = (isCurrentlyEnabled: boolean, scope: ArtifactCreationToggleScope) => {
    sendLumoComposerEvent('artifact-creation', {
        action: isCurrentlyEnabled ? 'disable' : 'enable',
        scope,
    });
};

export const sendFileUploadEvent = () => {
    sendLumoComposerEvent('file-upload');
};

export const sendFileUploadFromDriveEvent = () => {
    sendLumoComposerEvent('file-upload-drive');
};

export const sendVoiceEntryEvent = (action: 'start' | 'cancel' | 'accept') => {
    sendLumoComposerEvent('voice-entry', { action });
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

/**
 * Telemetry events for artifacts
 */

// Where a panel open came from: auto-opened by a generation, or by the user from a chat chip,
// the header's artifact switcher, or an "edited artifact" marker in the chat.
export type ArtifactPanelOpenSource = 'auto' | 'chip' | 'switcher' | 'edit-marker';

export type ArtifactRevisionSource = 'prompt' | 'inline-edit' | 'manual-edit';

export type ArtifactDownloadFormat = 'source' | 'txt' | 'pdf' | 'pptx';

export type ArtifactDownloadResult = 'success' | 'print_fallback' | 'error';

export type ArtifactContentLengthBucket = '0-1k' | '1k-10k' | '10k+';

export const bucketArtifactContentLength = (length: number): ArtifactContentLengthBucket => {
    if (length < 1000) {
        return '0-1k';
    }
    if (length < 10000) {
        return '1k-10k';
    }
    return '10k+';
};

// Model-supplied free text, so it's mapped onto a fixed list before it's sent.
const ARTIFACT_LANGUAGE_ALIASES = {
    js: 'javascript',
    jsx: 'javascript',
    javascript: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    typescript: 'typescript',
    py: 'python',
    python: 'python',
    html: 'html',
    css: 'css',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    'c++': 'cpp',
    cs: 'csharp',
    csharp: 'csharp',
    'c#': 'csharp',
    go: 'go',
    golang: 'go',
    rust: 'rust',
    rs: 'rust',
    ruby: 'ruby',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kotlin: 'kotlin',
    kt: 'kotlin',
    sql: 'sql',
    bash: 'shell',
    sh: 'shell',
    shell: 'shell',
    zsh: 'shell',
    powershell: 'powershell',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    markdown: 'markdown',
    md: 'markdown',
    text: 'text',
    plaintext: 'text',
} as const satisfies Record<string, string>;

export type ArtifactLanguageBucket =
    (typeof ARTIFACT_LANGUAGE_ALIASES)[keyof typeof ARTIFACT_LANGUAGE_ALIASES] | 'other' | 'none';

const artifactLanguageLookup: Record<string, ArtifactLanguageBucket | undefined> = ARTIFACT_LANGUAGE_ALIASES;

export const bucketArtifactLanguage = (language: string | undefined): ArtifactLanguageBucket => {
    if (!language) {
        return 'none';
    }
    return artifactLanguageLookup[language.trim().toLowerCase()] ?? 'other';
};

const MAX_ARTIFACT_POSITION = 10;

// Caps the artifact's ordinal in its conversation; 10 means "10th or later".
export const capArtifactPosition = (position: number): number => {
    return Math.min(position, MAX_ARTIFACT_POSITION);
};

const sendLumoArtifactEvent = (eventType: string, eventData?: Record<string, unknown>) => {
    sendLumoCustomEvent('lumo-artifact-event', {
        eventType,
        ...eventData,
    });
};

export const sendArtifactCreationDefaultChangedEvent = (enabled: boolean) => {
    sendLumoArtifactEvent('artifact-creation-default-changed', { enabled });
};

export type ArtifactGenerationType = 'new' | 'regenerate' | 'retry';

/**
 * One per generation where the artifact feature is available — the denominator for how often the
 * model reaches for `create_artifact` in each mode. Sent from the send paths with the mode the
 * request was actually built with.
 */
export const sendArtifactTurnContextEvent = ({
    generationType,
    artifactToolMode,
    hasExistingArtifact,
}: {
    generationType: ArtifactGenerationType;
    artifactToolMode: ArtifactToolMode;
    hasExistingArtifact: boolean;
}) => {
    sendLumoArtifactEvent('artifact-turn-context', {
        generationType,
        artifactToolMode,
        hasExistingArtifact,
    });
};

export interface ArtifactCreatedEventPayload {
    artifactType: ArtifactType;
    // Undefined only for versions that didn't come from the model (manual edits).
    artifactToolMode?: ArtifactToolMode;
    artifactPosition: number;
    contentLengthBucket: ArtifactContentLengthBucket;
    // Code artifacts only.
    languageBucket?: ArtifactLanguageBucket;
}

export const sendArtifactCreatedEvent = ({
    artifactType,
    artifactToolMode,
    artifactPosition,
    contentLengthBucket,
    languageBucket,
}: ArtifactCreatedEventPayload) => {
    sendLumoArtifactEvent('artifact-created', {
        artifactType,
        ...(artifactToolMode !== undefined && { artifactToolMode }),
        artifactPosition,
        contentLengthBucket,
        ...(languageBucket !== undefined && { languageBucket }),
    });
};

export interface ArtifactRevisedEventPayload {
    artifactType: ArtifactType;
    artifactToolMode?: ArtifactToolMode;
    artifactPosition: number;
    contentLengthBucket: ArtifactContentLengthBucket;
    revisionSource: ArtifactRevisionSource;
    // 1-based: the first revision is version 2.
    versionNumber: number;
}

export const sendArtifactRevisedEvent = ({
    artifactType,
    artifactToolMode,
    artifactPosition,
    contentLengthBucket,
    revisionSource,
    versionNumber,
}: ArtifactRevisedEventPayload) => {
    sendLumoArtifactEvent('artifact-revised', {
        artifactType,
        ...(artifactToolMode !== undefined && { artifactToolMode }),
        artifactPosition,
        contentLengthBucket,
        revisionSource,
        versionNumber,
    });
};

export const sendArtifactPanelOpenedEvent = ({
    source,
    artifactType,
    artifactPosition,
}: {
    source: ArtifactPanelOpenSource;
    artifactType: ArtifactType;
    artifactPosition: number;
}) => {
    sendLumoArtifactEvent('panel-opened', {
        source,
        artifactType,
        artifactPosition,
    });
};

export type ArtifactPanelOpenDurationBucket = '0-10s' | '10s-1m' | '1m-5m' | '5m+';

export const bucketArtifactPanelOpenDuration = (durationMs: number): ArtifactPanelOpenDurationBucket => {
    if (durationMs < 10_000) {
        return '0-10s';
    }
    if (durationMs < 60_000) {
        return '10s-1m';
    }
    if (durationMs < 300_000) {
        return '1m-5m';
    }
    return '5m+';
};

/**
 * `closedDuringLoading` is a close before any artifact content appeared (only the loading
 * skeleton was showing), so there is no artifact type or open duration to report.
 */
export type ArtifactPanelClosedEventPayload =
    | { closedDuringLoading: true }
    | {
          closedDuringLoading: false;
          artifactType: ArtifactType;
          openDurationBucket: ArtifactPanelOpenDurationBucket;
      };

export const sendArtifactPanelClosedEvent = (payload: ArtifactPanelClosedEventPayload) => {
    sendLumoArtifactEvent('panel-closed', { ...payload });
};

export const sendArtifactContentCopiedEvent = ({
    artifactType,
    layout,
}: {
    artifactType: ArtifactType;
    layout: ArtifactPanelLayout;
}) => {
    sendLumoArtifactEvent('content-copied', {
        artifactType,
        layout,
    });
};

export const sendArtifactDownloadedEvent = ({
    format,
    artifactType,
    layout,
    result,
}: {
    format: ArtifactDownloadFormat;
    artifactType: ArtifactType;
    layout: ArtifactPanelLayout;
    result: ArtifactDownloadResult;
}) => {
    sendLumoArtifactEvent('downloaded', {
        format,
        artifactType,
        layout,
        result,
    });
};

export const sendArtifactInlineActionSentEvent = ({
    kind,
    artifactType,
    layout,
}: {
    kind: ArtifactActionKind;
    artifactType: ArtifactType;
    layout: ArtifactPanelLayout;
}) => {
    sendLumoArtifactEvent('inline-action-sent', {
        kind,
        artifactType,
        layout,
    });
};

export const sendArtifactSaveToDriveCompletedEvent = ({
    format,
    artifactType,
    result,
}: {
    format: ArtifactSaveFormat;
    artifactType: ArtifactType;
    result: 'success' | 'error';
}) => {
    sendLumoArtifactEvent('save-to-drive-completed', {
        format,
        artifactType,
        result,
    });
};

export const sendArtifactWebpageViewToggledEvent = ({
    mode,
    layout,
}: {
    mode: WebpageViewMode;
    layout: ArtifactPanelLayout;
}) => {
    sendLumoArtifactEvent('webpage-view-toggled', {
        mode,
        layout,
    });
};
