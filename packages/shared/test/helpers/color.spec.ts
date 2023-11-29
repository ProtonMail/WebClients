import { ACCENT_COLORS_MAP, CSS3_COLORS, getClosestProtonColor } from '@proton/shared/lib/colors';

describe('color', () => {
    describe('getClosestProtonColor', () => {
        it('should return the closest proton color', () => {
            const colors = [
                { inputString: 'ccc', expected: ACCENT_COLORS_MAP.pink.color },
                { inputString: '#ccc', expected: ACCENT_COLORS_MAP.pink.color },
                { inputString: '#cccccc', expected: ACCENT_COLORS_MAP.pink.color },
                { inputString: 'turquoise', expected: ACCENT_COLORS_MAP.enzian.color },
                { inputString: ACCENT_COLORS_MAP.carrot.color, expected: ACCENT_COLORS_MAP.carrot.color },
            ];

            colors.forEach((color) => {
                expect(getClosestProtonColor(color.inputString)).toEqual(color.expected);
            });
        });

        it('should return undefined when the color is not valid', () => {
            expect(getClosestProtonColor('invalidColor')).toBeUndefined();
        });

        it('should never return undefined for valid color keywords', () => {
            CSS3_COLORS.forEach((color) => {
                expect(getClosestProtonColor(color)).not.toBeUndefined();
            });
        });
    });
});
