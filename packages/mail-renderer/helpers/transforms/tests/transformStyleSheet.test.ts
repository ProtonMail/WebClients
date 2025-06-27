import { transformStylesheet } from '../transformStylesheet';

describe('transformStylesheet', () => {
    let element: Element;

    beforeEach(() => {
        element = new DOMParser().parseFromString('<html><body></body></html>', 'text/html').body;
    });

    it('should replace fixed position with inherit in style tags', () => {
        element.innerHTML = '<style>div { position: fixed; }</style>';
        transformStylesheet(element);
        const styleTag = element.querySelector('style');
        expect(styleTag?.textContent).toContain('div { position: inherit !important; }');
    });

    it('should not change style content if there is no fixed position', () => {
        element.innerHTML = '<style>div { position: absolute; }</style>';
        transformStylesheet(element);
        const styleTag = element.querySelector('style');
        expect(styleTag?.textContent).toBe('div { position: absolute; }');
    });

    it('should handle multiple style tags', () => {
        element.innerHTML = `
            <style>div { position: fixed; }</style>
            <style>span { position: fixed; }</style>
        `;
        transformStylesheet(element);
        const styleTags = element.querySelectorAll('style');

        expect(styleTags[0].textContent).toBe('div { position: inherit !important; }');
        expect(styleTags[1].textContent).toBe('span { position: inherit !important; }');
    });
});
