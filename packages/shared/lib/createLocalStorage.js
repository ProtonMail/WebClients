import createStore from './helpers/store';
import { attachOnUnload } from './helpers/dom';

/**
 * Create the local storage instance and attach the unload handler
 * to persist the state.
 * @param {Array} keys
 * @return {{set, getState, get, reset, remove}}
 */
export default (keys = []) => {
    const store = createStore(
        keys.reduce((acc, key) => {
            return {
                ...acc,
                [key]: localStorage.getItem(key)
            };
        }, {})
    );

    attachOnUnload(() => {
        const data = store.getState();
        keys.forEach((key) => {
            const value = data[key];
            if (!value) {
                return;
            }
            window.localStorage.setItem(key, value);
        }, {});
    });

    return store;
};
