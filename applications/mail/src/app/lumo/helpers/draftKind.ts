import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';

export enum DraftKind {
    NEW = 'new',
    REPLY = 'reply',
    REPLY_ALL = 'reply_all',
    FORWARD = 'forward',
}

export const MESSAGE_ACTION_FOR: Record<DraftKind, MESSAGE_ACTIONS> = {
    [DraftKind.NEW]: MESSAGE_ACTIONS.NEW,
    [DraftKind.REPLY]: MESSAGE_ACTIONS.REPLY,
    [DraftKind.REPLY_ALL]: MESSAGE_ACTIONS.REPLY_ALL,
    [DraftKind.FORWARD]: MESSAGE_ACTIONS.FORWARD,
};

export const DRAFT_KIND_FOR: Record<MESSAGE_ACTIONS, DraftKind> = {
    [MESSAGE_ACTIONS.NEW]: DraftKind.NEW,
    [MESSAGE_ACTIONS.REPLY]: DraftKind.REPLY,
    [MESSAGE_ACTIONS.REPLY_ALL]: DraftKind.REPLY,
    [MESSAGE_ACTIONS.FORWARD]: DraftKind.FORWARD,
};
