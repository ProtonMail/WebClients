import type { FC, PropsWithChildren } from 'react';
import { createContext, useCallback, useMemo, useState } from 'react';
import { useDispatch, useStore } from 'react-redux';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { getClipboardTTLOptions } from '@proton/pass/components/Settings/Clipboard/ClipboardSettings';
import { ClipboardSettingsModal } from '@proton/pass/components/Settings/Clipboard/ClipboardSettingsModal';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { selectClipboardTTL } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { MaybeNull } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

export type ClipboardAction = 'settings';

export type ClipboardContextValue = {
    copyToClipboard: (content: string) => Promise<void>;
    setClipboardTTL: (timeoutMs: number, silent?: boolean) => void;
};

export const ClipboardContext = createContext<MaybeNull<ClipboardContextValue>>(null);

export const useClipboardContext = createUseContext(ClipboardContext);
export const useCopyToClipboard = () => useClipboardContext().copyToClipboard;
export const useSetClipboardTTL = () => useClipboardContext().setClipboardTTL;

export const ClipboardProvider: FC<PropsWithChildren> = ({ children }) => {
    const { writeToClipboard } = usePassCore();
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const store = useStore<State>();

    const [cachedCopy, setCachedCopy] = useState<MaybeNull<string>>(null);
    const [modal, setModal] = useState<MaybeNull<ClipboardAction>>(null);

    const onCopyToClipboard = useCallback(
        async (value: string, clipboardTTL?: number, promptForPermissions?: boolean) => {
            try {
                const options = getClipboardTTLOptions();
                const timeoutDurationHumanReadable = options.find(([ttl]) => ttl === clipboardTTL)?.[1];
                await writeToClipboard(value, clipboardTTL, promptForPermissions);

                createNotification({
                    showCloseButton: false,
                    type: 'success',
                    text:
                        !clipboardTTL || clipboardTTL === -1
                            ? c('Info').t`Copied to clipboard`
                            : // translator: `timeoutDurationHumanReadable` may be 15 seconds, 1 minute or 2 minutes
                              c('Info').t`Copied to clipboard (expires in ${timeoutDurationHumanReadable})`,
                });
            } catch (err) {
                createNotification({ type: 'error', text: c('Info').t`Unable to copy to clipboard` });
                logger.error(`[ClipboardProvider] unable to copy to clipboard`);
            }
        },
        []
    );

    const ctx = useMemo<ClipboardContextValue>(
        () => ({
            copyToClipboard: async (value) => {
                const ttl = selectClipboardTTL(store.getState());
                if (BUILD_TARGET !== 'web' && ttl === undefined) {
                    setCachedCopy(value);
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
                    onClose={async (overrideClipboardTTL) => {
                        setModal(null);

                        if (cachedCopy !== null) {
                            setCachedCopy(null);
                            await onCopyToClipboard(cachedCopy, overrideClipboardTTL, true);
                        }
                    }}
                />
            )}
        </ClipboardContext.Provider>
    );
};
