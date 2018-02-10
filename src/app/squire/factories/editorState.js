/* @ngInject */
function editorState() {
    const MAP = {};

    /**
     * Init the state of a squire composer.
     * @param {string} ID of the composer
     * @returns {*}
     */
    const init = (ID) => {
        if (!MAP[ID]) {
            /**
             * The data for each composer.
             *
             * state represents the current state of the composer (Whether a popover is open, what font is
             * under the cursor, etc.)
             * callbacks represents all the callbacks to call when the state changes.
             * keys are linked to callbacks. The keys are checked for equality when the state changes
             * and if a change in any of those keys have occured, the callback is invoked.
             * One callback in the callbacks array will have the same index as its corresponding key in the keys array.
             *
             * @type {{state: {}, callbacks: Array, keys: Array}}
             */
            MAP[ID] = { state: {}, callbacks: [], keys: [] };
        }
        return MAP[ID];
    };

    /**
     * Update the editor state of a squire composer.
     * @param {string} ID of the composer
     * @param {Object} newState new state
     */
    const set = (ID, newState) => {
        const map = init(ID);

        const allKeys = Object.keys(newState);

        const oldState = map.state;
        map.state = { ...map.state, ...newState };

        map.callbacks.forEach((cb, i) => {
            const k = map.keys[i] ? map.keys[i] : allKeys;
            // Evaluate if the callback should be called based on if any key in the newState has changed.
            const shouldCall = !k.every((key) => {
                // If the key does not exist in the new state, return true as if it hasn't changed.
                if (!(key in newState)) {
                    return true;
                }
                // If it's the same, return true since it hasn't changed.
                return newState[key] === oldState[key];
            });
            if (shouldCall) {
                cb(oldState, map.state);
            }
        });
    };

    /**
     * Get the state of a squire composer.
     * @param {string} ID of the composer
     */
    const get = (ID) => init(ID).state;

    /**
     * Add an event listener to when the state of a squire composer changes.
     * @param {string} ID of the composer
     * @param {Function} cb callback to call when state changes.
     * @param {Array} keys optional list of keys to trigger the callback.
     */
    const on = (ID, cb, keys) => {
        const map = init(ID);
        map.callbacks.push(cb);
        map.keys.push(keys);
    };

    /**
     * Remove an event listener.
     * @param {string} ID of the composer
     * @param {Function} cb callback to call when state changes.
     */
    const off = (ID, cb) => {
        const map = init(ID);
        const index = map.callbacks.indexOf(cb);
        if (index !== -1) {
            map.callbacks.splice(index, 1);
            map.keys.splice(index, 1);
        }
    };

    return { set, get, on, off };
}

export default editorState;
