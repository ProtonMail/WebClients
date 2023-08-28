import { getMaxZIndex, isStackingContext, zTraverse } from './zindex';

describe('z-index utilities', () => {
    const root = document.createElement('body');

    describe('stacking context detection', () => {
        test('should return false if no z-index values', () => {
            const el = document.createElement('div');
            el.style.position = 'absolute';
            expect(isStackingContext(el)).toEqual([false, null]);
        });

        test('should return false if z-index value in non-stacking context', () => {
            const parent = document.createElement('div');
            const el = document.createElement('div');
            parent.appendChild(el);

            el.style.position = 'static';
            el.style.zIndex = '10';
            expect(isStackingContext(el)).toEqual([false, null]);
        });

        test('should return true if position is not static', () => {
            const el = document.createElement('div');

            el.style.position = 'relative';
            el.style.zIndex = '10';
            expect(isStackingContext(el)).toEqual([true, 10]);

            el.style.position = 'absolute';
            el.style.zIndex = '100';
            expect(isStackingContext(el)).toEqual([true, 100]);

            el.style.position = 'fixed';
            el.style.zIndex = '1000';
            expect(isStackingContext(el)).toEqual([true, 1_000]);

            el.style.position = 'sticky';
            el.style.zIndex = '10000';
            expect(isStackingContext(el)).toEqual([true, 10_000]);
        });

        test('should return true for container-type stacking contexts', () => {
            const el = document.createElement('div');

            el.style.containerType = 'size';
            el.style.zIndex = '10';
            expect(isStackingContext(el)).toEqual([true, 10]);

            el.style.containerType = 'inline-size';
            el.style.zIndex = '100';
            expect(isStackingContext(el)).toEqual([true, 100]);
        });

        test('should return true is stack created by parent', () => {
            const el = document.createElement('div');
            const parent = document.createElement('div');
            parent.appendChild(el);

            el.style.zIndex = '10';
            parent.style.display = 'flex';
            expect(isStackingContext(el)).toEqual([true, 10]);

            el.style.zIndex = '100';
            parent.style.display = 'grid';
            expect(isStackingContext(el)).toEqual([true, 100]);
        });
    });

    describe('z-index traversal', () => {
        test('should return 0 if empty document', () => {
            expect(zTraverse(root)).toBe(0);
        });

        test('should return 0 if no stacking contexts', () => {
            root.innerHTML = `
                <div style="position: static; z-index: 101;">
                    <div style="position: static; z-index: 100;">
                        <div id="target"></div>
                    </div>
                </div>
            `;

            expect(zTraverse(root.querySelector('#target')!)).toBe(0);
        });

        test('should handle stacking contexts created by `flex` parent', () => {
            root.innerHTML = `
                <div style="position: static; z-index: 101; display: flex;">
                    <div style="position: static; z-index: 100;">
                        <div id="target"></div>
                    </div>
                </div>
            `;

            expect(zTraverse(root.querySelector('#target')!)).toBe(100);
        });

        test('should handle stacking contexts created by `grid` parent', () => {
            root.innerHTML = `
                <div style="position: static; z-index: 101; display: grid;">
                    <div style="position: static; z-index: 100;">
                        <div id="target"></div>
                    </div>
                </div>
            `;

            expect(zTraverse(root.querySelector('#target')!)).toBe(100);
        });

        test('should handle nested stacking contexts created by `flex` parent', () => {
            root.innerHTML = `
                <div style="display: flex">
                    <div style="position: static; z-index: 101; display: flex;">
                        <div style="position: static; z-index: 100;">
                            <div id="target"></div>
                        </div>
                    </div>
                </div>
            `;

            expect(zTraverse(root.querySelector('#target')!)).toBe(101);
        });

        test('should resolve outer-most stacking context', () => {
            root.innerHTML = `
                <div style="position: absolute; z-index: 10">
                    <div style="position: relative; z-index: 50">
                        <div style="display: flex;">
                            <div style="position: static; z-index: 101; display: flex;">
                                <div style="position: static; z-index: 100;">
                                    <div id="target"></div>
                                </div>
                            </div>
                        </div>
                        <div style="position: relative; z-index: 5">
                        </div>
                    </div>
                </div>
            `;

            expect(zTraverse(root.querySelector('#target')!)).toBe(10);
        });
    });

    describe('max z-index', () => {
        test('should account for children', () => {
            root.innerHTML = `
                <div style="display: flex">
                    <div style="position: static; z-index: 101; display: flex;">
                        <div style="position: static; z-index: 100;">
                            <div id="target">
                                <div style="position: relative; z-index: 1000">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            expect(getMaxZIndex(root.querySelector('#target')!)).toBe(1_000);
        });
    });
});
