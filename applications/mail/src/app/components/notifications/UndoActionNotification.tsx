import type { ReactNode } from 'react';
import { useState } from 'react';

import type { CustomNotificationProps } from '@proton/components';

import UndoNotificationButton from './UndoNotificationButton';

interface Props extends CustomNotificationProps {
    children: ReactNode;
    onUndo?: () => void;
    closeOnUndo?: boolean;
}

const UndoActionNotification = ({ children, onUndo, onClose, closeOnUndo = true }: Props) => {
    const [loading, setLoading] = useState(false);

    const handleUndo = async () => {
        if (!onUndo) {
            return;
        }

        setLoading(true);

        if (closeOnUndo) {
            onClose?.();
        }

        try {
            await onUndo();
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <span>{children}</span>
            {onUndo ? <UndoNotificationButton onUndo={handleUndo} loading={loading} /> : null}
        </>
    );
};

export default UndoActionNotification;
