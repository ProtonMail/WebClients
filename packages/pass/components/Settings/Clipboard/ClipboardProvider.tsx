import type { FC, PropsWithChildren } from 'react';
import { createContext, useCallback, useMemo, useState } from 'react';
import { useDispatch, useStore } from 'react-redux';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { getClipboardTTLOptions } from '@proton/pass/components/Settings/Clipboard/ClipboardSettings';
import { ClipboardSettingsModal } from '@proton/pass/components/Settings/Clipboard/ClipboardSettingsModal';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { ClipboardTTL } from '@proton/pass/lib/clipboard/types';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { selectClipboardTTL } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { MaybeNull } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

export type ClipboardAction = 'settings';

export type ClipboardContextValue = {
    copyToClipboard: (content: string) => Promise<void>;
    setClipboardTTL: (timeoutMs: ClipboardTTL, silent?: boolean) => void;
};

export const ClipboardContext = createContext<MaybeNull<ClipboardContextValue>>(null);

export const useClipboardContext = createUseContext(ClipboardContext);
export const useCopyToClipboard = () => useClipboardContext().copyToClipboard;
export const useSetClipboardTTL = () => useClipboardContext().setClipboardTTL;

type Props = {
    checkPermissions?: () => Promise<boolean>;
};

export const ClipboardProvider: FC<PropsWithChildren<Props>> = ({ children, checkPermissions = async () => true }) => {
    const { writeToClipboard } = usePassCore();
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const store = useStore<State>();

    const [cachedCopy, setCachedCopy] = useState<MaybeNull<string>>(null);
    const [modal, setModal] = useState<MaybeNull<ClipboardAction>>(null);
    const [hasPermissions, setHasPermissions] = useState<boolean>(false);

    const onCopyToClipboard = useCallback(
        async (value: string, ttl?: ClipboardTTL, promptForPermissions = false): Promise<boolean> => {
            try {
                const options = getClipboardTTLOptions();
                const permissionsGranted = await writeToClipboard(value, ttl, promptForPermissions);
                const blocked = promptForPermissions && !permissionsGranted;

                createNotification({
                    showCloseButton: false,
                    type: 'success',
                    text: (() => {
                        if (blocked || !ttl || ttl === ClipboardTTL.TTL_NEVER) return c('Info').t`Copied to clipboard`;
                        const timeoutDurationHumanReadable = options.get(ttl);
                        // translator: `timeoutDurationHumanReadable` may be 15 seconds, 1 minute or 2 minutes
                        return c('Info').t`Copied to clipboard (expires in ${timeoutDurationHumanReadable})`;
                    })(),
                });

                return permissionsGranted;
            } catch (err) {
                createNotification({ type: 'error', text: c('Info').t`Unable to copy to clipboard` });
                logger.error(`[ClipboardProvider] unable to copy to clipboard`);
                return false;
            }
        },
        []
    );

    const ctx = useMemo<ClipboardContextValue>(
        () => ({
            copyToClipboard: async (value) => {
                const hasPermissions = await checkPermissions();
                const ttl = selectClipboardTTL(store.getState());
                const askBecauseSettingsUnset = ttl === undefined;
                const askBecausePermissionProblem = (ttl?.valueOf() ?? -1) > 0 && !hasPermissions;
                if (BUILD_TARGET !== 'web' && (askBecauseSettingsUnset || askBecausePermissionProblem)) {
                    setCachedCopy(value);
                    setHasPermissions(hasPermissions);
                    setModal('settings');
                } else await onCopyToClipboard(value, ttl);
            },
            setClipboardTTL: (timeoutMs, silent = false) => {
                dispatch(settingsEditIntent('behaviors', { clipboard: { timeoutMs } }, silent));
            },
        }),
        []
    );

    return (
        <ClipboardContext.Provider value={ctx}>
            {children}
            {modal === 'settings' && (
                <ClipboardSettingsModal
                    onSubmit={async (ttl) => {
                        setModal(null);
                        if (cachedCopy !== null) {
                            setCachedCopy(null);

                            if (ttl !== undefined) {
                                const promptForPermission = !hasPermissions && ttl > 0;
                                const copied = await onCopyToClipboard(cachedCopy, ttl, promptForPermission);
                                /** NOTE: when prompting for permission in the context of the extension
                                 * popup this function might not finish as the permission prompt will
                                 * close the popup. See the clipboard service implementation watching the
                                 * permission change event to set to the default */
                                if (copied) ctx.setClipboardTTL(ttl, true);
                            } else await onCopyToClipboard(cachedCopy);
                        }
                    }}
                />
            )}
        </ClipboardContext.Provider>
    );
};
