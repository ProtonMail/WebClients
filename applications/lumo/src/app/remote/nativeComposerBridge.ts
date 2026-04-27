import {
    PROTON_DOCS_DOCUMENT_MIMETYPE,
    PROTON_DOCS_SPREADSHEET_MIMETYPE,
    isAudio,
    isExcel,
    isFont,
    isICS,
    isImage,
    isPDF,
    isProtonDocsDocument,
    isProtonDocsSpreadsheet,
    isSupportedText,
    isVideo,
} from '@proton/shared/lib/helpers/mimetype';

import type { ModelTier } from '../providers/ModelTierProvider';
import { LUMO_API_ERRORS } from '../types';

/**
 * Native Composer Bridge
 * Provides API for native clients to interact with Lumo's composer
 * Similar to paymentBridge.ts
 */

export enum LumoMode {
    Idle = 'Idle',
    Working = 'Working',
}

export interface LumoFile {
    name: string;
    type: LumoFileType; // PDF, IMG, etc. - for displaying the correct icon
    id: string; // Optional unique identifier for the file
    preview: string | null;
}

export enum LumoFileType {
    Album = 'Album',
    Attachments = 'Attachments',
    Calendar = 'Calendar',
    Doc = 'Doc',
    Folder = 'Folder',
    Font = 'Font',
    Image = 'Image',
    Keynote = 'Keynote',
    Keytrust = 'Keytrust',
    Numbers = 'Numbers',
    Pages = 'Pages',
    PDF = 'PDF',
    PPT = 'PPT',
    Sound = 'Sound',
    Text = 'Text',
    Unknown = 'Unknown',
    Video = 'Video',
    XLS = 'XLS',
    XML = 'XML',
    Zip = 'Zip',
    ProtonDoc = 'ProtonDoc',
    ProtonSheet = 'ProtonSheet',
}

export interface FeatureFlags {
    isImageGenEnabled: boolean;
    isModelSelectionEnabled: boolean;
    isToolsEnabled: boolean;
}

export interface UserFlags {
    isFreeUser: boolean;
    isGuestUser: boolean;
}

export interface State {
    lumoMode: LumoMode;
    modelTier: ModelTier;
    isGhostModeEnabled: boolean;
    isWebSearchEnabled: boolean;
    isCreateImageEnabled: boolean;
    isVisible: boolean;
    showTsAndCs: boolean;
    userFlags: UserFlags;
    attachedFiles: LumoFile[];
    featureFlags: FeatureFlags;
}

/**
 * Resource type tied to a backend-enforced usage limit. Mirrors the
 * `ResourceLimitType` from the Redux error slice; duplicated here so the
 * bridge remains free of Redux imports.
 */
export type LimitReachedResource = 'messages' | 'assets' | 'conversations' | 'spaces';

export interface LimitReachedPayload {
    /**
     * Typed error identifier from `LUMO_API_ERRORS` so native clients can
     * branch on a stable enum value (`MessageLimitReached`, `AssetLimitReached`,
     * etc.) instead of parsing free-form resource strings.
     */
    errorType: LUMO_API_ERRORS;
    resource: LimitReachedResource;
    limit: number;
    /** Optional raw server message for debugging / logging on the native side. */
    message?: string;
}

/** Maps the internal resource string to the `LUMO_API_ERRORS` enum value. */
export const limitResourceToErrorType = (resource: LimitReachedResource): LUMO_API_ERRORS => {
    switch (resource) {
        case 'messages':
            return LUMO_API_ERRORS.MESSAGE_LIMIT_REACHED;
        case 'assets':
            return LUMO_API_ERRORS.ASSET_LIMIT_REACHED;
        case 'conversations':
            return LUMO_API_ERRORS.CONVERSATION_LIMIT_REACHED;
        case 'spaces':
            return LUMO_API_ERRORS.SPACE_LIMIT_REACHED;
    }
};

/**
 * Sends the result/error of an API call back to the native side
 */
const sendResultToNative = (callId: string, payload: any) => {
    const message = { callId, ...payload };
    console.log(`Native Composer Bridge: Sending message for callId ${callId}`, message);
    try {
        if ((window as any).webkit?.messageHandlers?.nativeComposerHandler) {
            // iOS bridge
            (window as any).webkit.messageHandlers.nativeComposerHandler.postMessage(message);
        } else if ((window as any).Android?.postMessage) {
            // Android bridge
            (window as any).Android.postMessage(JSON.stringify(message));
        } else {
            console.warn(`Native Composer Bridge: Native bridge not detected for callId ${callId}. Payload:`, payload);
        }
    } catch (e) {
        console.error(`Native Composer Bridge: Error sending message to native for callId ${callId}:`, e);
    }
};

/**
 * Injects an image generation helper prompt to the native side
 */
const injectImageGenerationHelperPrompt = (prompt: string) => {
    console.log('Native Composer Bridge: Injecting image generation helper prompt to native', prompt);
    try {
        if ((window as any).webkit?.messageHandlers?.nativeComposerImageGenerationHelperPromptHandler) {
            // iOS bridge
            (window as any).webkit.messageHandlers.nativeComposerImageGenerationHelperPromptHandler.postMessage(prompt);
        } else if ((window as any).Android?.injectImageGenerationHelperPrompt) {
            // Android bridge
            (window as any).Android.injectImageGenerationHelperPrompt(prompt);
        } else {
            console.log(
                'Native Composer Bridge: Native bridge not detected for image generation helper prompt. Prompt:',
                prompt
            );
        }
    } catch (e) {
        console.log('Native Composer Bridge: Error injecting image generation helper prompt to native:', e);
    }
};

/**
 * Sends state updates to the native side
 */
const sendStateToNative = (state: State) => {
    console.log('Native Composer Bridge: Sending state update to native', state);
    try {
        if ((window as any).webkit?.messageHandlers?.nativeComposerStateHandler) {
            // iOS bridge - state updates
            (window as any).webkit.messageHandlers.nativeComposerStateHandler.postMessage(state);
        } else if ((window as any).Android?.onStateChange) {
            // Android bridge - state updates
            (window as any).Android.onStateChange(JSON.stringify(state));
        } else {
            console.log('Native Composer Bridge: Native bridge not detected for state update. State:', state);
        }
    } catch (e) {
        console.log('Native Composer Bridge: Error sending state to native:', e);
    }
};

class NativeComposerApi {
    private state: State = {
        isGhostModeEnabled: false,
        lumoMode: LumoMode.Idle,
        modelTier: 'auto',
        isCreateImageEnabled: false,
        attachedFiles: [],
        isWebSearchEnabled: false,
        isVisible: true,
        showTsAndCs: true,
        userFlags: {
            isGuestUser: true,
            isFreeUser: true,
        },
        featureFlags: {
            isImageGenEnabled: false,
            isModelSelectionEnabled: false,
            isToolsEnabled: true,
        },
    };

    constructor() {
        console.log('NativeComposerApi instance created with default state:', this.state);
    }

    /**
     * Get the current state
     */
    public getState(): State {
        return { ...this.state };
    }

    /**
     * Update state and notify native
     */
    private updateState(updates: Partial<State>): void {
        const oldState = this.state;
        const newState = {
            ...this.state,
            ...updates,
        };

        // Previews are only sent once. Strip the preview from any file that already
        // had one in the old state so it won't be transmitted again.
        const oldPreviewedIds = new Set(oldState.attachedFiles.filter((f) => f.preview !== null).map((f) => f.id));
        if (oldPreviewedIds.size > 0) {
            newState.attachedFiles = newState.attachedFiles.map((file) =>
                oldPreviewedIds.has(file.id) ? { ...file, preview: null } : file
            );
        }

        if (oldState !== newState) {
            sendStateToNative(newState);
            this.state = newState;
        }
    }

    /**
     * Set ghost mode on/off
     */
    public setGhostMode(enabled: boolean): void {
        console.log(`NativeComposerApi: Setting ghost mode to ${enabled}`);
        this.updateState({ isGhostModeEnabled: enabled });
    }

    /**
     * Set the current Lumo state (Idle, Thinking)
     */
    public setLumoState(mode: LumoMode): void {
        console.log(`NativeComposerApi: Setting Lumo mode to ${mode}`);
        this.updateState({ lumoMode: mode });
    }

    /**
     * Add files to the attached files list
     */
    public addFiles(files: LumoFile[]): void {
        console.log(`NativeComposerApi: Adding ${files.length} files`, files);

        const byId = new Map<string, LumoFile>();

        for (const file of this.state.attachedFiles) {
            if (file.id) byId.set(file.id, file);
        }

        for (const file of files) {
            if (file.id) byId.set(file.id, file);
        }

        const merged = [
            ...byId.values(),
            ...this.state.attachedFiles.filter((f) => !f.id),
            ...files.filter((f) => !f.id),
        ];

        this.updateState({ attachedFiles: merged });
    }

    /**
     * Remove a file from the attached files list
     */
    public removeFile(id: string): void {
        console.log(`NativeComposerApi: Removing file ${id}`);
        const filteredFiles = this.state.attachedFiles.filter((file) => file.id !== id);
        this.updateState({ attachedFiles: filteredFiles });
    }

    public async removeFileEvent(id: string): Promise<any> {
        console.log('NativeComposerApi: Removing file', { id });

        // Dispatch a custom event that the web app can listen to
        const event = new CustomEvent('lumo:removeFile', {
            detail: {
                attachmentId: id,
            },
        });
        window.dispatchEvent(event);

        // Return success (the actual API call will be handled by the web app)
        return { success: true };
    }

    public async previewFile(id: string): Promise<any> {
        console.log('NativeComposerApi: Preview file with id:', { id });

        const event = new CustomEvent('lumo:previewFile', {
            detail: {
                attachmentId: id,
            },
        });
        window.dispatchEvent(event);

        // Return success (the actual API call will be handled by the web app)
        return { success: true };
    }

    /**
     * Clear all attached files
     */
    public clearFiles(): void {
        console.log('NativeComposerApi: Clearing all files');
        this.updateState({ attachedFiles: [] });
    }

    /**
     * Set the attached files list (replaces existing)
     */
    public setFiles(files: LumoFile[]): void {
        console.log(`NativeComposerApi: Setting files`, files);
        this.updateState({ attachedFiles: files });
    }

    public setCreateImage(enabled: boolean): void {
        console.log(`NativeComposerApi: Setting create image to ${enabled}`);
        this.updateState({ isCreateImageEnabled: enabled });
    }

    public setNativeModelTier(modelTier: ModelTier): void {
        console.log(`NativeComposerApi: Setting model type to ${modelTier}`);
        this.updateState({ modelTier: modelTier });
    }

    public setWebSearch(enabled: boolean): void {
        console.log(`NativeComposerApi: Setting web search to ${enabled}`);
        this.updateState({ isWebSearchEnabled: enabled });
    }

    public async toggleWebSearch(): Promise<any> {
        console.log(`NativeComposerApi: Toggle web search`);

        // Dispatch a custom event that the web app can listen to
        const event = new CustomEvent('lumo:toggleWebSearch', {
            detail: null,
        });
        window.dispatchEvent(event);

        // Return success (the actual API call will be handled by the web app)
        return { success: true };
    }

    public async toggleCreateImage(): Promise<any> {
        console.log(`NativeComposerApi: Toggle create image`);
        const event = new CustomEvent('lumo:toggleCreateImage', {
            detail: { source: 'nativeComposer' },
        });
        window.dispatchEvent(event);

        // Return success (the actual API call will be handled by the web app)
        return { success: true };
    }

    public async changeModelTier(modelTier: ModelTier): Promise<any> {
        console.log(`NativeComposerApi: Change model`);
        const event = new CustomEvent('lumo:changeModelTier', {
            detail: { source: 'nativeComposer', modelTier: modelTier },
        });
        window.dispatchEvent(event);

        // Return success (the actual API call will be handled by the web app)
        return { success: true };
    }

    public setTsAndCsVisibility(visible: boolean): void {
        console.log(`NativeComposerApi: Setting T&Cs visibility to ${visible}`);
        this.updateState({ showTsAndCs: visible });
    }

    public uploadFiles(files: { base64: string; name: string }[]): void {
        console.log('NativeComposerApi: Open file picker with files', files);
        const event = new CustomEvent('lumo:uploadFiles', {
            detail: { source: 'nativeComposer', files },
        });
        window.dispatchEvent(event);
    }

    public openProtonDrive(): void {
        console.log('NativeComposerApi: Open Proton Drive');
        const event = new CustomEvent('lumo:openDrive', {
            detail: { source: 'nativeComposer' },
        });
        window.dispatchEvent(event);
    }

    public openSketch(): void {
        console.log('NativeComposerApi: Open sketch');
        const event = new CustomEvent('lumo:openSketch', {
            detail: { source: 'nativeComposer' },
        });
        window.dispatchEvent(event);
    }

    public openAccount(): void {
        console.log('NativeComposerApi: Open account');
        const event = new CustomEvent('lumo:openAccount', {
            detail: { source: 'nativeComposer' },
        });
        window.dispatchEvent(event);
    }

    /**
     * Send a prompt to Lumo
     * Files should be picked up by the Web API since they're still uploaded through it
     */
    public async sendPrompt(text: string): Promise<any> {
        console.log('NativeComposerApi: Sending prompt to Lumo', { text, files: this.state.attachedFiles });
        // Dispatch a custom event that the web app can listen to
        const event = new CustomEvent('lumo:sendPrompt', {
            detail: {
                text,
                webSearchEnabled: this.state.isWebSearchEnabled,
            },
        });
        window.dispatchEvent(event);

        // Return success (the actual API call will be handled by the web app)
        return { success: true };
    }

    public async abortPrompt(): Promise<any> {
        console.log('NativeComposerApi: Aborting prompt');

        const event = new CustomEvent('lumo:abortPrompt', {
            detail: { source: 'nativeComposer' },
        });
        window.dispatchEvent(event);

        return { success: true };
    }

    public toggleComposerVisibility(visible: boolean): void {
        console.log(`NativeComposerApi: Composer visibility ${visible}`);
        this.updateState({ isVisible: visible });
    }

    public toggleImageGenEnabled(enabled: boolean): void {
        console.log(`NativeComposerApi: Toggle image gen enabled`);
        this.updateState({ featureFlags: { ...this.state.featureFlags, isImageGenEnabled: enabled } });
    }

    public toggleModelSelectionEnabled(enabled: boolean): void {
        console.log(`NativeComposerApi: Toggle model selection enabled`);
        this.updateState({ featureFlags: { ...this.state.featureFlags, isModelSelectionEnabled: enabled } });
    }

    public setToolsEnabled(enabled: boolean): void {
        console.log(`NativeComposerApi: Set tools enabled to ${enabled}`);
        this.updateState({ featureFlags: { ...this.state.featureFlags, isToolsEnabled: enabled } });
    }

    public setIsFreeUser(isFreeUser: boolean): void {
        console.log(`NativeComposerApi: Set isFreeUser`);
        this.updateState({ userFlags: { ...this.state.userFlags, isFreeUser: isFreeUser } });
    }

    public setIsGuestUser(isGuestUser: boolean): void {
        console.log(`NativeComposerApi: Set isGuestUser`);
        this.updateState({ userFlags: { ...this.state.userFlags, isGuestUser: isGuestUser } });
    }

    public injectImageGenerationHelperPrompt(prompt: string): void {
        injectImageGenerationHelperPrompt(prompt);
    }

    public onComposerError(error: string): void {
        console.log(`Native Composer Bridge: on composer error: ${error}`);
        sendResultToNative('', { status: 'error', error: error });
    }
}

/**
 * Wraps a NativeComposerApi method to be callable from native code
 */
const createNativeWrapper = (methodName: keyof NativeComposerApi) => {
    return (callId: string, ...args: any[]) => {
        console.log(`Native Composer Bridge: Received call for ${methodName} with callId ${callId}`);
        const apiInstance = (window as any).nativeComposerApiInstance;

        if (!apiInstance) {
            const errorMsg = 'NativeComposerApi instance not found on window.';
            console.error(`Native Composer Bridge: ${errorMsg}`);
            sendResultToNative(callId, { status: 'error', error: errorMsg });
            return;
        }

        const method = apiInstance[methodName];
        if (typeof method !== 'function') {
            const errorMsg = `Method ${methodName} not found on NativeComposerApi instance.`;
            console.error(`Native Composer Bridge: ${errorMsg}`);
            sendResultToNative(callId, { status: 'error', error: errorMsg });
            return;
        }

        try {
            const result = method.apply(apiInstance, args);

            // Handle both promises and direct results
            if (result instanceof Promise) {
                result
                    .then((resData) => {
                        sendResultToNative(callId, { status: 'success', data: resData });
                    })
                    .catch((error) => {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        console.error(
                            `Native Composer Bridge: Error during async ${methodName} call for callId ${callId}:`,
                            error
                        );
                        sendResultToNative(callId, { status: 'error', error: errorMessage });
                    });
            } else {
                // Handle synchronous results
                sendResultToNative(callId, { status: 'success', data: result });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(
                `Native Composer Bridge: Synchronous error during ${methodName} call for callId ${callId}:`,
                error
            );
            sendResultToNative(callId, { status: 'error', error: errorMessage });
        }
    };
};

try {
    // Instantiate and expose the NativeComposerApi
    (window as any).nativeComposerApiInstance = new NativeComposerApi();
    console.log(
        'Native Composer Bridge: NativeComposerApi instance created and exposed as window.nativeComposerApiInstance'
    );

    // Expose wrapped methods for native calls
    (window as any).nativeComposerApi = {
        // State queries
        getState: createNativeWrapper('getState'),

        // Ghost mode
        setGhostMode: createNativeWrapper('setGhostMode'),

        // Lumo state
        setLumoState: createNativeWrapper('setLumoState'),

        // File management
        addFiles: createNativeWrapper('addFiles'),
        removeFile: createNativeWrapper('removeFile'),
        removeFileEvent: createNativeWrapper('removeFileEvent'),
        clearFiles: createNativeWrapper('clearFiles'),
        setFiles: createNativeWrapper('setFiles'),

        // Web search
        setWebSearch: createNativeWrapper('setWebSearch'),
        toggleWebSearch: createNativeWrapper('toggleWebSearch'),
        setCreateImage: createNativeWrapper('setCreateImage'),
        toggleCreateImage: createNativeWrapper('toggleCreateImage'),
        changeModelTier: createNativeWrapper('changeModelTier'),

        // Actions
        uploadFiles: createNativeWrapper('uploadFiles'),
        openProtonDrive: createNativeWrapper('openProtonDrive'),
        openSketch: createNativeWrapper('openSketch'),
        openAccount: createNativeWrapper('openAccount'),

        sendPrompt: createNativeWrapper('sendPrompt'),
        abortPrompt: createNativeWrapper('abortPrompt'),

        // Visibility
        toggleComposerVisibility: createNativeWrapper('toggleComposerVisibility'),
        toggleImageGenEnabled: createNativeWrapper('toggleImageGenEnabled'),
        toggleModelSelectionEnabled: createNativeWrapper('toggleModelSelectionEnabled'),
        setIsFreeUser: createNativeWrapper('setIsFreeUser'),
        setIsGuestUser: createNativeWrapper('setIsGuestUser'),
        previewFile: createNativeWrapper('previewFile'),

        // Tools
        setToolsEnabled: createNativeWrapper('setToolsEnabled'),

        // Error handling
        onComposerError: createNativeWrapper('onComposerError'),

        // Image generation
        injectImageGenerationHelperPrompt: createNativeWrapper('injectImageGenerationHelperPrompt'),
    };
    console.log('Native Composer Bridge: Native wrapper functions created under window.nativeComposerApi');

    // Send initial state to native
    const initialState = (window as any).nativeComposerApiInstance.getState();
    sendStateToNative(initialState);

    // Signal readiness
    sendResultToNative('nativeComposerBridgeReady', {
        status: 'success',
        data: 'Native Composer API bridge initialized',
    });
} catch (error) {
    console.error('Native Composer Bridge: Failed to initialize NativeComposerApi bridge:', error);
    sendResultToNative('nativeComposerBridgeError', {
        status: 'error',
        error: 'Failed to initialize Native Composer API bridge',
    });
}

const mimeTypeToFileTypeMap: { [mimeType: string]: LumoFileType } = {
    Folder: LumoFileType.Folder,
    Album: LumoFileType.Album,

    'application/octet-stream': LumoFileType.Unknown, // Default mimetype when the real one cannot be detected.

    'application/x-rar-compressed': LumoFileType.Zip,
    'application/x-zip-compressed': LumoFileType.Zip,
    'application/zip': LumoFileType.Zip,
    'application/x-7z-compressed': LumoFileType.Zip, // .7z — 7-Zip compressed file
    'application/x-arj': LumoFileType.Zip, // .arj — ARJ compressed file
    'application/x-debian-package': LumoFileType.Zip, // .deb — Debian software package file
    'application/x-redhat-package-manager': LumoFileType.Zip, // .rpm
    'application/x-rpm': LumoFileType.Zip, // .rpm
    'application/vnd.rar': LumoFileType.Zip, // .rar – RAR file
    'application/gzip': LumoFileType.Zip, // .tar.gz — Tarball compressed file
    'application/x-gzip': LumoFileType.Zip, // .tar.gz — Tarball compressed file
    'application/x-compress': LumoFileType.Zip, // .z — Z compressed file
    'application/vnd.apple.installer+xml': LumoFileType.Zip, // .pkg

    'application/msword': LumoFileType.Doc,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': LumoFileType.Doc,

    [PROTON_DOCS_DOCUMENT_MIMETYPE]: LumoFileType.ProtonDoc,
    [PROTON_DOCS_SPREADSHEET_MIMETYPE]: LumoFileType.ProtonSheet,

    'application/vnd.ms-powerpoint': LumoFileType.PPT, // .ppt/.pps
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': LumoFileType.PPT,

    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': LumoFileType.XLS, // .xlsm - Microsoft Excel file
    'application/vnd.oasis.opendocument.spreadsheet': LumoFileType.XLS, // .ods — OpenOffice Calc spreadsheet file
    'application/vnd.oasis.opendocument.presentation': LumoFileType.PPT, // .ods — OpenOffice Calc presentation file

    'application/xliff+xml': LumoFileType.XML,
    'application/xml': LumoFileType.XML,
    'text/html': LumoFileType.XML, // .html/.htm
    'application/xhtml+xml': LumoFileType.XML, // .xhtml

    'application/pgp-keys': LumoFileType.Keytrust,

    'application/rtf': LumoFileType.Text,
    'application/x-tex': LumoFileType.Text,
    'application/vnd.oasis.opendocument.text': LumoFileType.Text,
    'application/vnd.wordperfect': LumoFileType.Text,

    'application/vnd.ms-fontobject': LumoFileType.Font,
    'application/font-sfnt': LumoFileType.Font, // ttf
    'application/vnd.oasis.opendocument.formula-template': LumoFileType.Font, // otf

    'application/vnd.apple.pages': LumoFileType.Pages,
    'application/vnd.apple.numbers': LumoFileType.Numbers,
    'application/vnd.apple.keynote': LumoFileType.Keynote,
};

/**
 * Converts a mime type string to a LumoFileType enum value
 * This function matches the logic from FileIcon.tsx to ensure consistent icon display
 */
export const getLumoFileType = (mimeType: string): LumoFileType => {
    // Check explicit mapping first
    if (mimeTypeToFileTypeMap[mimeType]) {
        return mimeTypeToFileTypeMap[mimeType];
    }

    // Check by category using helper functions
    if (isImage(mimeType)) {
        return LumoFileType.Image;
    }

    // Exception for XML to use it\'s own icon and not fallback as text
    if (mimeType === 'text/xml') {
        return LumoFileType.XML;
    }

    if (isICS(mimeType)) {
        return LumoFileType.Calendar;
    }

    if (isSupportedText(mimeType)) {
        return LumoFileType.Text;
    }

    if (isPDF(mimeType)) {
        return LumoFileType.PDF;
    }

    if (isVideo(mimeType)) {
        return LumoFileType.Video;
    }

    if (isAudio(mimeType)) {
        return LumoFileType.Sound;
    }

    if (isFont(mimeType)) {
        return LumoFileType.Font;
    }

    if (isExcel(mimeType)) {
        return LumoFileType.XLS;
    }

    if (isProtonDocsDocument(mimeType)) {
        return LumoFileType.ProtonDoc;
    }

    if (isProtonDocsSpreadsheet(mimeType)) {
        return LumoFileType.ProtonSheet;
    }

    // Default to unknown if no match found
    return LumoFileType.Unknown;
};
