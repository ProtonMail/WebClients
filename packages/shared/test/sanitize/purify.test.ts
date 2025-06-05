import { sanitizeComposerReply } from '@proton/shared/lib/sanitize/purify';

describe('sanitizeComposerReply', () => {
    it('should remove all <style> tags from the input element', () => {
        const input = document.createElement('div');
        input.innerHTML = `
            <style>.example { color: red; }</style>
            <style>.example { color: red; }</style>
            <p>Test content</p>`;

        sanitizeComposerReply(input);

        expect(input.querySelector('style')).toBeNull();
        expect(input.querySelector('p')?.textContent).toBe('Test content');
    });

    it('should return the input element unchanged if there are no <style> tags', () => {
        const input = document.createElement('div');
        input.innerHTML = `<p>Test content</p>`;

        const result = sanitizeComposerReply(input);

        expect(result.querySelector('style')).toBeNull();
        expect(result.querySelector('p')?.textContent).toBe('Test content');
    });

    it('should return the input element as is if it is not queryable', () => {
        const input = document.createTextNode('Text node') as unknown as Element;

        const result = sanitizeComposerReply(input);

        expect(result).toBe(input);
    });

    it('should handle null input gracefully', () => {
        const result = sanitizeComposerReply(null as unknown as Element);

        expect(result).toBeNull();
    });
});
