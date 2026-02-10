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

export type NodeEventMeta = { uid: string; parentUid: string | undefined; isTrashed?: boolean; isShared?: boolean };

export enum BusDriverEventName {
    // Specific events that update only a part of the view, can be optimistic or not
    MOVED_NODES = 'MOVED_NODES',
    TRASHED_NODES = 'TRASHED_NODES',
    RESTORED_NODES = 'RESTORED_NODES',
    RENAMED_NODES = 'RENAMED_NODES',

    // Device Events
    RENAMED_DEVICES = 'RENAMED_DEVICES',
    REMOVED_DEVICES = 'REMOVED_DEVICES',

    // Generic events that update the whole node
    UPDATED_NODES = 'UPDATED_NODES_EVENT',
    DELETED_NODES = 'DELETED_NODES_EVENT',
    CREATED_NODES = 'CREATED_NODES_EVENT',

    // Bookmark-specific events
    DELETE_BOOKMARKS = 'DELETE_BOOKMARKS',

    // Invitation-specific events
    ACCEPT_INVITATIONS = 'ACCEPT_INVITATIONS',
    REJECT_INVITATIONS = 'REJECT_INVITATIONS',

    // Direct share specific events
    REMOVE_ME = 'REMOVE_ME',

    // Refresh events
    REFRESH_SHARED_WITH_ME = 'REFRESH_SHARED_WITH_ME',

    // Only available to listen to with .subscribe()
    ALL = '*',
}

export interface MovedNodesEvent {
    type: BusDriverEventName.MOVED_NODES;
    items: { uid: string; parentUid: string | undefined }[];
}

export interface TrashedNodesEvent {
    type: BusDriverEventName.TRASHED_NODES;
    uids: string[];
}
export interface RestoredNodesEvent {
    type: BusDriverEventName.RESTORED_NODES;
    items: { uid: string; parentUid: string | undefined }[];
}

export interface RenamedNodesEvent {
    type: BusDriverEventName.RENAMED_NODES;
    items: { newName: string; uid: string }[];
}

export interface UpdatedNodesEvent {
    type: BusDriverEventName.UPDATED_NODES;
    items: NodeEventMeta[];
}

export interface CreatedNodesEvent {
    type: BusDriverEventName.CREATED_NODES;
    items: NodeEventMeta[];
}

export interface DeletedNodesEvent {
    type: BusDriverEventName.DELETED_NODES;
    uids: string[];
}

export interface RenamedDevicesEvent {
    type: BusDriverEventName.RENAMED_DEVICES;
    items: { newName: string; deviceUid: string }[];
}

export interface RemovedDevicesEvent {
    type: BusDriverEventName.REMOVED_DEVICES;
    deviceUids: string[];
}
export interface DeleteBookmarksEvent {
    type: BusDriverEventName.DELETE_BOOKMARKS;
    uids: string[];
}

export interface AcceptInvitationsEvent {
    type: BusDriverEventName.ACCEPT_INVITATIONS;
    uids: string[];
}

export interface RejectInvitationsEvent {
    type: BusDriverEventName.REJECT_INVITATIONS;
    uids: string[];
}

export interface RemoveMeEvent {
    type: BusDriverEventName.REMOVE_ME;
    uids: string[];
}

export interface RefreshShareWithMeEvent {
    type: BusDriverEventName.REFRESH_SHARED_WITH_ME;
}

export type BusDriverEvent =
    | MovedNodesEvent
    | TrashedNodesEvent
    | RestoredNodesEvent
    | RenamedNodesEvent
    | UpdatedNodesEvent
    | CreatedNodesEvent
    | DeletedNodesEvent
    | RenamedDevicesEvent
    | RemovedDevicesEvent
    | DeleteBookmarksEvent
    | AcceptInvitationsEvent
    | RejectInvitationsEvent
    | RemoveMeEvent
    | RefreshShareWithMeEvent;

export type BusDriverEventListener<T extends BusDriverEvent> = (event: T) => Promise<void>;

export type BusDriverEventMap = {
    [BusDriverEventName.MOVED_NODES]: MovedNodesEvent;
    [BusDriverEventName.TRASHED_NODES]: TrashedNodesEvent;
    [BusDriverEventName.RESTORED_NODES]: RestoredNodesEvent;
    [BusDriverEventName.RENAMED_NODES]: RenamedNodesEvent;
    [BusDriverEventName.UPDATED_NODES]: UpdatedNodesEvent;
    [BusDriverEventName.CREATED_NODES]: CreatedNodesEvent;
    [BusDriverEventName.DELETED_NODES]: DeletedNodesEvent;
    [BusDriverEventName.RENAMED_DEVICES]: RenamedDevicesEvent;
    [BusDriverEventName.REMOVED_DEVICES]: RemovedDevicesEvent;
    [BusDriverEventName.DELETE_BOOKMARKS]: DeleteBookmarksEvent;
    [BusDriverEventName.ACCEPT_INVITATIONS]: AcceptInvitationsEvent;
    [BusDriverEventName.REJECT_INVITATIONS]: RejectInvitationsEvent;
    [BusDriverEventName.REMOVE_ME]: RemoveMeEvent;
    [BusDriverEventName.REFRESH_SHARED_WITH_ME]: RefreshShareWithMeEvent;
    [BusDriverEventName.ALL]: BusDriverEvent;
};
