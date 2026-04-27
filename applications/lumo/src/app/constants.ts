/*
This class is added to any upsell/upgrade components that can direct users to account app or trigger LumoPlusUpsellModal for mobile app
*/
export const LUMO_UPGRADE_TRIGGER_CLASS = 'lumo-upgrade-trigger';

export const LUMO_PLUS_UPGRADE_PATH = '/dashboard?addon=lumo';
export const LUMO_PLUS_FREE_PATH_TO_ACCOUNT = '/dashboard?plan=lumo2024';
export const LUMO_SIGNUP_PATH = '/signup';

// File upload limits
// Unified limit for all ingestion paths (device upload, project KB upload, Drive browser
// add-to-KB, and linked-folder uploads). All of these paths download + process + index
// the file on the main thread, so the same limit must apply everywhere to avoid freezes.
export const MAX_ASSET_SIZE = 10 * 1024 * 1024; // 10MB

export const LUMO_FULL_APP_TITLE = 'Lumo: Privacy-first AI assistant where chats stay confidential';

export const LUMO_APP_NAME = 'Lumo';
