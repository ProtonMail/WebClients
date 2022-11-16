import { c } from 'ttag';

import { NotificationButton } from '@proton/components';

interface Props {
    onUndo: () => void;
    className?: string;
    disabled?: boolean;
}

const UndoNotificationButton = ({ onUndo, disabled, className }: Props) => (
    <NotificationButton onClick={onUndo} disabled={disabled} className={className}>
        {c('Action').t`Undo`}
    </NotificationButton>
);

export default UndoNotificationButton;
