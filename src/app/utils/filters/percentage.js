angular.module('proton.utils')
    .filter('percentage', () => {
        return (input = 0, max = 1) => Math.round(100 * input / max);
    });
