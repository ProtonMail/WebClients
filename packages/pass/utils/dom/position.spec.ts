import { isContainingBlock } from './position';

describe('position utilities', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    describe('containing block detection', () => {
        test('should return `false` for static positioned elements', () => {
            document.body.innerHTML = `<div id="target" style="position: static;"></div>`;
            const target = document.getElementById('target')!;

            expect(isContainingBlock(target)).toBe(false);
        });

        test('should return `true` for non-static positioned elements', () => {
            document.body.innerHTML = `
                <div id="relative" style="position: relative;"></div>
                <div id="absolute" style="position: absolute;"></div>
                <div id="fixed" style="position: fixed;"></div>
                <div id="sticky" style="position: sticky;"></div>
            `;

            expect(isContainingBlock(document.getElementById('relative')!)).toBe(true);
            expect(isContainingBlock(document.getElementById('absolute')!)).toBe(true);
            expect(isContainingBlock(document.getElementById('fixed')!)).toBe(true);
            expect(isContainingBlock(document.getElementById('sticky')!)).toBe(true);
        });

        test('should return `true` for elements with transform', () => {
            document.body.innerHTML = `
                <div id="translate" style="transform: translateX(10px);"></div>
                <div id="scale" style="transform: scale(1.1);"></div>
                <div id="rotate" style="transform: rotate(45deg);"></div>
            `;

            expect(isContainingBlock(document.getElementById('translate')!)).toBe(true);
            expect(isContainingBlock(document.getElementById('scale')!)).toBe(true);
            expect(isContainingBlock(document.getElementById('rotate')!)).toBe(true);
        });

        test('should return `true` for elements with filter effects', () => {
            document.body.innerHTML = `
                <div id="blur" style="filter: blur(5px);"></div>
                <div id="brightness" style="filter: brightness(0.8);"></div>
            `;

            expect(isContainingBlock(document.getElementById('blur')!)).toBe(true);
            expect(isContainingBlock(document.getElementById('brightness')!)).toBe(true);
        });

        test('should return `true` for elements with perspective', () => {
            document.body.innerHTML = `<div id="target" style="perspective: 100px;"></div>`;
            const target = document.getElementById('target')!;

            expect(isContainingBlock(target)).toBe(true);
        });

        test('should return `false` when all properties are default values', () => {
            document.body.innerHTML = `<div id="target" style="position: static; transform: none; filter: none; perspective: none; backdrop-filter: none;"></div>`;
            const target = document.getElementById('target')!;
            expect(isContainingBlock(target)).toBe(false);
        });
    });
});
