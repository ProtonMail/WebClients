import type { ClipboardApi } from '@proton/pass/lib/clipboard/types';
import globalThis from '@proton/shared/lib/window';

export const clipboardApi: ClipboardApi = {
    read: async () => globalThis.navigator.clipboard.readText(),
    write: async (content: string) => globalThis.navigator.clipboard.writeText(content),
};
