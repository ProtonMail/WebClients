import { createSecureVegaLoader } from './secureVegaLoader';

describe('createSecureVegaLoader', () => {
    it('rejects all load() requests', async () => {
        const secureLoader = createSecureVegaLoader();

        await expect(secureLoader.load('https://example.com/data.json')).rejects.toThrow(
            /External resource loading is disabled/
        );
    });

    it('blocks external image URLs in sanitize() before the browser can fetch them', async () => {
        const secureLoader = createSecureVegaLoader();

        await expect(
            secureLoader.sanitize('https://attacker.example/badge.png?d=Sebastian+Argentina', { context: 'image' })
        ).rejects.toThrow(/External resource loading is disabled/);
    });

    it('allows data URLs for image sanitize() so inline assets still compile', async () => {
        const secureLoader = createSecureVegaLoader();
        const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';

        await expect(secureLoader.sanitize(dataUrl, { context: 'image' })).resolves.toMatchObject({
            href: dataUrl,
        });
    });

    it('does not block non-image sanitize() contexts used by Vega href handling', async () => {
        const secureLoader = createSecureVegaLoader();

        await expect(secureLoader.sanitize('https://example.com/docs', { context: 'href' })).resolves.toMatchObject({
            href: 'https://example.com/docs',
        });
    });
});
