import debounce from 'lodash/debounce';

import { load, save } from '../helpers/secureSessionStorage';
import createStore from '../helpers/store';

const createSecureSessionStorage = () => {
    const store = createStore(load());
    const returnValue = {
        ...store,
        flush: () => {},
    };

    if ('onpagehide' in window) {
        let finalize: (() => void) | undefined;
        const handleSave = () => {
            finalize = save(store.getState());
        };
        // Flush immediately, ignoring the debounce, e.g. before a page reload.
        // Temporary solution pending a refactor of the auth store
        const debouncedFunction = debounce(handleSave, 33);
        returnValue.flush = () => {
            debouncedFunction.cancel();
            handleSave();
        };
        // Save once on initial load.
        handleSave();
        // Save on every change. Debounce due to rapid setting of values.
        store.onChange(debouncedFunction);
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

    return returnValue;
};

export type SecureSessionStorage = ReturnType<typeof createSecureSessionStorage>;

export default createSecureSessionStorage;
