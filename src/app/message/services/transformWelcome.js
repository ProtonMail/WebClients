angular.module('proton.message')
.factory('transformWelcome', function(embedded) {
    return function(html, message) {
        // For the welcome email, we need to change the path to the welcome image lock
        const images = [].slice.call(html.querySelectorAll('img[src="/img/app/welcome_lock.gif"]'));

        if (images.length > 0) {
            images.forEach(function(image) {
                image.src = '/assets/img/emails/welcome_lock.gif';
            });
        }

        return html;
    };
});
