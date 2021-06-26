import { ACTIONS, TYPE } from './constants';
import { CalendarViewEvent } from '../../../containers/calendar/interface';

export interface EventDownAction {
    action: ACTIONS.EVENT_DOWN;
    payload: {
        type: TYPE;
        idx: number;
        event: CalendarViewEvent;
    };
}

export interface CreateDownAction {
    action: ACTIONS.CREATE_DOWN;
    payload: {
        type: TYPE;
        idx: number | Date;
    };
}

export interface MoreDownAction {
    action: ACTIONS.MORE_DOWN;
    payload: {
        type: TYPE;
        date: Date;
        events: Set<string>;
        idx: number;
        row: number;
    };
}

export type MouseDownAction = MoreDownAction | EventDownAction | CreateDownAction;

export const isMoreDownAction = (action: MouseDownAction): action is MoreDownAction => {
    return action.action === ACTIONS.MORE_DOWN;
};
export const isEventDownAction = (action: MouseDownAction): action is EventDownAction => {
    return action.action === ACTIONS.EVENT_DOWN;
};
export const isCreateDownAction = (action: MouseDownAction): action is CreateDownAction => {
    return action.action === ACTIONS.CREATE_DOWN;
};

export interface MoreUpAction {
    action: ACTIONS.MORE_UP;
}
export interface EventUpAction {
    action: ACTIONS.EVENT_UP;
    payload: {
        type: TYPE;
        idx: number;
        event?: CalendarViewEvent;
    };
}
export interface StartEndResult {
    start: Date;
    end: Date;
}
export interface EventMoveAction {
    action: ACTIONS.EVENT_MOVE | ACTIONS.EVENT_MOVE_UP;
    payload: {
        type: TYPE;
        idx?: number;
        result: StartEndResult;
        day?: number;
    };
}
export interface CreateUpAction {
    action: ACTIONS.CREATE_UP | ACTIONS.CREATE_MOVE | ACTIONS.CREATE_MOVE_UP;
    payload: {
        type: TYPE;
        idx: number;
        result: StartEndResult;
    };
}

export type MouseUpAction = MoreUpAction | EventUpAction | EventMoveAction | CreateUpAction;

export type OnMouseDown = (action: MouseDownAction) => undefined | ((action: MouseUpAction) => void);
