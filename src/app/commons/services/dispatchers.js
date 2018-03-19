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
    return function (type, data) {
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
     * Log event action
     * @param  {String} type main eventName
     * @param  {Function} cb callback
     * @return {Function}
     */
    const log = (type, cb) => (...arg) => {
        const namespace = `type [${type}]:`;
        const [data] = arg.slice(-1);
        console.group(namespace);
        console.log(data);
        cb(...arg);
        console.groupEnd(namespace);
    };

    return (list = [], verbose) => {
        const listeners = [];
        const dispatcher = createMap(list);

        const on = (type, cb) => {
            const callback = !verbose ? cb : log(type, cb);
            const deregistration = $rootScope.$on(type, callback);

            listeners.push(deregistration);

            return deregistration;
        };

        const unsubscribe = () => {
            listeners.forEach((cb) => cb());
            listeners.length = 0;
        };
        return { dispatcher, on, unsubscribe };
    };
}
export default dispatchers;
