import type { Element } from 'proton-mail/models/element';

export enum MOVE_BACK_ACTION_TYPES {
    MOVE = 'MOVE',
    APPLY_LABEL = 'APPLY_LABEL',
    STAR = 'STAR',
    PERMANENT_DELETE = 'PERMANENT_DELETE',
    MARK_AS = 'MARK_AS',
}

export interface MoveActionProps {
    type: MOVE_BACK_ACTION_TYPES.MOVE;
    destinationLabelID: string;
}

export interface ApplyLabelActionProps {
    type: MOVE_BACK_ACTION_TYPES.APPLY_LABEL;
    changes: { [labelID: string]: boolean };
}

export interface StarActionProps {
    type: MOVE_BACK_ACTION_TYPES.STAR;
    isUnstarringElement: boolean;
}

export interface PermanentDeleteActionProps {
    type: MOVE_BACK_ACTION_TYPES.PERMANENT_DELETE;
}

export interface MarkAsActionProps {
    type: MOVE_BACK_ACTION_TYPES.MARK_AS;
}

export type ActionProps = (
    | MoveActionProps
    | ApplyLabelActionProps
    | StarActionProps
    | PermanentDeleteActionProps
    | MarkAsActionProps
) & {
    elements: Element[];
};
