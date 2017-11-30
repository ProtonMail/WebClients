angular.module('proton.commons')
    .factory('dispatchers', ($rootScope) => {

        const createMap = (list = []) => {
            return list.reduce((acc, key) => {

                // Private events
                if (key.charAt(0) !== '$') {
                    acc[key] = (type, data = {}) => {
                        $rootScope.$emit(key, { type, data });
                    }
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
            const [ data ] = arg.slice(-1);
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
                listeners.push($rootScope.$on(type, callback));
            };

            const unsubscribe = () => {
                listeners.forEach((cb) => cb());
                listeners.length = 0;
            };
            return { dispatcher, on, unsubscribe };
        };
    });
