// :has() selector doesn't work in Firefox, so need to use JS to add/remove class
export function trackFocus(selector: string, cbElement: any) {
    const element = document.querySelector(selector);
    if (!element) {
        throw new Error(`Element with selector ${selector} not found`);
    }

    cbElement.on('focus', () => {
        element.closest('.card-input--one-line')?.classList.add('focus');
    });

    cbElement.on('blur', () => {
        element.closest('.card-input--one-line')?.classList.remove('focus');
    });
}
