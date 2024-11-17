import type { Maybe, MaybeNull } from '@proton/pass/types/utils';

export type ContextBridgeApi = {
    writeToClipboard: (text: string) => Promise<void>;
    navigate: (href: string) => Promise<void>;
    canCheckPresence: () => Promise<boolean>;
    checkPresence: (reason?: string) => Promise<boolean>;
    getDecryptionKey: (challenge: string) => Promise<MaybeNull<Buffer>>;
    getSecret: (key: string, version: number) => Promise<MaybeNull<string>>;
    setSecret: (key: string, data: Uint8Array) => Promise<void>;
    deleteSecret: (key: string) => Promise<void>;
    getInstallInfo: () => Promise<{ installSource: MaybeNull<string> }>;
    setInstallSourceReported: () => Promise<void>;
    setClipboardConfig: (config: ClipboardStoreProperties) => Promise<void>;
    getClipboardConfig: () => Promise<Maybe<ClipboardStoreProperties>>;
    getTheme: () => Promise<Maybe<DesktopTheme>>;
    setTheme: (theme: DesktopTheme) => Promise<void>;
};

export type DesktopTheme = 'dark' | 'light' | 'system';

export type ClipboardStoreProperties = {
    timeoutMs: number;
};
