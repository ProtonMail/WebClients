angular.module('proton.message')
.factory('transformImages', function(embedded) {
    return function(html, message) {
        var images = [].slice.call(html.querySelectorAll('img'));

        if (images.length > 0) {
            var embedded = new RegExp('^(cid:)', 'g');

            images.forEach(function(image) {
                var src = image.getAttribute('src');
                var isEmbedded = embedded.test(src);

                if (image.complete && isEmbedded) {
                    var wrapper = document.createElement('div');

                    image.setAttribute('data-src', src);
                    image.removeAttribute('src');
                    wrapper.className = 'image loading';
                    image.before(wrapper);
                    wrapper.append(element);
                }
            });
        }

        return html;
    };
});
