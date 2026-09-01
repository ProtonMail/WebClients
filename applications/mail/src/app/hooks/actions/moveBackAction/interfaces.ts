import type { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import type { Element } from '../../../models/element';

export enum MOVE_BACK_ACTION_TYPES {
    MOVE = 'MOVE',
    APPLY_LABEL = 'APPLY_LABEL',
    STAR = 'STAR',
    PERMANENT_DELETE = 'PERMANENT_DELETE',
    MARK_AS = 'MARK_AS',
}

interface MoveActionProps {
    type: MOVE_BACK_ACTION_TYPES.MOVE;
    destinationLabelID: string;
}

interface ApplyLabelActionProps {
    type: MOVE_BACK_ACTION_TYPES.APPLY_LABEL;
    changes: { [labelID: string]: boolean };
}

interface StarActionProps {
    type: MOVE_BACK_ACTION_TYPES.STAR;
    removeLabel: boolean;
}

interface PermanentDeleteActionProps {
    type: MOVE_BACK_ACTION_TYPES.PERMANENT_DELETE;
}

interface MarkAsActionProps {
    type: MOVE_BACK_ACTION_TYPES.MARK_AS;
    status: MARK_AS_STATUS;
}

export type ActionProps = (
    MoveActionProps | ApplyLabelActionProps | StarActionProps | PermanentDeleteActionProps | MarkAsActionProps
) & {
    elements: Element[];
};
