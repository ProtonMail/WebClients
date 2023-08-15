import { browserSessionStorage } from '../extension/storage';
import type { Maybe } from '../types';
import { type ExtensionSession, SESSION_KEYS } from './session';

export const getInMemorySession = async (): Promise<Maybe<ExtensionSession>> => {
    const ps = await browserSessionStorage.getItems(SESSION_KEYS);

    return ps.AccessToken && ps.keyPassword && ps.RefreshToken && ps.UID && ps.UserID
        ? (ps as ExtensionSession)
        : undefined;
};

export const setInMemorySession = async (session: ExtensionSession): Promise<void> =>
    browserSessionStorage.setItems(session);

export const updateInMemorySession = async (update: Partial<ExtensionSession>): Promise<void> => {
    const session = await getInMemorySession();
    if (session) return browserSessionStorage.setItems(update);
};

export const removeInMemorySession = async (): Promise<void> => browserSessionStorage.removeItems(SESSION_KEYS);
