import { canSupportDarkStyle } from './messageContent';

const htmlToElement = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html.trim();
    return div.firstChild as HTMLElement;
};

describe('canSupportDarkStyle', () => {
    it('should return false for empty content', () => {
        expect(canSupportDarkStyle()).toBe(false);
    });

    it('should return true for HTML content with no style', () => {
        expect(canSupportDarkStyle(htmlToElement('<div>Panda</div>'))).toBe(true);
    });

    it('should detect dark color', () => {
        expect(canSupportDarkStyle(htmlToElement('<div style="color: #333;">Panda</div>'))).toBe(true);
        expect(canSupportDarkStyle(htmlToElement('<div style="color: #ccc;">Panda</div>'))).toBe(false);
    });

    it('should detect when background is set', () => {
        expect(canSupportDarkStyle(htmlToElement('<div style="background: #333;">Panda</div>'))).toBe(false);
        expect(canSupportDarkStyle(htmlToElement('<div style="background: #ccc;">Panda</div>'))).toBe(false);
    });

    it('should detect color and background in nested element', () => {
        expect(
            canSupportDarkStyle(htmlToElement('<div><div><div style="background: #333;">Panda</div></div></div>'))
        ).toBe(false);
        expect(canSupportDarkStyle(htmlToElement('<div><div><div style="color: #333;">Panda</div></div></div>'))).toBe(
            true
        );
    });
});
