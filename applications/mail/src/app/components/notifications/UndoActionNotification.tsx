import { ReactNode } from 'react';

import { CustomNotificationProps } from '@proton/components';

import UndoNotificationButton from './UndoNotificationButton';

interface Props extends CustomNotificationProps {
    children: ReactNode;
    additionalButton?: ReactNode;
    onUndo?: () => void;
}

const UndoActionNotification = ({ children, additionalButton = null, onUndo, onClose }: Props) => (
    <>
        <span>{children}</span>
        {additionalButton ? additionalButton : null}
        {onUndo ? (
            <UndoNotificationButton
                onUndo={() => {
                    onClose?.();
                    onUndo();
                }}
            />
        ) : null}
    </>
);

export default UndoActionNotification;
