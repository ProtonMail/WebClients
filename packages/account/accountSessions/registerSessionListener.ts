import debounce from 'lodash/debounce';

import {
    registerSessionCreateListener,
    registerSessionRemovalListener,
} from '@proton/shared/lib/authentication/persistedSessionStorage';
import { wait } from '@proton/shared/lib/helpers/promise';

import { writeAccountSessions } from './storage';

export const registerSessionListener = (options: { type: 'all' | 'create' }) => {
    const handler = async () => {
        writeAccountSessions();
    };

    if (options.type === 'all' || options.type === 'create') {
        registerSessionCreateListener(handler);
    }

    if (options.type === 'all') {
        const timeout = 50;
        // Debounced just to avoid persisting for each removed session when multiple are removed
        const debouncedHandler = debounce(handler, timeout);

        registerSessionRemovalListener(async () => {
            void debouncedHandler();
            await wait(timeout);
        });
    }
};
