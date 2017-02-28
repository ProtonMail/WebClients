angular.module('proton.commons')
    .factory('AppModel', ($rootScope) => {

        const MODEL = {};
        const dispatch = (type, data = {}) => $rootScope.$emit('AppModel', { type, data });

        const set = (key = '', value) => {
            const previous = MODEL[key];
            MODEL[key] = value;
            (previous !== value) && dispatch(key, { value });
        };
        const is = (key = '') => !!MODEL[key];

        return { is, set };
    });
