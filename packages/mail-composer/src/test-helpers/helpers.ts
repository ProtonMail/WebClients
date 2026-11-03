import { waitFor } from '@testing-library/react';

import { clearCache } from '@proton/components/testing/cache';
import { addApiMock, apiMock, clearApiMocks } from '@proton/test-api/api';

/** Recipients without public keys, unless a test registers its own `core/v4/keys/all` mock. */
const addDefaultApiMocks = () => {
    addApiMock('core/v4/keys/all', () => ({ Address: { Keys: [] } }));
};

addDefaultApiMocks();

export const clearAll = () => {
    jest.clearAllMocks();
    apiMock.mockClear();
    clearApiMocks();
    clearCache();
    addDefaultApiMocks();
};

export const getDropdown = () =>
    waitFor(
        () => {
            const dropdown = document.querySelector('div[role="dialog"].dropdown') as HTMLDialogElement | null;
            if (!dropdown) {
                throw new Error('No dropdown was on screen');
            }
            return dropdown;
        },
        { interval: 100, timeout: 5000 }
    );
