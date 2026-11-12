import { createMemoryHistory } from 'history';

import { defaultESStatus } from '@proton/encrypted-search/constants';
import { DEFAULT_MAIL_SETTINGS } from '@proton/shared/lib/mail/mailSettings';
import { PROTON_DEFAULT_THEME_INFORMATION } from '@proton/shared/lib/themes/themes';
import { buildUser } from '@proton/shared/testing/buildUser';

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
    getFullContact: jest.fn(),
    saveVCardContact: jest.fn(),
    // No shared UserSettings generator exists yet, so a case that reads them must pass its own.
    getUserSettings: () => {
        throw new Error('buildMailToolDeps: pass getUserSettings in the overrides');
    },
    getUser: () => buildUser(),
    getAddresses: () => [],
    getThemeInformation: () => PROTON_DEFAULT_THEME_INFORMATION,
    setTheme: jest.fn(),
    setViewLayout: jest.fn(),
    setViewMode: jest.fn(),
    setDensity: jest.fn(),
    setAutoResponder: jest.fn(),
    updateAddress: jest.fn(),
    applyLocation: jest.fn(),
    applyMultipleLocations: jest.fn(),
    markAs: jest.fn(),
    markAll: jest.fn(),
    snooze: jest.fn(),
    createLabel: jest.fn(),
    updateLabel: jest.fn(),
    addFilter: jest.fn(),
    updateFilter: jest.fn(),
    validateSieve: jest.fn(),
    getESStatus: () => defaultESStatus,
    loadConversation: jest.fn(),
    fetchConversation: jest.fn(),
    fetchMessage: jest.fn(),
    initializeMessage: jest.fn(),
    composeDraft: jest.fn(),
    getDraftChangeability: () => ({
        isOpen: false,
        isEditorReady: false,
        canReplaceBody: false,
        canReaddress: false,
    }),
    writeDraftBody: () => false,
    setDraftRecipients: jest.fn(),
    ...overrides,
});
