import createStore from './helpers/store';
import { load, save } from './helpers/secureSessionStorage';

/**
 * @param {Array} keys
 * @return {{set, getState, get, reset, remove}}
 */
export default (keys = []) => {
    const store = createStore(load(keys));

    if ('onpagehide' in window) {
        const handlePageShow = () => {
            // This does not need to do anything. The main purpose is just to reset window.name and sessionStorage to fix the Safari 13.1 described below
            load(keys);
        };

        const handlePageHide = () => {
            // Cannot use !event.persisted because Safari 13.1 does not send that when you are navigating on the same domain
            save(keys, store.getState());
        };

        window.addEventListener('pageshow', handlePageShow, true);
        window.addEventListener('pagehide', handlePageHide, true);
    } else {
        const handleUnload = () => {
            save(keys, store.getState());
        };
        window.addEventListener('unload', handleUnload, true);
    }

    return store;
};
