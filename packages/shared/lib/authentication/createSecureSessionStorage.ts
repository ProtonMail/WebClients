import debounce from 'lodash/debounce';

import { load, save } from '../helpers/secureSessionStorage';
import createStore from '../helpers/store';

const createSecureSessionStorage = () => {
    const store = createStore(load());

    if ('onpagehide' in window) {
        let finalize: (() => void) | undefined;
        const handleSave = () => {
            finalize = save(store.getState());
        };
        // Save once on initial load.
        handleSave();
        // Save on every change. Debounce due to rapid setting of values.
        store.onChange(debounce(handleSave, 50));
        // Finalize to synchronous storage on pagehide.
        const handlePageHide = () => {
            finalize?.();
        };
        window.addEventListener('pagehide', handlePageHide, true);
    } else {
        const handleUnload = () => {
            save(store.getState());
        };
        // This gets narrowed to never because of the onpagehide
        // @ts-ignore
        window.addEventListener('unload', handleUnload, true);
    }

    return store;
};

export type SecureSessionStorage = ReturnType<typeof createSecureSessionStorage>;

export default createSecureSessionStorage;
