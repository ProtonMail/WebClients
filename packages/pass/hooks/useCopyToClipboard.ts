import { useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { selectClipboardTTL } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

export const useCopyToClipboard = () => {
    const { createNotification } = useNotifications();
    const { writeToClipboard } = usePassCore();
    const clipboardTTL = useSelector(selectClipboardTTL);

    const [cachedValue, setCachedValue] = useState<MaybeNull<string>>(null);
    const [showModal, setShowModal] = useState(false);

    const handleActualCopy = async (value: string) => {
        try {
            await writeToClipboard(value);
            createNotification({ type: 'success', text: c('Info').t`Copied to clipboard`, showCloseButton: false });
        } catch {
            createNotification({ type: 'error', text: c('Info').t`Unable to copy to clipboard` });
            logger.error(`[Popup] unable to copy to clipboard`);
        }
    };

    const handleCopyToClipboard = async (value: string) => {
        if (clipboardTTL === undefined) {
            setCachedValue(value);
            setShowModal(true);
            return;
        }

        await handleActualCopy(value);
    };

    const handleCloseModal = async () => {
        setShowModal(false);

        if (cachedValue !== null) {
            await handleActualCopy(cachedValue);
            setCachedValue(null);
        }
    };

    return {
        showModal,
        onCopyToClipboard: handleCopyToClipboard,
        onCloseModal: handleCloseModal,
    };
};
