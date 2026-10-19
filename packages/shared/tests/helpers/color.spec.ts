import { ACCENT_COLORS_MAP, CSS3_COLORS, getClosestProtonColor } from '../../lib/colors';

describe('color', () => {
    describe('getClosestProtonColor', () => {
        it('should return the closest proton color', () => {
            const colors = [
                { inputString: 'ccc', expected: ACCENT_COLORS_MAP.pink.color },
                { inputString: '#ccc', expected: ACCENT_COLORS_MAP.pink.color },
                { inputString: '#cccccc', expected: ACCENT_COLORS_MAP.pink.color },
                { inputString: 'turquoise', expected: ACCENT_COLORS_MAP.pacific.color },
                { inputString: ACCENT_COLORS_MAP.carrot.color, expected: ACCENT_COLORS_MAP.carrot.color },
            ];

            colors.forEach((color) => {
                expect(getClosestProtonColor(color.inputString)).toEqual(color.expected);
            });
        });

        it('should take the red channel into account', () => {
            // Same green and blue values, only red differs
            expect(getClosestProtonColor('#008080')).toEqual(ACCENT_COLORS_MAP.ocean.color);
            expect(getClosestProtonColor('#ff8080')).toEqual(ACCENT_COLORS_MAP.strawberry.color);
        });

        it('should take the green channel into account', () => {
            // Same red and blue values, only green differs
            expect(getClosestProtonColor('#800080')).toEqual(ACCENT_COLORS_MAP.cerise.color);
            expect(getClosestProtonColor('#80ff80')).toEqual(ACCENT_COLORS_MAP.fern.color);
        });

        it('should take the blue channel into account', () => {
            // Same red and green values, only blue differs
            expect(getClosestProtonColor('#808000')).toEqual(ACCENT_COLORS_MAP.pickle.color);
            expect(getClosestProtonColor('#8080ff')).toEqual(ACCENT_COLORS_MAP.purple.color);
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
