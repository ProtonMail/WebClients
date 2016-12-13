angular.module('proton.utils')
    .filter('fixed', () => {
        return (input, number = 2) => input.toFixed(number);
    });
