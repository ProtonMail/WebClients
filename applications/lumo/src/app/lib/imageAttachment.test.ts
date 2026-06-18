import { lumoImageMarker } from './imageAttachment';

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
        expect(lumoImageMarker('abc', 'assistant')).toBe(
            '<lumo-image id="abc" source="assistant" />'
        );
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
