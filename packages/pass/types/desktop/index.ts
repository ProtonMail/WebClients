import type {
    Maybe,
    MaybeNull,
    NativeMessagePayload,
    NativeMessageRequest,
    NativeMessageResponse,
} from '@proton/pass/types';
import type { ContextMenuItemSerializable } from '@proton/pass/types/desktop/context-menu';
import type { UpdateStore } from '@proton/pass/types/desktop/update';

import type { AutotypeProperties } from './autotype';

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

    canCheckPresence: () => Promise<boolean>;
    checkPresence: (reason?: string) => Promise<void>;

    getSecret: (key: string, version: number) => Promise<MaybeNull<string>>;
    setSecret: (key: string, data: Uint8Array<ArrayBuffer>) => Promise<void>;
    deleteSecret: (key: string) => Promise<void>;

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
};

export type DesktopTheme = 'dark' | 'light' | 'system';
