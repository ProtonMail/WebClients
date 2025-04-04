import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/index';
import Icon from '@proton/components/components/icon/Icon';
import Tooltip from '@proton/components/components/tooltip/Tooltip';

interface EditButtonProps {
    onEdit: () => void;
    disabled?: boolean;
}

export const EditNoteButton = ({ onEdit, disabled }: EditButtonProps) => {
    return (
        <Tooltip title={c('Edit note button tooltip').t`Edit note`}>
            <ButtonLike className="shrink-0" shape="ghost" onClick={onEdit} disabled={disabled} icon size="small">
                <Icon name="pen" alt={c('Edit note button tooltip').t`Edit note`} />
            </ButtonLike>
        </Tooltip>
    );
};

interface DeleteButtonProps {
    onDelete: () => void;
    loading: boolean;
    disabled?: boolean;
}
export const DeleteNoteButton = ({ loading, onDelete, disabled }: DeleteButtonProps) => {
    return (
        <Tooltip title={c('Remove note button tooltip').t`Remove note`}>
            <ButtonLike
                className="shrink-0"
                shape="ghost"
                onClick={onDelete}
                loading={loading}
                disabled={disabled}
                icon
                size="small"
            >
                <Icon name="cross" alt={c('Remove note button tooltip').t`Remove note`} />
            </ButtonLike>
        </Tooltip>
    );
};
