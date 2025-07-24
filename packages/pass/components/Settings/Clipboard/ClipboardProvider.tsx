import type { FC, PropsWithChildren } from 'react';
import { createContext, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { getClipboardTTLOptions } from '@proton/pass/components/Settings/Clipboard/ClipboardSettings';
import { ClipboardSettingsModal } from '@proton/pass/components/Settings/Clipboard/ClipboardSettingsModal';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { selectClipboardTTL } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

export type ClipboardAction = 'settings';

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
    const settingsClipboardTTL = useSelector(selectClipboardTTL);

    const [cachedCopy, setCachedCopy] = useState<MaybeNull<string>>(null);
    const [modal, setModal] = useState<MaybeNull<ClipboardAction>>(null);

    const handleActualCopy = async (value: string, overrideClipboardTTL?: number) => {
        try {
            const clipboardTTL = overrideClipboardTTL ?? settingsClipboardTTL;

            console.warn('[DEBUG] handleActualCopy', { value, clipboardTTL });

            await writeToClipboard(value, clipboardTTL);

            const timeoutDurationHumanReadable = getClipboardTTLOptions().find(
                ([value]) => value === clipboardTTL
            )?.[1];

            const text =
                clipboardTTL === undefined
                    ? c('Info').t`Copied to clipboard`
                    : // translator: `timeoutDurationHumanReadable` may be 15 seconds, 1 minute or 2 minutes
                      c('Info').t`Copied to clipboard, automatically deleted after ${timeoutDurationHumanReadable}`;

            createNotification({ type: 'success', text, showCloseButton: false });
        } catch (err) {
            createNotification({ type: 'error', text: c('Info').t`Unable to copy to clipboard` });
            logger.error(`[Popup] unable to copy to clipboard`, err);
        }
    };

    const onCopyToClipboard = async (value: string) => {
        console.warn('[DEBUG] onCopyToClipboard', { settingsClipboardTTL });

        if (BUILD_TARGET !== 'web' && settingsClipboardTTL === undefined) {
            setCachedCopy(value);
            setModal('settings');
            return;
        }

        await handleActualCopy(value);
    };

    const onSettingsChange = async (timeoutMs: number, silent = false) => {
        console.warn('[DEBUG] onSettingsChange', { timeoutMs, silent });

        dispatch(settingsEditIntent('behaviors', { clipboard: { timeoutMs } }, silent));
    };

    const onClose = async (overrideClipboardTTL: number) => {
        setModal(null);

        if (cachedCopy !== null) {
            setCachedCopy(null);
            await handleActualCopy(cachedCopy, overrideClipboardTTL);
        }
    };

    const contextValue = useMemo(() => {
        return {
            modal,
            setModal,
            onCopyToClipboard,
            onSettingsChange,
        };
    }, [modal, settingsClipboardTTL]);

    return (
        <ClipboardContext.Provider value={contextValue}>
            {children}
            {modal === 'settings' ? <ClipboardSettingsModal onClose={onClose} /> : null}
        </ClipboardContext.Provider>
    );
};
