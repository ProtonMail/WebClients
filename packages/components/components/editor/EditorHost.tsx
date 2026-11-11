import { createContext, useContext } from 'react';

import { useGetMailSettings, useMailSettings } from '@proton/mail/store/mailSettings/hooks';
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

const EditorHostContext = createContext<EditorHost>({ useMailSettings, useGetMailSettings });

export const useEditorHost = () => useContext(EditorHostContext);
