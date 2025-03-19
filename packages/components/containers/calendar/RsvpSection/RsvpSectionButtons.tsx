import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/index';
import Icon from '@proton/components/components/icon/Icon';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import noop from '@proton/utils/noop';

interface EditButtonProps {
    onEdit: () => void;
}

export const EditNoteButton = ({ onEdit }: EditButtonProps) => {
    return (
        <Tooltip title={c('Edit note button tooltip').t`Edit Note`}>
            <ButtonLike className="shrink-0" shape="ghost" onClick={onEdit} icon size="small">
                <Icon name="pen" alt={c('Edit note button tooltip').t`Edit note`} />
            </ButtonLike>
        </Tooltip>
    );
};

interface DeleteButtonProps {
    onDelete: () => void;
    loading: boolean;
}
export const DeleteNoteButton = ({ loading, onDelete }: DeleteButtonProps) => {
    return (
        <Tooltip title={c('Remove note button tooltip').t`Remove note`}>
            <ButtonLike
                className="shrink-0"
                shape="ghost"
                onClick={loading ? noop : onDelete}
                loading={loading}
                icon
                size="small"
            >
                <Icon name="cross" alt={c('Remove note button tooltip').t`Remove note`} />
            </ButtonLike>
        </Tooltip>
    );
};
