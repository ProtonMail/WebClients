import { c } from 'ttag';

import { NotificationButton } from '@proton/components';

interface Props {
    onMoveAll: () => void;
    isMessage: boolean;
    isLabel: boolean;
    className?: string;
    disabled?: boolean;
}

const getText = (isMessage: boolean, isLabel: boolean) => {
    if (isMessage) {
        if (isLabel) {
            return c('Action').t`Move all messages from this label`;
        } else {
            return c('Action').t`Move all messages from this folder`;
        }
    } else {
        if (isLabel) {
            return c('Action').t`Move all conversations from this label`;
        } else {
            return c('Action').t`Move all conversations from this folder`;
        }
    }
};

const MoveAllNotificationButton = ({ onMoveAll, isMessage, isLabel, disabled, className }: Props) => (
    <NotificationButton onClick={onMoveAll} disabled={disabled} className={className}>
        {getText(isMessage, isLabel)}
    </NotificationButton>
);

export default MoveAllNotificationButton;
