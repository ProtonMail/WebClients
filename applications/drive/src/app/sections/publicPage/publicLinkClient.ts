import type { ProtonDrivePublicLinkClient } from '@proton/drive';

/**
 * Holds the currently active public link client for the public page.
 *
 * IMPORTANT: This is NOT a singleton and should ONLY be used within the public page section.
 * Do NOT import this from other parts of the application (modals, actions, etc.).
 * Instead, pass the client explicitly as a parameter where needed.
 */
let currentPublicLinkClient: ProtonDrivePublicLinkClient | undefined;

export const setPublicLinkClient = (client: ProtonDrivePublicLinkClient) => {
    currentPublicLinkClient = client;
};

export const getPublicLinkClient = (): ProtonDrivePublicLinkClient => {
    if (!currentPublicLinkClient) {
        throw new Error('Public link client not initialized');
    }
    return currentPublicLinkClient;
};

export const clearPublicLinkClient = () => {
    currentPublicLinkClient = undefined;
};
