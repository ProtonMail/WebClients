angular.module('proton.commons')
    .factory('listeners', ($rootScope) => {

        return () => {
            const listeners = [];
            const on = (type, cb) => listeners.push($rootScope.$on(type, cb));
            const unsubscribe = () => {
                listeners.forEach((cb) => cb());
                listeners.length = 0;
            };
            return { on, unsubscribe };
        };
    });
