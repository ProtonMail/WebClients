angular.module('proton.message')
.factory('transformLinks', function() {
    return function(html, message) {
        var links = [].slice.call(html.querySelectorAll('a[href^=http]'));

        if (links.length > 0) {
            links.forEach(function(link) {
                link.setAttribute('target','_blank');
                link.setAttribute('rel', 'noreferrer');
            });
        }

        return html;
    };
});
