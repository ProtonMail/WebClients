export const transformWelcome = (document: Element) => {
    // For the welcome email, we need to change the path to the welcome image lock
    const images = [...document.querySelectorAll('img[src="/img/app/welcome_lock.gif"]')] as HTMLImageElement[];

    if (images.length > 0) {
        images.forEach((image) => {
            image.src = '/assets/img/emails/welcome_lock.gif';
        });
    }
};
