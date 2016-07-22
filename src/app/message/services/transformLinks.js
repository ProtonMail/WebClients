angular.module('proton.message')
.factory('transformLinks', function() {
    return function(html) {
        var links = html.querySelectorAll('a[href^=http]');

        if (links.length > 0) {
            links.setAttribute('target','_blank');
            links.setAttribute('rel', 'noreferrer');
        }

        return html;
    };
});
