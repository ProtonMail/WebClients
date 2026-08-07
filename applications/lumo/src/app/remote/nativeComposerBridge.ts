import isEqual from 'lodash/isEqual';

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

import {
    DEFAULT_MODEL_TIER,
    DEFAULT_RESPONSE_MODE,
    type ModelTier,
    type ResponseMode,
    getSelectedModelTier,
} from '../providers/modelTierConstants';
import { IMAGE_ASPECT_RATIOS, type ImageAspectRatio, LUMO_API_ERRORS } from '../types';

/**
 * Legacy model tier vocabulary kept for already-released native clients that
 * predate the model/mode split. Newer clients read `model` + `responseMode`
 * instead; this field exists so old clients can still decode the bridge state.
 */
export type LegacyModelTier = 'auto' | 'fast' | 'thinking';

/**
 * Native Composer Bridge
 * Provides API for native clients to interact with Lumo's composer
 * Similar to paymentBridge.ts
 */

export enum LumoMode {
    Idle = 'Idle',
    Working = 'Working',
}

/**
 * Native-friendly aspect ratio key. Web uses colon form (`ImageAspectRatio`,
 * e.g. `'16:9'`); native clients read the underscore form (`'16_9'`) because
 * colons are awkward as identifiers on the Swift/Kotlin side.
 */
export type AspectRatioKey<T extends string = ImageAspectRatio> = T extends `${infer A}:${infer B}` ? `${A}_${B}` : T;

export interface AspectRatioInfo {
    /** Underscore form (e.g. `'16_9'`) — what native passes back to `changeAspectRatio`. */
    key: AspectRatioKey;
    width: number;
    height: number;
    ratio: ImageAspectRatio;
}

const toAspectRatioKey = (ratio: ImageAspectRatio): AspectRatioKey => ratio.replace(':', '_') as AspectRatioKey;

/**
 * The available aspect ratios, computed from `IMAGE_ASPECT_RATIOS` (the single
 * source of truth in types-api). Each `'w:h'` string is self-describing, so the
 * width/height and the underscore key are all derived — nothing is hardcoded.
 *
 * An **array**, not a keyed object, because this crosses the native bridge and the
 * order is part of the contract: the picker renders these top to bottom. A JS object
 * cannot express that. `WKScriptMessage` hands iOS an unordered `NSDictionary`, so
 * WebKit discards key order before the app runs a single line — measurably, and with
 * no interception point. An array is the only shape whose order survives the trip.
 *
 * The key moves into each entry, so it stays part of the model rather than being
 * something native has to reconstruct.
 */
export const AVAILABLE_ASPECT_RATIOS: AspectRatioInfo[] = IMAGE_ASPECT_RATIOS.map((ratio) => {
    const [width, height] = ratio.split(':').map(Number);
    return { key: toAspectRatioKey(ratio), width, height, ratio } satisfies AspectRatioInfo;
});

export const DEFAULT_ASPECT_RATIO_KEY: AspectRatioKey = toAspectRatioKey(IMAGE_ASPECT_RATIOS[0]);

/** Reverse lookup (colon → underscore key), built once from `AVAILABLE_ASPECT_RATIOS`. */
const imageRatioToKeyMap = new Map<ImageAspectRatio, AspectRatioKey>(
    AVAILABLE_ASPECT_RATIOS.map((info) => [info.ratio, info.key])
);

/** Forward lookup (underscore key → entry), built once from `AVAILABLE_ASPECT_RATIOS`. */
const keyToAspectRatioMap = new Map<AspectRatioKey, AspectRatioInfo>(
    AVAILABLE_ASPECT_RATIOS.map((info) => [info.key, info])
);

/** Native → web: maps an underscore key back to the web's `ImageAspectRatio`. */
export const aspectRatioKeyToImageRatio = (key: AspectRatioKey): ImageAspectRatio =>
    keyToAspectRatioMap.get(key)?.ratio ?? keyToAspectRatioMap.get(DEFAULT_ASPECT_RATIO_KEY)!.ratio;

/** Web → state: maps an `ImageAspectRatio` to its underscore key. */
export const imageRatioToAspectRatioKey = (ratio: ImageAspectRatio): AspectRatioKey =>
    imageRatioToKeyMap.get(ratio) ?? DEFAULT_ASPECT_RATIO_KEY;

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

export interface EditMode {
    active: boolean;
}

/**
 * Display-only projection of a Custom Lumo (internally an "agent") for the native
 * bridge. Deliberately excludes `instructions`/`conversationStarters` — those are only
 * used server-side on web and would bloat every state push. From native's point of
 * view this is the whole concept: there is no fuller variant it ever sees.
 */
export interface CustomLumo {
    /** Stable id. Pass this straight back into `selectCustomLumo`. */
    id: string;
    /** Display name, shown as the primary label in the picker. */
    name: string;
    /**
     * One of the (web-only, freely growing) `AGENT_ICONS` ids, always populated —
     * never missing (`toCustomLumos` falls back to `DEFAULT_AGENT_ICON`, same as every
     * other web render site). Native parses it into its own statically-bundled icon
     * enum, defaulting on any string it doesn't recognize yet — so this stays a plain
     * `string` here rather than a closed union: the bridge doesn't need to know which
     * icons native has shipped assets for, and web never needs updating when native's
     * coverage grows or when a new icon is added to the picker.
     */
    icon: string;
    /**
     * Short one-line byline, already derived server-side from the explicit description
     * or (falling back) a snippet of `instructions` — the same text the web picker
     * shows under the name. Omitted when there's nothing to show; render nothing rather
     * than inventing a placeholder.
     */
    description?: string;
    /** Whether the user authored this themselves, or it's a Proton-published/shared one — surface e.g. a "Built-in" badge for non-personal entries, matching the web picker. */
    source: 'personal' | 'published' | 'shared';
}

/**
 * Large-screen sidebar geometry, so native can size its composer to the space the sidebar
 * leaves and animate in step with the web. Widths are CSS px, which equal Android dp because
 * the WebView runs at `width=device-width, initial-scale=1` (index.html).
 */
export interface SidebarLayout {
    /** Target width of the sidebar once the transition settles. 0 when collapsed. */
    width: number;
    /** How long the web takes to reach `width`. 0 = apply immediately, do not animate. */
    animationDurationMs: number;
}

export interface State {
    lumoMode: LumoMode;
    /** Legacy field for old native clients; derived from `responseMode`. */
    modelTier: LegacyModelTier;
    /** Selectable model for new clients (the web's `auto` collapses to lite). */
    model: Exclude<ModelTier, 'auto'>;
    /**
     * Whether the Max model can currently be selected. `false` when Max is
     * temporarily unavailable (e.g. high load) for the current user segment;
     * native greys out the row and shows a "High load" badge.
     */
    isMaxModelAvailable: boolean;
    responseMode: ResponseMode;
    isGhostModeEnabled: boolean;
    isWebSearchEnabled: boolean;
    isCreateImageEnabled: boolean;
    /**
     * All selectable aspect ratios (with width/height so native can render proportioned
     * icons), **in the order the picker must show them**. Ordered — see
     * `AVAILABLE_ASPECT_RATIOS`; native has no way to recover an order this array doesn't
     * carry. Each entry carries its own `key`.
     */
    availableAspectRatios: AspectRatioInfo[];
    /** Currently-selected aspect ratio, underscore form (e.g. `'16_9'`). */
    selectedAspectRatio: AspectRatioKey;
    isVisible: boolean;
    isSmallScreen: boolean;
    /**
     * Large-screen sidebar geometry, or `null` on small screens where the sidebar is a
     * full-height overlay native must ignore.
     *
     * `isSmallScreen` is authoritative: while it is `true`, ignore `sidebar` regardless of its
     * value. The two fields are pushed by separate effects, so when the breakpoint crosses, a
     * single intermediate push may show them disagreeing (e.g. `isSmallScreen: true` with a
     * non-null `sidebar`) before the next push corrects it.
     */
    sidebar: SidebarLayout | null;
    showTsAndCs: boolean;
    userFlags: UserFlags;
    attachedFiles: LumoFile[];
    featureFlags: FeatureFlags;
    editMode: EditMode;
    customLumos: CustomLumo[];
    /**
     * The full active Custom Lumo, or `null`. Sent as the full object (rather than
     * just its id) so native can render "what's currently selected" — e.g. a badge —
     * without needing the whole `customLumos` list in scope to look it up.
     */
    selectedCustomLumo: CustomLumo | null;
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
 * Injects an edit mode prefill text to the native side as a one-shot callback.
 * Sent separately from State to avoid re-applying on every state update.
 */
const injectEditModePrompt = (text: string) => {
    console.log('Native Composer Bridge: Injecting edit mode prompt to native');
    try {
        if ((window as any).webkit?.messageHandlers?.nativeComposerEditModeHandler) {
            (window as any).webkit.messageHandlers.nativeComposerEditModeHandler.postMessage(text);
        } else if ((window as any).Android?.injectEditModePrompt) {
            (window as any).Android.injectEditModePrompt(text);
        } else {
            console.log('Native Composer Bridge: Native bridge not detected for edit mode prompt');
        }
    } catch (error) {
        console.log('Native Composer Bridge: Error injecting edit mode prompt to native:', error);
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
        modelTier: 'thinking',
        model: getSelectedModelTier(DEFAULT_MODEL_TIER),
        isMaxModelAvailable: true,
        responseMode: DEFAULT_RESPONSE_MODE,
        isCreateImageEnabled: false,
        availableAspectRatios: AVAILABLE_ASPECT_RATIOS,
        selectedAspectRatio: DEFAULT_ASPECT_RATIO_KEY,
        attachedFiles: [],
        isWebSearchEnabled: false,
        isVisible: true,
        isSmallScreen: true,
        sidebar: null,
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
        editMode: { active: false },
        customLumos: [],
        selectedCustomLumo: null,
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

        if (!isEqual(oldState, newState)) {
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

    /**
     * Web → native: reflect the web's selected aspect ratio into the state so
     * native shows the correct checkmark.
     */
    public setSelectedAspectRatio(ratio: ImageAspectRatio): void {
        console.log(`NativeComposerApi: Setting selected aspect ratio to ${ratio}`);
        this.updateState({ selectedAspectRatio: imageRatioToAspectRatioKey(ratio) });
    }

    /**
     * Native → web: the native client picked an aspect ratio. Maps the
     * underscore key back to the web's `ImageAspectRatio` before dispatching, so
     * the web side never deals in underscore keys.
     */
    public async changeAspectRatio(key: AspectRatioKey): Promise<any> {
        console.log(`NativeComposerApi: Change aspect ratio to ${key}`);
        const event = new CustomEvent('lumo:changeAspectRatio', {
            detail: { source: 'nativeComposer', aspectRatio: aspectRatioKeyToImageRatio(key) },
        });
        window.dispatchEvent(event);

        // Return success (the actual state update is handled by the web app)
        return { success: true };
    }

    public setNativeModelTier(modelTier: ModelTier): void {
        console.log(`NativeComposerApi: Setting model type to ${modelTier}`);
        this.updateState({ model: getSelectedModelTier(modelTier) });
    }

    public setCustomLumos(list: CustomLumo[]): void {
        console.log(`NativeComposerApi: Setting custom lumos list (${list.length} items)`);
        this.updateState({ customLumos: list });
    }

    public setSelectedCustomLumo(lumo: CustomLumo | null): void {
        console.log(`NativeComposerApi: Setting selected custom lumo to`, lumo);
        this.updateState({ selectedCustomLumo: lumo });
    }

    public async selectCustomLumo(id: string): Promise<any> {
        console.log('NativeComposerApi: Select custom lumo', { id });
        const event = new CustomEvent('lumo:selectCustomLumo', {
            detail: { id },
        });
        window.dispatchEvent(event);

        // Return success (the actual API call will be handled by the web app)
        return { success: true };
    }

    public async clearCustomLumo(): Promise<any> {
        console.log('NativeComposerApi: Clear custom lumo');
        const event = new CustomEvent('lumo:clearCustomLumo', {
            detail: null,
        });
        window.dispatchEvent(event);

        // Return success (the actual API call will be handled by the web app)
        return { success: true };
    }

    public setMaxModelAvailable(available: boolean): void {
        console.log(`NativeComposerApi: Setting max model available to ${available}`);
        this.updateState({ isMaxModelAvailable: available });
    }

    public setNativeResponseMode(responseMode: ResponseMode): void {
        console.log(`NativeComposerApi: Setting response mode to ${responseMode}`);
        // Keep the legacy `modelTier` field in sync so already-released native
        // clients still reflect the fast/thinking choice.
        this.updateState({ responseMode, modelTier: responseMode === 'thinking' ? 'thinking' : 'fast' });
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

    public async changeResponseMode(responseMode: ResponseMode): Promise<any> {
        console.log(`NativeComposerApi: Change response mode`);
        const event = new CustomEvent('lumo:changeResponseMode', {
            detail: { source: 'nativeComposer', responseMode: responseMode },
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

    public setIsSmallScreen(isSmallScreen: boolean): void {
        console.log(`NativeComposerApi: Setting isSmallScreen to ${isSmallScreen}`);
        this.updateState({ isSmallScreen });
    }

    public setSidebarLayout(sidebar: SidebarLayout | null): void {
        console.log('NativeComposerApi: Setting sidebar layout', sidebar);
        this.updateState({ sidebar });
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

    public setEditMode(prefillText: string): void {
        console.log('NativeComposerApi: Setting edit mode with prefill text');
        injectEditModePrompt(prefillText);
        this.updateState({ editMode: { active: true } });
    }

    public clearEditMode(): void {
        console.log('NativeComposerApi: Clearing edit mode');
        this.updateState({ editMode: { active: false } });
        window.dispatchEvent(new CustomEvent('lumo:nativeEditCleared'));
    }

    public injectImageGenerationHelperPrompt(prompt: string): void {
        injectImageGenerationHelperPrompt(prompt);
    }

    public onComposerError(error: LUMO_API_ERRORS): void {
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
        changeAspectRatio: createNativeWrapper('changeAspectRatio'),
        changeModelTier: createNativeWrapper('changeModelTier'),
        changeResponseMode: createNativeWrapper('changeResponseMode'),

        // Custom Lumos. Note: setCustomLumos/setSelectedCustomLumo are deliberately NOT
        // exposed here (mirrors setNativeModelTier/setNativeResponseMode above) — they
        // must only ever be pushed by web, never written by native, or the write would
        // be silently clobbered by the next real state push.
        selectCustomLumo: createNativeWrapper('selectCustomLumo'),
        clearCustomLumo: createNativeWrapper('clearCustomLumo'),

        // Actions
        uploadFiles: createNativeWrapper('uploadFiles'),
        openProtonDrive: createNativeWrapper('openProtonDrive'),
        openSketch: createNativeWrapper('openSketch'),
        openAccount: createNativeWrapper('openAccount'),

        sendPrompt: createNativeWrapper('sendPrompt'),
        abortPrompt: createNativeWrapper('abortPrompt'),

        // Visibility
        toggleComposerVisibility: createNativeWrapper('toggleComposerVisibility'),
        setIsSmallScreen: createNativeWrapper('setIsSmallScreen'),
        toggleImageGenEnabled: createNativeWrapper('toggleImageGenEnabled'),
        toggleModelSelectionEnabled: createNativeWrapper('toggleModelSelectionEnabled'),
        setIsFreeUser: createNativeWrapper('setIsFreeUser'),
        setIsGuestUser: createNativeWrapper('setIsGuestUser'),
        previewFile: createNativeWrapper('previewFile'),

        // Tools
        setToolsEnabled: createNativeWrapper('setToolsEnabled'),

        // Edit mode
        clearEditMode: createNativeWrapper('clearEditMode'),

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
