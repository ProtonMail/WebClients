import { type EndpointOptions } from './enhancers/endpoint';

export const bootRequest = () => 'worker::boot';
export const syncRequest = () => 'worker::sync';
export const channelRequest = (channelId: string) => `worker::channel::${channelId}`;
export const wakeupRequest = ({ endpoint, tabId }: EndpointOptions) => `worker::wakeup-${endpoint}-${tabId}`;
export const offlineSetupRequest = `offline::setup`;

export const itemPinRequest = (shareId: string, itemId: string) => `item::pin::${shareId}::${itemId}`;
export const itemUnpinRequest = (shareId: string, itemId: string) => `item::unpin::${shareId}::${itemId}`;
export const itemRevisionsRequest = (shareId: string, itemId: string) => `item::revisions::${shareId}::${itemId}`;
export const itemsImportRequest = () => `items::import`;
export const itemsBulkMoveRequest = () => `items::bulk::move`;
export const itemsBulkTrashRequest = () => `items::bulk::trash`;
export const itemsBulkDeleteRequest = () => `items::bulk::delete`;
export const itemsBulkRestoreRequest = () => `items::bulk::restore`;

export const vaultCreateRequest = (optimisticId: string) => `vault::create::${optimisticId}`;
export const vaultEditRequest = (shareId: string) => `vault::edit::${shareId}`;
export const vaultDeleteRequest = (shareId: string) => `vault::delete::${shareId}`;
export const vaultMoveAllItemsRequest = (shareId: string) => `vault::move::all::items::${shareId}`;
export const vaultTransferOwnerRequest = (userShareId: string) => `vault::transfer:owner::${userShareId}`;
export const trashEmptyRequest = () => `trash::empty`;
export const trashRestoreRequest = () => `trash::restore`;

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

export const inviteCreateRequest = (requestId: string) => `invite::create::${requestId}`;
export const inviteResendRequest = (inviteId: string) => `invite::resend::${inviteId}`;
export const inviteAcceptRequest = (token: string) => `invite::accept::${token}`;
export const inviteRejectRequest = (token: string) => `invite::reject::${token}`;
export const inviteRemoveRequest = (inviteId: string) => `invite::remove::${inviteId}`;
export const inviteRecommendationsRequest = (requestId: string) => `invite::recommendations::${requestId}`;
export const inviteAddressesValidateRequest = (requestId: string) => `invite::addresses::validate::${requestId}`;

export const newUserInvitePromoteRequest = (newUserInviteId: string) => `new-user-invite::promote::${newUserInviteId}`;
export const newUserInviteRemoveRequest = (newUserInviteId: string) => `new-user-invite::remove::${newUserInviteId}`;

export const userAccessRequest = (userId: string) => `user::access::${userId}`;
export const userFeaturesRequest = (userId: string) => `user::features::${userId}`;

export const reportBugRequest = (id: string) => `report::bug::${id}`;

export const organizationSettingsRequest = () => `organization::settings::get`;
export const organizationSettingsEditRequest = () => `organization::settings::edit`;

export const sentinelToggleRequest = () => `monitor::sentinel::toggle`;
