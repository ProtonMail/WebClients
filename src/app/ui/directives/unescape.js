angular.module('proton.ui')
    .filter('unescape', () => {
        return input => _.unescape(input);
    });
