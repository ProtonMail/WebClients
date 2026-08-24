import type {
    AppState,
    Maybe,
    MaybeNull,
    NativeMessagePayload,
    NativeMessageRequest,
    NativeMessageResponse,
    SSHKeyItem,
} from '..';
import type { AutotypeProperties } from './autotype';
import type { ContextMenuItemSerializable } from './context-menu';
import type { UpdateStore } from './update';

export * from './autotype';
export * from './extension-unlock-with-desktop';
export * from './update';

export type ContextBridgeApi = {
    windowShow: () => Promise<void>;
    onWindowHide: (callback: () => void) => void;

    onSystemWake: (callback: () => void) => () => void;

    writeToClipboard: (text: string) => Promise<void>;
    readFromClipboard: () => Promise<string>;

    navigate: (href: string) => Promise<void>;
    setAppState: (state: AppState) => void;

    canCheckPresence: () => Promise<boolean>;
    checkPresence: (reason?: string) => Promise<void>;

    getSecret: (key: string, version: number) => Promise<MaybeNull<string>>;
    setSecret: (key: string, data: Uint8Array<ArrayBuffer>) => Promise<void>;
    deleteSecret: (key: string) => Promise<void>;

    flushStorageData: () => Promise<void>;

    getInstallInfo: () => Promise<MaybeNull<string>>;
    setInstallSourceReported: () => Promise<void>;

    getTheme: () => Promise<Maybe<DesktopTheme>>;
    setTheme: (theme: DesktopTheme) => Promise<void>;

    autotype: ({ fields, enterAtTheEnd }: AutotypeProperties) => Promise<void>;

    openContextMenu: (items: ContextMenuItemSerializable[]) => Promise<number>;

    getUpdateStore: () => Promise<UpdateStore>;
    setUpdateStore: (update: Partial<UpdateStore>) => Promise<void>;
    checkForUpdates: () => Promise<boolean>;
    restartToUpdate: () => Promise<void>;
    onUpdateStoreChange: (callback: (store: UpdateStore) => void) => () => void;

    onNmRequest: (callback: (request: NativeMessagePayload<NativeMessageRequest>) => void) => void;
    nmResponse: (response: NativeMessagePayload<NativeMessageResponse>) => Promise<void>;

    sshAgent: {
        clear: () => Promise<void>;
        destroy: () => Promise<void>;
        getEnabled: () => Promise<boolean>;
        getStatus: () => Promise<{ socketPath?: string }>;
        setEnabled: (enabled: boolean) => Promise<void>;
        setKeys: (items: SSHKeyItem[]) => Promise<void>;
        start: () => Promise<void>;
    };
};

export type DesktopTheme = 'dark' | 'light' | 'system';
