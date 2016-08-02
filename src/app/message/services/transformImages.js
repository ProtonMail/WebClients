angular.module('proton.message')
.factory('transformImages', function(authentication) {

    const REGEXP_IS_CID = /^cid:/;
    const wrapImage = (img) => angular.element(img).wrap('<div class="image loading"></div>');

    return function(html, message) {

        const images = [].slice.call(html.querySelectorAll('img[src]'));

        if (images.length > 0) {
            images.forEach(function(image) {
                const src = image.src;
                const isEmbedded = REGEXP_IS_CID.test(src);

                if (isEmbedded) {
                    if (authentication.user.ShowEmbedded === 1 || message.showEmbedded === true) {
                        image.setAttribute('data-embedded-img', src);
                        !image.parentElement.classList.contains('loading') && wrapImage(image);
                    } else {
                        message.showEmbedded = false;
                    }

                    image.removeAttribute('src');
                }
            });
        }

        return html;
    };
});
