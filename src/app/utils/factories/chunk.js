angular.module('proton.utils')
    .factory('chunk', () => {
        return (list, size) => list.reduce((res, item, index) => {
            (index % size === 0) && res.push([]);
            res[res.length - 1].push(item);
            return res;
        }, []);
    });
