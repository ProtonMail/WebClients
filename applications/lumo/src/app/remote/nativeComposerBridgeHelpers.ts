import type { ModelTier } from '../providers/ModelTierProvider';
import type { LumoFile, LumoMode, State } from './nativeComposerBridge';

export const onComposerError = (error: string): void => {
    if (!isNativeComposerBridgeAvailable()) {
        console.warn('Native Composer Bridge not available');
        return;
    }
    (window as any).nativeComposerApiInstance.onComposerError(error);
};

export const isNativeComposerBridgeAvailable = (): boolean => {
    return !!(window as any).nativeComposerApiInstance && !!(window as any).nativeComposerApi;
};

export const setNativeGhostMode = (enabled: boolean): void => {
    if (!isNativeComposerBridgeAvailable()) {
        console.warn('Native Composer Bridge not available');
        return;
    }
    (window as any).nativeComposerApiInstance.setGhostMode(enabled);
};

export const setNativeLumoState = (state: LumoMode): void => {
    if (!isNativeComposerBridgeAvailable()) {
        console.warn('Native Composer Bridge not available');
        return;
    }
    (window as any).nativeComposerApiInstance.setLumoState(state);
};

export const addNativeComposerFiles = (files: LumoFile[]): void => {
    if (!isNativeComposerBridgeAvailable()) {
        console.warn('Native Composer Bridge not available');
        return;
    }
    (window as any).nativeComposerApiInstance.addFiles(files);
};

export const removeNativeComposerFile = (id: string): void => {
    if (!isNativeComposerBridgeAvailable()) {
        console.warn('Native Composer Bridge not available');
        return;
    }
    (window as any).nativeComposerApiInstance.removeFile(id);
};

export const clearNativeComposerFiles = (): void => {
    if (!isNativeComposerBridgeAvailable()) {
        console.warn('Native Composer Bridge not available');
        return;
    }
    (window as any).nativeComposerApiInstance.clearFiles();
};

export const setNativeWebSearch = (enabled: boolean): void => {
    if (!isNativeComposerBridgeAvailable()) {
        console.warn('Native Composer Bridge not available');
        return;
    }
    (window as any).nativeComposerApiInstance.setWebSearch(enabled);
};

export const setNativeCreateImage = (enabled: boolean): void => {
    if (!isNativeComposerBridgeAvailable()) {
        console.warn('Native Composer Bridge not available');
        return;
    }
    (window as any).nativeComposerApiInstance.setCreateImage(enabled);
};

export const setNativeModelTier = (modelTier: ModelTier): void => {
    if (!isNativeComposerBridgeAvailable()) {
        console.warn('Native Composer Bridge not available');
        return;
    }
    (window as any).nativeComposerApiInstance.setNativeModelTier(modelTier);
};

export const onNativeHandleFileUploadRequest = (handler: FileUploadEventHandler): (() => void) => {
    window.addEventListener('lumo:uploadFiles', handler as EventListener);
    return () => window.removeEventListener('lumo:uploadFiles', handler as EventListener);
};

export const onNativeOpenDriveRequest = (handler: FileUploadEventHandler): (() => void) => {
    window.addEventListener('lumo:openDrive', handler as EventListener);
    return () => window.removeEventListener('lumo:openDrive', handler as EventListener);
};

export const onNativeOpenSketch = (handler: FileUploadEventHandler): (() => void) => {
    window.addEventListener('lumo:openSketch', handler as EventListener);
    return () => window.removeEventListener('lumo:openSketch', handler as EventListener);
};

export const onNativeOpenAccount = (handler: FileUploadEventHandler): (() => void) => {
    window.addEventListener('lumo:openAccount', handler as EventListener);
    return () => window.removeEventListener('lumo:openAccount', handler as EventListener);
};

export const onNativeSendPrompt = (handler: SendPromptEventHandler): (() => void) => {
    window.addEventListener('lumo:sendPrompt', handler as EventListener);
    return () => window.removeEventListener('lumo:sendPrompt', handler as EventListener);
};

export const onNativeAbortPrompt = (handler: AbortPromptEventHandler): (() => void) => {
    window.addEventListener('lumo:abortPrompt', handler as EventListener);
    return () => window.removeEventListener('lumo:abortPrompt', handler as EventListener);
};

export const onNativeToggleWebSearch = (handler: SimpleToggleEventHandler): (() => void) => {
    window.addEventListener('lumo:toggleWebSearch', handler as EventListener);
    return () => window.removeEventListener('lumo:toggleWebSearch', handler as EventListener);
};

export const onNativeRemoveFile = (handler: RemoveFileEventHandler): (() => void) => {
    window.addEventListener('lumo:removeFile', handler as EventListener);
    return () => window.removeEventListener('lumo:removeFile', handler as EventListener);
};

export const onNativePreviewFile = (handler: PreviewFileEventHandler): (() => void) => {
    window.addEventListener('lumo:previewFile', handler as EventListener);
    return () => window.removeEventListener('lumo:previewFile', handler as EventListener);
};

export const onNativeToggleCreateImage = (handler: SimpleToggleEventHandler): (() => void) => {
    window.addEventListener('lumo:toggleCreateImage', handler as EventListener);
    return () => window.addEventListener('lumo:toggleCreateImage', handler as EventListener);
};

export const onNativeChangeModelTier = (handler: ChangeModelTypeEventHandler): (() => void) => {
    window.addEventListener('lumo:changeModelTier', handler as EventListener);
    return () => window.addEventListener('lumo:changeModelTier', handler as EventListener);
};

export const setNativeComposerVisibility = (visible: boolean): void => {
    if (!isNativeComposerBridgeAvailable()) {
        console.warn('Native Composer Bridge not available');
        return;
    }
    (window as any).nativeComposerApiInstance.toggleComposerVisibility(visible);
};

export const setNativeComposerIsImageGenEnabled = (enabled: boolean): void => {
    if (!isNativeComposerBridgeAvailable()) {
        console.warn('Native Composer Bridge not available');
        return;
    }
    (window as any).nativeComposerApiInstance.toggleImageGenEnabled(enabled);
};

export const setNativeIsModelSectionEnabled = (enabled: boolean): void => {
    if (!isNativeComposerBridgeAvailable()) {
        console.warn('Native Composer Bridge not available');
        return;
    }
    (window as any).nativeComposerApiInstance.toggleModelSelectionEnabled(enabled);
};

export const setNativeIsFreeUser = (isFreeUser: boolean): void => {
    if (!isNativeComposerBridgeAvailable()) {
        console.warn('Native Composer Bridge not available');
        return;
    }
    (window as any).nativeComposerApiInstance.setIsFreeUser(isFreeUser);
};

export const setNativeIsGuestUser = (isGuestUser: boolean): void => {
    if (!isNativeComposerBridgeAvailable()) {
        console.warn('Native Composer Bridge not available');
        return;
    }
    (window as any).nativeComposerApiInstance.setIsGuestUser(isGuestUser);
};

export const setNativeTsAndCsVisibility = (visible: boolean): void => {
    if (!isNativeComposerBridgeAvailable()) {
        console.warn('Native Composer Bridge not available');
        return;
    }
    (window as any).nativeComposerApiInstance.setTsAndCsVisibility(visible);
};

export type { LumoFile, LumoMode, State };
export { LumoFileType, getLumoFileType } from './nativeComposerBridge';

export type FileUploadEventHandler = (
    event: CustomEvent<{ source: string; files: { base64: string; name: string }[] }>
) => void;
export type SendPromptEventHandler = (event: CustomEvent<{ text: string; webSearchEnabled: boolean }>) => void;
export type AbortPromptEventHandler = (event: CustomEvent<{ source: string }>) => void;
export type SimpleToggleEventHandler = (event: CustomEvent<{ source: null }>) => void;
export type RemoveFileEventHandler = (event: CustomEvent<{ attachmentId: string }>) => void;
export type PreviewFileEventHandler = (event: CustomEvent<{ attachmentId: string }>) => void;
export type ChangeModelTypeEventHandler = (event: CustomEvent<{ modelTier: ModelTier }>) => void;
