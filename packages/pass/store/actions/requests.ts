import type { ExtensionEndpoint, TabId } from '@proton/pass/types';

export const boot = () => 'boot';
export const syncing = () => 'syncing';
export const wakeup = (endpoint: ExtensionEndpoint, tabId: TabId) => `wakeup-${endpoint}-${tabId}`;

export const workerReady = (endpoint: ExtensionEndpoint, tabId: TabId) => `wakeup-${endpoint}-${tabId}`;

export const vaultCreate = (shareId: string) => `vault-create-request-${shareId}`;
export const vaultEdit = (shareId: string) => `vault-edit-request-${shareId}`;
export const vaultDelete = (shareId: string) => `vault-delete-request-${shareId}`;
export const vaultSetPrimary = (shareId: string) => `vault-set-primary-request-${shareId}`;

export const items = () => 'items';
export const importItems = () => `import-items`;

export const aliasOptions = () => `alias-options`;
export const aliasDetails = (aliasEmail: string) => `alias-details-${aliasEmail}`;

export const unlockSession = `unlock-session`;
export const settingsEdit = (setting: string) => `settings-change::${setting}`;

export const reportProblem = `report-problem-request`;
