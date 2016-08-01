angular.module('proton.message')
.factory('transformImages', function() {

    const REGEXP_IS_CID = /^cid:/;
    const wrapImage = (img) => angular.element(img).wrap('<div class="image loading"></div>');

    return function(html, message) {

        const images = [].slice.call(html.querySelectorAll('img[src]'));

        if (images.length > 0) {
            images.forEach(function(image) {
                const src = image.src;
                const isEmbedded = REGEXP_IS_CID.test(src);

                if (isEmbedded) {
                    image.setAttribute('data-embedded-img', src);
                    image.removeAttribute('src');
                    !image.parentElement.classList.contains('loading') && wrapImage(image);
                }
            });
        }

        return html;
    };
});
