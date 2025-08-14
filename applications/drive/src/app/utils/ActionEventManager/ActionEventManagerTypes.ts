import type { NodeEntity } from '@proton/drive/index';

/**
 * EventManager Events
 *
 * Naming:
 * - Events should all emit an array of items, that's why all event names are plural
 * - in the emitted type:
 *      - `nodes` should only be used for NodeEntity
 *      - `uids` for string array of uids
 *      - `items` for all else
 */

export enum ActionEventName {
    // Specific events that update only a part of the view, used for optimistic updates
    TRASH_NODES_OPTIMISTIC = 'TRASH_NODES_OPTIMISTIC',
    RENAME_NODES_OPTIMISTIC = 'RENAME_NODES_OPTIMISTIC',

    // Generic events that update the whole node
    UPDATED_NODES = 'UPDATED_NODES_EVENT',
    DELETED_NODES = 'DELETED_NODES_EVENT',
    CREATED_NODES = 'CREATED_NODES_EVENT',

    // Bookmark-specific events
    DELETE_BOOKMARKS = 'DELETE_BOOKMARKS',

    // Invitation-specific events
    ACCEPT_INVITATIONS = 'ACCEPT_INVITATIONS',
    REJECT_INVITATIONS = 'REJECT_INVITATIONS',

    // Only available to listen to with .subscribe()
    ALL = '*',
}

export interface TrashedNodesEvent {
    type: ActionEventName.TRASH_NODES_OPTIMISTIC;
    uids: string[];
}
export interface RenamedNodesEvent {
    type: ActionEventName.RENAME_NODES_OPTIMISTIC;
    items: { newName: string; uid: string }[];
}

export interface UpdatedNodesEvent {
    type: ActionEventName.UPDATED_NODES;
    nodes: NodeEntity[];
}

export interface CreatedNodesEvent {
    type: ActionEventName.CREATED_NODES;
    nodes: NodeEntity[];
}

export interface DeletedNodesEvent {
    type: ActionEventName.DELETED_NODES;
    uids: string[];
}

export interface DeleteBookmarksEvent {
    type: ActionEventName.DELETE_BOOKMARKS;
    uids: string[];
}

export interface AcceptInvitationsEvent {
    type: ActionEventName.ACCEPT_INVITATIONS;
    items: {
        node: NodeEntity;
        sharedInfo: { sharedOn: number; sharedBy: string };
    }[];
}

export interface RejectInvitationsEvent {
    type: ActionEventName.REJECT_INVITATIONS;
    uids: string[];
}

export type ActionEvent =
    | TrashedNodesEvent
    | RenamedNodesEvent
    | UpdatedNodesEvent
    | CreatedNodesEvent
    | DeletedNodesEvent
    | DeleteBookmarksEvent
    | AcceptInvitationsEvent
    | RejectInvitationsEvent;

export type ActionEventListener<T extends ActionEvent> = (event: T) => void;

export type ActionEventMap = {
    [ActionEventName.TRASH_NODES_OPTIMISTIC]: TrashedNodesEvent;
    [ActionEventName.RENAME_NODES_OPTIMISTIC]: RenamedNodesEvent;
    [ActionEventName.UPDATED_NODES]: UpdatedNodesEvent;
    [ActionEventName.CREATED_NODES]: CreatedNodesEvent;
    [ActionEventName.DELETED_NODES]: DeletedNodesEvent;
    [ActionEventName.DELETE_BOOKMARKS]: DeleteBookmarksEvent;
    [ActionEventName.ACCEPT_INVITATIONS]: AcceptInvitationsEvent;
    [ActionEventName.REJECT_INVITATIONS]: RejectInvitationsEvent;
    [ActionEventName.ALL]: ActionEvent;
};
