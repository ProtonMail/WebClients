import createStore from './helpers/store';
import { load, save } from './helpers/secureSessionStorage';
import { attachOnUnload } from './helpers/dom';

/**
 * Create the secure session storage instance and attach the unload handler
 * to persist the state.
 * @param {Array} keys
 * @return {{set, getState, get, reset, remove}}
 */
export default (keys = []) => {
    const store = createStore(load(keys));

    attachOnUnload(() => {
        save(keys, store.getState());
    });

    return store;
};
