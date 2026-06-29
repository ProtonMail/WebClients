import { lumoImageMarker, resolveFilenameCollision, stripUnshareableAttachmentContent } from './imageAttachment';

describe('lumoImageMarker', () => {
    it('emits a user marker with a filename', () => {
        expect(lumoImageMarker('550e8400-e29b-41d4-a716-446655440000', 'user', 'sunset.jpg')).toBe(
            '<lumo-image id="550e8400-e29b-41d4-a716-446655440000" source="user" name="sunset.jpg" />'
        );
    });

    it('emits an assistant marker with a filename', () => {
        expect(lumoImageMarker('3f2504e0-4f89-11d3-9a0c-0305e82c3301', 'assistant', 'output.png')).toBe(
            '<lumo-image id="3f2504e0-4f89-11d3-9a0c-0305e82c3301" source="assistant" name="output.png" />'
        );
    });

    it('omits the name attribute when name is not provided', () => {
        expect(lumoImageMarker('abc', 'assistant')).toBe('<lumo-image id="abc" source="assistant" />');
    });

    it('percent-encodes spaces in the filename', () => {
        expect(lumoImageMarker('abc', 'user', 'my photo.jpg')).toBe(
            '<lumo-image id="abc" source="user" name="my%20photo.jpg" />'
        );
    });

    it('percent-encodes special XML characters in the filename', () => {
        expect(lumoImageMarker('abc', 'user', 'a"b&c<d>e.jpg')).toBe(
            '<lumo-image id="abc" source="user" name="a%22b%26c%3Cd%3Ee.jpg" />'
        );
    });
});

describe('resolveFilenameCollision', () => {
    it('returns the name unchanged when there is no collision', () => {
        expect(resolveFilenameCollision('Lumo generated 2026-06-29 17.42.png', [])).toBe(
            'Lumo generated 2026-06-29 17.42.png'
        );
        expect(resolveFilenameCollision('image.png', ['other.png'])).toBe('image.png');
    });

    it('appends (2) on a first collision', () => {
        expect(resolveFilenameCollision('image.png', ['image.png'])).toBe('image (2).png');
    });

    it('increments the suffix past existing numbered variants', () => {
        expect(resolveFilenameCollision('image.png', ['image.png', 'image (2).png', 'image (3).png'])).toBe(
            'image (4).png'
        );
    });

    it('matches case-insensitively', () => {
        expect(resolveFilenameCollision('Image.PNG', ['image.png'])).toBe('Image (2).PNG');
    });

    it('keeps the extension intact and only suffixes the base name', () => {
        expect(
            resolveFilenameCollision('Lumo generated 2026-06-29 17.42.png', ['Lumo generated 2026-06-29 17.42.png'])
        ).toBe('Lumo generated 2026-06-29 17.42 (2).png');
    });

    it('handles names without an extension', () => {
        expect(resolveFilenameCollision('image', ['image'])).toBe('image (2)');
    });

    it('disambiguates several images generated within one response (accumulating names)', () => {
        // Mirrors the streaming path: the same minute-resolution base name arrives repeatedly
        // and each resolved name is fed back in so the next one increments correctly.
        const base = 'Lumo generated 2026-06-29 17.42.png';
        const generated: string[] = [];

        const first = resolveFilenameCollision(base, generated);
        generated.push(first);
        const second = resolveFilenameCollision(base, generated);
        generated.push(second);
        const third = resolveFilenameCollision(base, generated);
        generated.push(third);

        expect(generated).toEqual([
            'Lumo generated 2026-06-29 17.42.png',
            'Lumo generated 2026-06-29 17.42 (2).png',
            'Lumo generated 2026-06-29 17.42 (3).png',
        ]);
    });
});

describe('stripUnshareableAttachmentContent', () => {
    it('removes attachment markdown image references', () => {
        const content = 'Hello\n\n![Generated image](attachment:6e4b1178-332a-44ee-843f-6003a8321f2f)\n\nWorld';

        expect(stripUnshareableAttachmentContent(content)).toBe('Hello\n\nWorld');
    });

    it('removes multiple attachment placeholders and collapses blank lines', () => {
        const content = 'Start\n\n![Generated image](attachment:one)\n\n\n![Image](attachment:two)\n\nEnd';

        expect(stripUnshareableAttachmentContent(content)).toBe('Start\n\nEnd');
    });
});
