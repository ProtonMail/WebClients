import { type EndpointOptions } from './with-receiver';

export const bootRequest = () => 'worker::boot';
export const syncRequest = () => 'worker::sync';
export const wakeupRequest = ({ endpoint, tabId }: EndpointOptions) => `worker::wakeup-${endpoint}-${tabId}`;

export const vaultCreateRequest = (optimisticId: string) => `vault::create::${optimisticId}`;
export const vaultEditRequest = (shareId: string) => `vault::edit::${shareId}`;
export const vaultDeleteRequest = (shareId: string) => `vault::delete::${shareId}`;
export const vaultMoveAllItemsRequest = (shareId: string) => `vault::move::all::items::${shareId}`;
export const vaultTransferOwnerRequest = (userShareId: string) => `vault::transfer:owner::${userShareId}`;
export const trashEmptyRequest = () => `trash::empty`;
export const trashRestoreRequest = () => `trash::restore`;

export const importItemsRequest = () => `import::items`;

export const sessionUnlockRequest = () => `session::unlock`;
export const sessionLockEnableRequest = () => `session::enable`;
export const sessionLockDisableRequest = () => `session::disable`;
export const settingsEditRequest = (group: string) => `settings::edit::${group}`;

export const aliasOptionsRequest = (shareId: string) => `alias::options::${shareId}`;
export const aliasDetailsRequest = (aliasEmail: string) => `alias::details::${aliasEmail}`;

export const shareRemoveMemberRequest = (userShareId: string) => `share::members::remove::${userShareId}`;
export const shareEditMemberRoleRequest = (userShareId: string) => `share::members::edit-role::${userShareId}`;
export const shareLeaveRequest = (shareId: string) => `share::leave::${shareId}`;
export const shareAccessOptionsRequest = (shareId: string) => `share::access-options::${shareId}`;

export const inviteCreateRequest = (optimisticId: string) => `invite::create::${optimisticId}`;
export const inviteResendRequest = (inviteId: string) => `invite::resend::${inviteId}`;
export const inviteAcceptRequest = (token: string) => `invite::accept::${token}`;
export const inviteRejectRequest = (token: string) => `invite::reject::${token}`;
export const inviteRemoveRequest = (inviteId: string) => `invite::remove::${inviteId}`;

export const newUserInvitePromoteRequest = (newUserInviteId: string) => `new-user-invite::promote::${newUserInviteId}`;
export const newUserInviteRemoveRequest = (newUserInviteId: string) => `new-user-invite::remove::${newUserInviteId}`;

export const userAccessRequest = (userId: string) => `user::access::${userId}`;
export const userFeaturesRequest = (userId: string) => `user::features::${userId}`;

export const reportBugRequest = (id: string) => `report::bug::${id}`;
