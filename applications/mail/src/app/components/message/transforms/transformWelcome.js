/* @ngInject */
function transformWelcome() {
    return (html) => {
        // For the welcome email, we need to change the path to the welcome image lock
        const images = [].slice.call(html.querySelectorAll('img[src="/img/app/welcome_lock.gif"]'));

        if (images.length > 0) {
            images.forEach((image) => {
                image.src = '/assets/img/emails/welcome_lock.gif';
            });
        }

        return html;
    };
}
export default transformWelcome;
