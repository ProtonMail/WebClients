angular.module('proton.composer')
    .factory('outsidersMap', () => {

        let MAP = {};
        const set = (key, value) => (MAP[key] = value);
        const get = (key) => MAP[key];
        const remove = (key) => delete MAP[key];
        const clear = () => (MAP = {});

        return { set, get, clear, remove };
    });
