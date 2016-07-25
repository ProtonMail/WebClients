angular.module('proton.message')
.factory('transformImages', function(embedded) {

    const REGEXP_IS_CID = new RegExp('^cid:', 'g');
    const wrapImage = (img) => angular.element(img).wrap('<div class="image loading"></div>');

    return function(html, message) {

        const images = [].slice.call(html.querySelectorAll('img'));

        if (images.length > 0) {

            images.forEach(function(image) {
                const src = image.src;
                const isEmbedded = /^cid:/g.test(src);

                if (isEmbedded) {
                    image.removeAttribute('src');
                    image.setAttribute('data-embedded-img', src);
                    wrapImage(image);
                }
            });
        }

        return html;
    };
});
