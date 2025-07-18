import type { FC, PropsWithChildren } from 'react';
import { createContext, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
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
    const clipboardTTL = useSelector(selectClipboardTTL);

    const [cachedCopy, setCachedCopy] = useState<MaybeNull<string>>(null);
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

    const onCopyToClipboard = async (value: string) => {
        console.warn('onCopyToClipboard', { clipboardTTL });

        if (BUILD_TARGET !== 'web' && clipboardTTL === undefined) {
            setCachedCopy(value);
            setModal('settings');
            return;
        }

        await handleActualCopy(value);
    };

    const onSettingsChange = async (timeoutMs: number, silent = false) => {
        console.warn('onSettingsChange', { timeoutMs, silent });
        dispatch(settingsEditIntent('behaviors', { clipboard: { timeoutMs } }, silent));
    };

    const onClose = async () => {
        console.warn('onClose', { cachedCopy });

        setModal(null);

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
        </ClipboardContext.Provider>
    );
};
