import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import type { CacheType } from '@proton/redux-utilities/interface';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';

/**
 * Mail settings hooks the editor needs from the application hosting it.
 * The value must be a stable object (a module constant), because its hooks are called on every render.
 */
export interface EditorHost {
    useMailSettings: () => [MailSettings, boolean];
    useGetMailSettings: () => (options?: { cache?: CacheType }) => Promise<MailSettings>;
}

const EditorHostContext = createContext<EditorHost | undefined>(undefined);

export const EditorHostProvider = ({ host, children }: { host: EditorHost; children: ReactNode }) => (
    <EditorHostContext.Provider value={host}>{children}</EditorHostContext.Provider>
);

export const useEditorHost = () => {
    const host = useContext(EditorHostContext);
    if (!host) {
        throw new Error('useEditorHost must be used inside an EditorHostProvider');
    }
    return host;
};
