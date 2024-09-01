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

export const secureLinkCreateRequest = withItemKey(`secure-link::create`);
export const secureLinkOpenRequest = withKey('secure-link::open');
export const secureLinkRemoveRequest = withItemKey('secure-link::remove');
export const secureLinksRemoveInactiveRequest = () => 'secure-links::remove::inactive';
export const secureLinksGetRequest = () => 'secure-links::get';

export const vaultCreateRequest = withKey(`vault::create`);
export const vaultEditRequest = withKey(`vault::edit`);
export const vaultDeleteRequest = withKey(`vault::delete`);
export const vaultMoveAllItemsRequest = withKey(`vault::move::all::items`);
export const vaultTransferOwnerRequest = withKey(`vault::transfer:owner`);
export const trashEmptyRequest = () => `trash::empty`;
export const trashRestoreRequest = () => `trash::restore`;

export const unlockRequest = () => `auth::unlock`;
export const lockCreateRequest = () => `auth::lock::create`;
export const passwordConfirmRequest = () => `auth::password::confirm`;
export const extraPasswordToggleRequest = () => `auth::extra-password::toggle`;

export const settingsEditRequest = withKey(`settings::edit`);

export const aliasOptionsRequest = withKey(`alias::options`);
export const aliasDetailsRequest = withKey(`alias::details`);
export const aliasSyncEnableRequest = () => `alias::sync::enable`;
export const aliasSyncPendingRequest = () => `alias::sync::pending`;
export const aliasSyncStatusRequest = () => `alias::sync::status`;
export const aliasSyncToggleStatusRequest = withItemKey(`alias::sync::status::toggle`);

export const shareRemoveMemberRequest = withKey(`share::members::remove`);
export const shareEditMemberRoleRequest = withKey(`share::members::edit-role`);
export const shareLeaveRequest = withKey(`share::leave`);
export const shareAccessOptionsRequest = withKey(`share::access-options`);

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
export const userSettingsRequest = withKey(`user::settings`);

export const reportBugRequest = withKey(`report::bug`);

export const organizationSettingsRequest = () => `organization::settings::get`;
export const sentinelToggleRequest = () => `monitor::sentinel::toggle`;

export const breachesRequest = () => `monitor::breaches`;
export const protonBreachRequest = withKey(`monitor::breaches::proton`);
export const customBreachRequest = withKey(`monitor::breaches::custom`);
export const aliasBreachRequest = withItemKey(`monitor::breaches::alias`);

export const addCustomAddressRequest = withKey(`monitor::add::custom`);
export const verifyCustomAddressRequest = withKey(`monitor::verify::custom`);
export const deleteCustomAddressRequest = withKey(`monitor::delete::custom`);
export const resendCustomAddressCodeRequest = withKey(`monitor::verify::custom::resend`);

export const toggleMonitorRequest = () => `monitor::global::toggle`;
export const toggleAddressMonitorRequest = withKey(`monitor::toggle::address`);
export const resolveAddressMonitorRequest = withKey(`monitor::resolve::address`);

export const websiteRulesRequest = () => `rules::get`;
