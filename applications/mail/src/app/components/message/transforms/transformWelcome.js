export const transformWelcome = (html) => {
    // For the welcome email, we need to change the path to the welcome image lock
    const images = [...html.querySelectorAll('img[src="/img/app/welcome_lock.gif"]')];

    console.log('transformWelcome', images);

    if (images.length > 0) {
        images.forEach((image) => {
            image.src = '/assets/img/emails/welcome_lock.gif';
        });
    }

    return html;
};
