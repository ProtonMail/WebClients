import { c } from 'ttag';

import { NotificationButton } from '@proton/components';

interface Props {
    onUndo: () => void;
    className?: string;
    disabled?: boolean;
    loading?: boolean;
}

const UndoNotificationButton = ({ onUndo, disabled, className, loading = false }: Props) => (
    <NotificationButton onClick={onUndo} disabled={disabled} className={className} loading={loading}>
        {c('Action').t`Undo`}
    </NotificationButton>
);

export default UndoNotificationButton;
