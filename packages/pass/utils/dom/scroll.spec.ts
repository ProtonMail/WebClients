import { scrollableParent } from './scroll';

describe('scroll utilities', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    describe('scrollable parent resolution', () => {
        test('should return `document.body` for null input', () => {
            expect(scrollableParent(null)).toBe(document.body);
        });

        test('should return document.body when element is document.body', () => {
            expect(scrollableParent(document.body)).toBe(document.body);
        });

        test('should return element with `overflow-y: auto`', () => {
            document.body.innerHTML = `
                <div id="parent" style="overflow-y: auto;">
                    <div id="child"></div>
                </div>
            `;

            const parent = document.getElementById('parent')!;
            const child = document.getElementById('child')!;
            expect(scrollableParent(child)).toBe(parent);
        });

        test('should return element with `overflow-y: scroll`', () => {
            document.body.innerHTML = `
                <div id="parent" style="overflow-y: scroll;">
                    <div id="child"></div>
                </div>
            `;

            const parent = document.getElementById('parent')!;
            const child = document.getElementById('child')!;
            expect(scrollableParent(child)).toBe(parent);
        });

        test('should traverse up to find scrollable parent', () => {
            document.body.innerHTML = `
                <div id="scrollable" style="overflow-y: auto;">
                    <div id="parent" style="overflow-y: visible;">
                        <div id="child"></div>
                    </div>
                </div>
            `;

            const scrollable = document.getElementById('scrollable')!;
            const child = document.getElementById('child')!;
            expect(scrollableParent(child)).toBe(scrollable);
        });

        test('should fallback to `document.body` when no scrollable parent found', () => {
            document.body.innerHTML = `
                <div id="parent" style="overflow-y: visible;">
                    <div id="child" style="overflow-y: hidden;"></div>
                </div>
            `;

            const child = document.getElementById('child')!;
            expect(scrollableParent(child)).toBe(document.body);
        });

        test('should ignore non-scrollable overflow values', () => {
            document.body.innerHTML = `
                <div id="parent" style="overflow-y: hidden;">
                    <div id="child"></div>
                </div>
            `;

            const child = document.getElementById('child')!;
            expect(scrollableParent(child)).toBe(document.body);

            document.body.innerHTML = `
                <div id="parent" style="overflow-y: visible;">
                    <div id="child"></div>
                </div>
            `;

            const child2 = document.getElementById('child')!;
            expect(scrollableParent(child2)).toBe(document.body);
        });
    });
});
