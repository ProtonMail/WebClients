import { type EndpointOptions } from './enhancers/endpoint';

const withItemKey = (base: string) => (shareId: string, itemId: string) => `${base}::${shareId}::${itemId}`;
const withKey = (base: string) => (key: string) => `${base}::${key}`;

export const bootRequest = () => 'worker::boot';
export const syncRequest = () => 'worker::sync';
export const channelRequest = withKey(`worker::channel`);
export const wakeupRequest = ({ endpoint, tabId }: EndpointOptions) => `worker::wakeup-${endpoint}-${tabId}`;
export const offlineToggleRequest = () => `offline::toggle`;
export const offlineResumeRequest = () => `offline::resume`;

export const itemPinRequest = withItemKey(`item::pin`);
export const itemUnpinRequest = withItemKey(`item::unpin`);
export const itemRevisionsRequest = withItemKey(`item::revisions`);
export const itemsImportRequest = () => `items::import`;
export const itemsBulkMoveRequest = () => `items::bulk::move`;
export const itemsBulkTrashRequest = () => `items::bulk::trash`;
export const itemsBulkDeleteRequest = () => `items::bulk::delete`;
export const itemsBulkRestoreRequest = () => `items::bulk::restore`;
export const itemUpdateFlagsRequest = withItemKey(`item::flags::update`);
export const itemCreateSecureLinkRequest = withItemKey(`item::secure-link::create`);
export const itemViewSecureLinkRequest = withKey('item::secure-link::view');
export const itemDeleteSecureLinkRequest = withItemKey('item::secure-link::delete');
export const itemGetSecureLinksRequest = () => 'item::secure-link::get';

export const vaultCreateRequest = (optimisticId: string) => `vault::create::${optimisticId}`;
export const vaultEditRequest = (shareId: string) => `vault::edit::${shareId}`;
export const vaultDeleteRequest = (shareId: string) => `vault::delete::${shareId}`;
export const vaultMoveAllItemsRequest = (shareId: string) => `vault::move::all::items::${shareId}`;
export const vaultTransferOwnerRequest = (userShareId: string) => `vault::transfer:owner::${userShareId}`;
export const trashEmptyRequest = () => `trash::empty`;
export const trashRestoreRequest = () => `trash::restore`;

export const unlockRequest = () => `auth::unlock`;
export const lockCreateRequest = () => `auth::lock::create`;
export const passwordConfirmRequest = () => `auth::password::confirm`;
export const extraPasswordToggleRequest = () => `auth::extra-password::toggle`;

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
export const userSettingsRequest = (userId: string) => `user::settings::${userId}`;

export const reportBugRequest = (id: string) => `report::bug::${id}`;

export const organizationSettingsRequest = () => `organization::settings::get`;

export const sentinelToggleRequest = () => `monitor::sentinel::toggle`;

export const breachesRequest = () => `monitor::breaches`;
export const protonBreachRequest = (addressId: string) => `monitor::breaches::proton::${addressId}`;
export const customBreachRequest = (addressId: string) => `monitor::breaches::custom::${addressId}`;
export const aliasBreachRequest = withItemKey(`monitor::breaches::alias`);

export const addCustomAddressRequest = (email: string) => `monitor::add::custom::${email}`;
export const verifyCustomAddressRequest = (addressId: string) => `monitor::verify::custom::${addressId}`;
export const deleteCustomAddressRequest = (email: string) => `monitor::delete::custom::${email}`;
export const resendCustomAddressCodeRequest = (addressId: string) => `monitor::verify::custom::resend::${addressId}`;

export const toggleMonitorRequest = () => `monitor::global::toggle`;
export const toggleAddressMonitorRequest = (addressId: string) => `monitor::toggle::address::${addressId}`;
export const resolveAddressMonitorRequest = (addressId: string) => `monitor::resolve::address::${addressId}`;
