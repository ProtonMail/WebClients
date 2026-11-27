import { createMemoryHistory } from 'history';

import { defaultESStatus } from '@proton/encrypted-search/constants';
import { DEFAULT_MAIL_SETTINGS } from '@proton/shared/lib/mail/mailSettings';
import { buildUser } from '@proton/shared/testing/buildUser';
import { PROTON_DEFAULT_THEME_INFORMATION } from '@proton/theme/themes';

import { setupStore } from '../store/store';
import type { MailToolDeps } from './toolModule';

/** Every member is present; a case overrides only the ones its behaviour depends on. */
export const buildMailToolDeps = (overrides: Partial<MailToolDeps> = {}): MailToolDeps => ({
    store: overrides.store ?? setupStore(),
    history: createMemoryHistory(),
    getFolders: () => [],
    getLabels: () => [],
    getFilters: () => [],
    getActiveCategoryTabs: () => [],
    getMailSettings: () => DEFAULT_MAIL_SETTINGS,
    getContactEmails: () => [],
    getFullContact: vi.fn(),
    saveVCardContact: vi.fn(),
    // No shared UserSettings generator exists yet, so a case that reads them must pass its own.
    getUserSettings: () => {
        throw new Error('buildMailToolDeps: pass getUserSettings in the overrides');
    },
    getUser: () => buildUser(),
    getAddresses: () => [],
    getThemeInformation: () => PROTON_DEFAULT_THEME_INFORMATION,
    setTheme: vi.fn(),
    setViewLayout: vi.fn(),
    setViewMode: vi.fn(),
    setDensity: vi.fn(),
    setAutoResponder: vi.fn(),
    updateAddress: vi.fn(),
    applyLocation: vi.fn(),
    applyMultipleLocations: vi.fn(),
    reportRecategorize: vi.fn(),
    validateMove: vi.fn(),
    markAs: vi.fn(),
    markAll: vi.fn(),
    snooze: vi.fn(),
    createLabel: vi.fn(),
    updateLabel: vi.fn(),
    addFilter: vi.fn(),
    updateFilter: vi.fn(),
    validateSieve: vi.fn(),
    getESStatus: () => defaultESStatus,
    loadConversation: vi.fn(),
    fetchConversation: vi.fn(),
    fetchMessage: vi.fn(),
    initializeMessage: vi.fn(),
    composeDraft: vi.fn(),
    getDraftChangeability: () => ({
        isOpen: false,
        isEditorReady: false,
        canReplaceBody: false,
        canReaddress: false,
    }),
    writeDraftBody: () => false,
    setDraftRecipients: vi.fn(),
    ...overrides,
});
