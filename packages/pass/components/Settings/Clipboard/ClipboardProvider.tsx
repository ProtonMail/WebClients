import type { FC, PropsWithChildren } from 'react';
import { createContext, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { ClipboardPermissionModal } from '@proton/pass/components/Settings/Clipboard/ClipboardSPermissionModal';
import { ClipboardSettingsModal } from '@proton/pass/components/Settings/Clipboard/ClipboardSettingsModal';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { selectClipboardTTL } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

export type ClipboardAction = 'settings' | 'permission';

export type ClipboardContextValue = {
    modal: MaybeNull<ClipboardAction>;
    setModal: (modal: MaybeNull<ClipboardAction>) => void;
    onCopyToClipboard: (content: string) => Promise<void>;
    onSettingsChange: (timeoutMs: number, silent?: boolean) => Promise<void>;
};

export const ClipboardContext = createContext<MaybeNull<ClipboardContextValue>>(null);
export const useClipboardContext = createUseContext(ClipboardContext);
export const useOnCopyToClipboard = () => useClipboardContext().onCopyToClipboard;
export const useOnClipboardSettingsChange = () => useClipboardContext().onSettingsChange;

export const ClipboardProvider: FC<PropsWithChildren> = ({ children }) => {
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const { writeToClipboard } = usePassCore();
    const clipboardTTL = useSelector(selectClipboardTTL);

    const [cachedCopy, setCachedCopy] = useState<MaybeNull<string>>(null);
    const [cachedSetting, setCachedSetting] = useState<MaybeNull<number>>(null);
    const [modal, setModal] = useState<MaybeNull<ClipboardAction>>(null);

    const handleActualCopy = async (value: string) => {
        console.warn('handleActualCopy', { value });
        try {
            await writeToClipboard(value);
            createNotification({ type: 'success', text: c('Info').t`Copied to clipboard`, showCloseButton: false });
        } catch (err) {
            createNotification({ type: 'error', text: c('Info').t`Unable to copy to clipboard` });
            logger.error(`[Popup] unable to copy to clipboard`, err);
        }
    };

    const handleActualSettings = async (timeoutMs: number, silent = false) => {
        console.warn('handleActualSettings', { timeoutMs, silent });
        dispatch(settingsEditIntent('behaviors', { clipboard: { timeoutMs } }, silent));
    };

    const onCopyToClipboard = async (value: string) => {
        console.warn('onCopyToClipboard', { clipboardTTL });

        if (clipboardTTL === undefined) {
            setCachedCopy(value);
            setModal('settings');
            return;
        }

        await handleActualCopy(value);
    };

    const onSettingsChange = async (timeoutMs: number, silent = false) => {
        console.warn('onSettingsChange', { BUILD_TARGET, timeoutMs });

        if (BUILD_TARGET === 'web' && timeoutMs !== -1) {
            try {
                const result = await navigator.permissions.query({ name: 'clipboard-read' });
                if (result.state === 'prompt') {
                    setCachedSetting(timeoutMs);
                    setModal('permission');
                    return;
                }
            } catch {
                // noop
            }
        }

        await handleActualSettings(timeoutMs, silent);
    };

    const onClose = async () => {
        console.warn('onClose', { cachedCopy, cachedSetting });

        setModal(null);

        if (cachedSetting !== null) {
            setCachedSetting(null);
            await handleActualSettings(cachedSetting, false);

            // Special flow where we set the settings on a hanging copy
            // In this case, we can go back to settings modal where we come from
            if (cachedCopy !== null) {
                setModal('settings');
                return;
            }
        }

        if (cachedCopy !== null) {
            setCachedCopy(null);
            await handleActualCopy(cachedCopy);
        }
    };

    const contextValue = useMemo(() => {
        return {
            modal,
            setModal,
            onCopyToClipboard,
            onSettingsChange,
        };
    }, [modal, clipboardTTL]);

    return (
        <ClipboardContext.Provider value={contextValue}>
            {children}
            {modal === 'settings' ? <ClipboardSettingsModal onClose={onClose} /> : null}
            {modal === 'permission' ? <ClipboardPermissionModal onClose={onClose} /> : null}
        </ClipboardContext.Provider>
    );
};
