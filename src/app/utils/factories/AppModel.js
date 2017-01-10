angular.module('proton.utils')
    .factory('AppModel', ($rootScope) => {

        const MODEL = {};
        const dispatch = (type, data = {}) => $rootScope.$emit('AppModel', { type, data });

        const set = (key = '', value) => {
            MODEL[key] = value;
            dispatch(key, { value });
        };
        const is = (key = '') => !!MODEL[key];

        return { is, set };
    });
