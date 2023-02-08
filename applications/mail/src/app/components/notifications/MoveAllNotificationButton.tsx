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

const MoveAllNotificationButton = ({ onMoveAll, isMessage, isLabel, disabled }: Props) => (
    <NotificationButton
        onClick={onMoveAll}
        disabled={disabled}
        className="ml-custom"
        style={{ '--margin-left-custom': '-0.8em' }}
    >
        {getText(isMessage, isLabel)}
    </NotificationButton>
);

export default MoveAllNotificationButton;
