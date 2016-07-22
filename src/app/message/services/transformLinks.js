angular.module('proton.message')
.factory('transformLinks', function() {
    return function(input) {
        var links = angular.element(input).find('a[href^=http]');

        if (links.length > 0) {
            links.attr('target','_blank').attr('rel', 'noreferrer');
        }
    };
});
