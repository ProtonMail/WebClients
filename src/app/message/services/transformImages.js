angular.module('proton.message')
.factory('transformImages', function(authentication, embedded) {

    const REGEXP_IS_CID = /^cid:/;
    const EMBEDDED_CLASSNAME = 'proton-embedded';
    const wrapImage = (img) => angular.element(img).wrap('<div class="image loading"></div>');

    return function(html, message) {

        const images = [].slice.call(html.querySelectorAll('img[src]'));
        const user = authentication.user || {ShowEmbedded:0};
        const show = message.showEmbedded === true || user.ShowEmbedded === 1;

        if (images.length > 0) {
            images.forEach(function(image) {
                const src = image.src;
                const isEmbedded = REGEXP_IS_CID.test(src);

                if (!image.classList.contains(EMBEDDED_CLASSNAME)) {
                    image.classList.add(EMBEDDED_CLASSNAME);
                }

                if (isEmbedded) {
                    const attach = embedded.getAttachment(message,image.src);
                    // check if the attachment exist before processing
                    if (Object.keys(attach).length > 0) {
                        if(show) {
                            image.setAttribute('data-embedded-img', src);
                            !image.parentElement.classList.contains('loading') && wrapImage(image);
                        } else {
                            message.showEmbedded = false;
                            image.setAttribute("alt",attach.Name);
                        }
                        image.removeAttribute('src');
                    }
                }
            });
        }

        return html;
    };
});
