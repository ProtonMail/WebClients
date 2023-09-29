import type { ExtensionEndpoint, TabId } from '@proton/pass/types';

import { withRequestNamespace } from './with-request';

export const boot = () => 'boot';
export const syncing = () => 'syncing';
export const wakeup = (endpoint: ExtensionEndpoint, tabId: TabId) => `wakeup-${endpoint}-${tabId}`;

export const vaultCreate = (shareId: string) => `vault-create-request-${shareId}`;
export const vaultEdit = (shareId: string) => `vault-edit-request-${shareId}`;
export const vaultDelete = (shareId: string) => `vault-delete-request-${shareId}`;
export const vaultSetPrimary = (shareId: string) => `vault-set-primary-request-${shareId}`;
export const vaultInvite = withRequestNamespace('vault-invite');

export const items = () => 'items';
export const importItems = () => `import-items`;

export const aliasOptions = () => `alias-options`;
export const aliasDetails = (aliasEmail: string) => `alias-details-${aliasEmail}`;
export const unlockSession = `unlock-session`;
export const settingsEdit = withRequestNamespace(`settings-edit`);
export const reportProblem = `report-problem-request`;

export const shareRemoveMemberRequest = (userShareId: string) => `share::members::remove::${userShareId}`;
export const shareLeaveRequest = (shareId: string) => `share::leave::${shareId}`;
export const inviteResendRequest = (inviteId: string) => `invite::resend::${inviteId}`;
export const inviteRespondRequest = (token: string) => `invite::respond::${token}`;
