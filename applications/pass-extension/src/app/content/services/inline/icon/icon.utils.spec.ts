import { resolveInjectionAnchor } from './icon.utils';

describe('resolveInjectionAnchor', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    test('should return input when no next sibling or sibling is not a label', () => {
        const input = document.createElement('input');
        const div = document.createElement('div');

        document.body.appendChild(input);
        expect(resolveInjectionAnchor(input)).toBe(input);

        document.body.appendChild(div);
        expect(resolveInjectionAnchor(input)).toBe(input);
    });

    test('should return label when next sibling is a label (floating label pattern)', () => {
        const input = document.createElement('input');
        const label = document.createElement('label');

        document.body.appendChild(input);
        document.body.appendChild(label);

        expect(resolveInjectionAnchor(input)).toBe(label);
    });
});
