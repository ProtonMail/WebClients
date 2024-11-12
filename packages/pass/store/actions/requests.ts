import type { SelectedItem } from '@proton/pass/types';

import { type EndpointOptions } from './enhancers/endpoint';

export const selectedItemKey = ({ shareId, itemId }: SelectedItem) => `${shareId}::${itemId}`;

const withItemKey = (base: string) => (shareId: string, itemId: string) => `${base}::${shareId}::${itemId}`;
const withKey = (base: string) => (key: string) => `${base}::${key}`;

export const bootRequest = () => 'worker::boot';
export const syncRequest = () => 'worker::sync';
export const channelRequest = withKey(`worker::channel`);
export const wakeupRequest = ({ endpoint, tabId }: EndpointOptions) => `worker::wakeup-${endpoint}-${tabId}`;

export const itemPinRequest = withItemKey(`item::pin`);
export const itemUnpinRequest = withItemKey(`item::unpin`);
export const itemRevisionsRequest = withItemKey(`item::revisions`);
export const itemsImportRequest = () => `items::import`;
export const itemsBulkMoveRequest = () => `items::bulk::move`;
export const itemsBulkTrashRequest = () => `items::bulk::trash`;
export const itemsBulkDeleteRequest = () => `items::bulk::delete`;
export const itemsBulkRestoreRequest = () => `items::bulk::restore`;

export const vaultCreateRequest = withKey(`vault::create`);
export const vaultEditRequest = withKey(`vault::edit`);
export const vaultDeleteRequest = withKey(`vault::delete`);
export const vaultMoveAllItemsRequest = withKey(`vault::move::all::items`);
export const vaultTransferOwnerRequest = withKey(`vault::transfer:owner`);
export const trashEmptyRequest = () => `trash::empty`;
export const trashRestoreRequest = () => `trash::restore`;

export const lockCreateRequest = () => `auth::lock::create`;

export const settingsEditRequest = withKey(`settings::edit`);

export const aliasOptionsRequest = withKey(`alias::options`);
export const aliasDetailsRequest = withKey(`alias::details`);

export const shareRemoveMemberRequest = withKey(`share::members::remove`);
export const shareEditMemberRoleRequest = withKey(`share::members::edit-role`);
export const shareLeaveRequest = withKey(`share::leave`);

export const inviteCreateRequest = withKey(`invite::create`);
export const inviteResendRequest = withKey(`invite::resend`);
export const inviteAcceptRequest = withKey(`invite::accept`);
export const inviteRejectRequest = withKey(`invite::reject`);
export const inviteRemoveRequest = withKey(`invite::remove`);
export const inviteRecommendationsRequest = withKey(`invite::recommendations`);
export const inviteAddressesValidateRequest = withKey(`invite::addresses::validate`);
export const newUserInvitePromoteRequest = withKey(`new-user-invite::promote`);
export const newUserInviteRemoveRequest = withKey(`new-user-invite::remove`);

export const userAccessRequest = withKey(`user::access`);
export const userFeaturesRequest = withKey(`user::features`);
export const reportBugRequest = withKey(`report::bug`);
