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
import type { NodeEntity } from '@proton/drive';

export type NodeEventMeta = { uid: string; parentUid: string | undefined; isTrashed?: boolean; isShared?: boolean };

export enum ActionEventName {
    // Specific events that update only a part of the view, can be optimistic or not
    MOVED_NODES = 'MOVED_NODES',
    TRASHED_NODES = 'TRASHED_NODES',
    RESTORED_NODES = 'RESTORED_NODES',
    RENAMED_NODES = 'RENAMED_NODES',
    SHARE_CHANGED_NODES = 'SHARE_CHANGED_NODES',

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

export interface MovedNodesEvent {
    type: ActionEventName.MOVED_NODES;
    items: { uid: string; parentUid: string | undefined }[];
}

export interface ShareChangedEvent {
    type: ActionEventName.SHARE_CHANGED_NODES;
    items: { uid: string; isShared: boolean }[];
}

export interface TrashedNodesEvent {
    type: ActionEventName.TRASHED_NODES;
    uids: string[];
}
export interface RestoredNodesEvent {
    type: ActionEventName.RESTORED_NODES;
    uids: string[];
}

export interface RenamedNodesEvent {
    type: ActionEventName.RENAMED_NODES;
    items: { newName: string; uid: string }[];
}

export interface UpdatedNodesEvent {
    type: ActionEventName.UPDATED_NODES;
    items: NodeEventMeta[];
}

export interface CreatedNodesEvent {
    type: ActionEventName.CREATED_NODES;
    items: NodeEventMeta[];
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
    | MovedNodesEvent
    | ShareChangedEvent
    | TrashedNodesEvent
    | RestoredNodesEvent
    | RenamedNodesEvent
    | UpdatedNodesEvent
    | CreatedNodesEvent
    | DeletedNodesEvent
    | DeleteBookmarksEvent
    | AcceptInvitationsEvent
    | RejectInvitationsEvent;

export type ActionEventListener<T extends ActionEvent> = (event: T) => void;

export type ActionEventMap = {
    [ActionEventName.MOVED_NODES]: MovedNodesEvent;
    [ActionEventName.SHARE_CHANGED_NODES]: ShareChangedEvent;
    [ActionEventName.TRASHED_NODES]: TrashedNodesEvent;
    [ActionEventName.RESTORED_NODES]: RestoredNodesEvent;
    [ActionEventName.RENAMED_NODES]: RenamedNodesEvent;
    [ActionEventName.UPDATED_NODES]: UpdatedNodesEvent;
    [ActionEventName.CREATED_NODES]: CreatedNodesEvent;
    [ActionEventName.DELETED_NODES]: DeletedNodesEvent;
    [ActionEventName.DELETE_BOOKMARKS]: DeleteBookmarksEvent;
    [ActionEventName.ACCEPT_INVITATIONS]: AcceptInvitationsEvent;
    [ActionEventName.REJECT_INVITATIONS]: RejectInvitationsEvent;
    [ActionEventName.ALL]: ActionEvent;
};
