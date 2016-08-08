angular.module('proton.message')
.factory('transformImages', function(authentication, embedded) {

    const REGEXP_IS_CID = /^cid:/;
    const wrapImage = (img) => angular.element(img).wrap('<div class="image loading"></div>');

    return function(html, message) {

        const images = [].slice.call(html.querySelectorAll('img[src]'));
        const user = authentication.user || {ShowEmbedded:0};
        const show = message.showEmbedded === true || user.ShowEmbedded === 1;

        if (images.length > 0) {
            images.forEach(function(image) {
                const src = image.src;
                const isEmbedded = REGEXP_IS_CID.test(src);

                if (isEmbedded) {
                    if (show) {
                        image.setAttribute('data-embedded-img', src);
                        !image.parentElement.classList.contains('loading') && wrapImage(image);
                    } else {
                        message.showEmbedded = false;
                        image.setAttribute("alt",embedded.getName(message,image.src));
                    }

                    image.removeAttribute('src');
                }
            });
        }

        return html;
    };
});
