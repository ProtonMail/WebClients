/**
 * Get the event data to be dispatched.
 * @param type
 * @param data
 * @returns {*}
 */
function getEvent(type, data) {
    // The event format is always { type, data }
    if (type || type === '' || data) {
        return { type, data };
    }
    // Otherwise don't include any data in the dispatch event.
}

/**
 * Create a dispatcher emitter function given a .
 * @param {Object} $rootScope
 * @param {String} key for the event.
 * @returns {Function}
 */
function createDispatcher($rootScope, key) {
    return function(type, data = {}) {
        $rootScope.$emit(key, getEvent(type, data));
    };
}

/* @ngInject */
function dispatchers($rootScope) {
    const createMap = (list = []) => {
        return list.reduce((acc, key) => {
            // Private events
            if (key.charAt(0) !== '$') {
                acc[key] = createDispatcher($rootScope, key);
            }
            return acc;
        }, Object.create(null));
    };

    /**
     * Get the trace of the call
     * We remove:
     *  - First line => Error Message
     *  - 2sd line => this trace call
     *  - 3rd line => the log call where we call this function
     *  Then we keep everything until we match a DOM ref.
     *  @return {String} StackTrace of the event.
     */
    function trace() {
        const stack = new Error().stack;
        const [, ...rest] = stack.split('\n');
        const index = rest.findIndex((row) => row.trim().startsWith('at HTML'));
        return rest.slice(2, index).join('\n');
    }

    /**
     * Log event action
     * @param  {String} type main eventName
     * @param  {Function} cb callback
     * @return {Function}
     */
    const log = (type, cb) => (...arg) => {
        const [data] = arg.slice(-1);
        const namespace = `type [${type}]: ${data.type}`;
        console.groupCollapsed(namespace);
        console.log(trace());
        console.log(data);
        cb(...arg);
        console.groupEnd(namespace);
    };

    return (list = [], verbose) => {
        const listeners = [];
        const dispatcher = createMap(list);

        /**
         * Register a listener.
         * Must call unsubscribe in order to clean the listeners array.
         * @param {String} type
         * @param {Function} cb
         */
        const on = (type, cb) => {
            const callback = !verbose ? cb : log(type, cb);
            listeners.push($rootScope.$on(type, callback));
        };

        /**
         * Unsubscribe from all listeners.
         */
        const unsubscribe = () => {
            listeners.forEach((cb) => cb());
            listeners.length = 0;
        };

        return { dispatcher, on, unsubscribe };
    };
}
export default dispatchers;
