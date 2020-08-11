import createStore from '../helpers/store';
import { save2, load2 } from '../helpers/secureSessionStorage';

const createSecureSessionStorage = () => {
    const store = createStore(load2());

    if ('onpagehide' in window) {
        const handlePageShow = () => {
            // This does not need to do anything. The main purpose is just to reset window.name and sessionStorage to fix the Safari 13.1 described below
            load2();
        };

        const handlePageHide = () => {
            // Cannot use !event.persisted because Safari 13.1 does not send that when you are navigating on the same domain
            save2(store.getState());
        };

        window.addEventListener('pageshow', handlePageShow, true);
        window.addEventListener('pagehide', handlePageHide, true);
    } else {
        const handleUnload = () => {
            save2(store.getState());
        };
        window.addEventListener('unload', handleUnload, true);
    }

    return store;
};

export type SecureSessionStorage = ReturnType<typeof createSecureSessionStorage>;

export default createSecureSessionStorage;
