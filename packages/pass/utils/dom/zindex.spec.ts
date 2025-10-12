import { getOverlayZIndex, isStackingContext } from './zindex';

describe('z-index utilities', () => {
    const root = document.createElement('body');

    describe('stacking context detection', () => {
        test('should return true when reaching root node', () => {
            const el = document.createElement('div');
            el.style.setProperty('position', 'absolute');
            expect(isStackingContext(el)).toEqual([true, 0]);
        });

        test('should return false if z-index value in non-stacking context', () => {
            const parent = document.createElement('div');
            const child = document.createElement('div');
            parent.appendChild(child);

            child.style.setProperty('position', 'static');
            child.style.setProperty('z-index', '10');

            expect(isStackingContext(child)).toEqual([false, 10]);
        });

        test('should return true if position is not static', () => {
            const parent = document.createElement('div');
            let child = document.createElement('div');

            parent.appendChild(child);
            child.style.setProperty('position', 'relative');
            child.style.setProperty('z-index', '10');
            expect(isStackingContext(child)).toEqual([true, 10]);

            child = document.createElement('div');
            parent.appendChild(child);
            child.style.setProperty('position', 'absolute');
            child.style.setProperty('z-index', '11');
            expect(isStackingContext(child)).toEqual([true, 11]);

            child = document.createElement('div');
            parent.appendChild(child);
            child.style.setProperty('position', 'fixed');
            child.style.setProperty('z-index', '12');
            expect(isStackingContext(child)).toEqual([true, 12]);

            child = document.createElement('div');
            parent.appendChild(child);
            child.style.setProperty('position', 'sticky');
            child.style.setProperty('z-index', '13');
            expect(isStackingContext(child)).toEqual([true, 13]);
        });

        test('should return true for container-type stacking contexts', () => {
            const parent = document.createElement('div');
            let child = document.createElement('div');

            parent.appendChild(child);
            child.style.setProperty('container-type', 'size');
            child.style.setProperty('z-index', '10');
            expect(isStackingContext(child)).toEqual([true, 10]);

            child = document.createElement('div');
            parent.appendChild(child);
            child.style.setProperty('container-type', 'inline-size');
            child.style.setProperty('z-index', '100');
            expect(isStackingContext(child)).toEqual([true, 100]);
        });

        test('should return true is stack created by parent', () => {
            let parent = document.createElement('div');
            let child = document.createElement('div');

            parent.appendChild(child);
            parent.style.display = 'flex';
            child.style.setProperty('z-index', '10');
            expect(isStackingContext(child)).toEqual([true, 10]);

            parent = document.createElement('div');
            child = document.createElement('div');
            parent.appendChild(child);
            parent.style.display = 'grid';
            child.style.setProperty('z-index', '100');

            expect(isStackingContext(child)).toEqual([true, 100]);
        });
    });

    describe('overlay z-index resolution', () => {
        test('should accumulate z-index when no stacking contexts', () => {
            root.innerHTML = `
                <div id="container">
                    <div style="z-index: 10">
                        <div style="z-index: 200">
                            <div id="target" style="z-index: 100" />
                        </div>
                    </div>
                </div>
            `;
            const container = root.querySelector<HTMLElement>('#container')!;
            const target = root.querySelector<HTMLElement>('#target')!;
            expect(getOverlayZIndex([target], container)).toBe(200);
        });

        test('should reset at stacking context boundaries', () => {
            root.innerHTML = `
                <div id="container">
                    <div style="position: relative; z-index: 5">        <!-- Relative stacking context -->
                        <div style="z-index: 100">                      <!-- Non-stacking context -->
                            <div id="target" style="z-index: 10" />     <!-- Non-stacking context -->
                        </div>
                    </div>
                </div>
            `;
            const container = root.querySelector<HTMLElement>('#container')!;
            const target = root.querySelector<HTMLElement>('#target')!;
            expect(getOverlayZIndex([target], container)).toBe(5);
        });

        test('should handle flex/grid children with z-index', () => {
            root.innerHTML = `
                <div id="container">
                    <div style="display: flex; z-index: 10">            <!-- Non-stacking context -->
                        <div style="z-index: 200">                      <!-- Flex child stacking context -->
                             <div id="target" style="z-index: 300" />   <!-- Non-stacking context -->
                        </div>
                    </div>
                </div>
            `;
            const container = root.querySelector<HTMLElement>('#container')!;
            const target = root.querySelector<HTMLElement>('#target')!;
            expect(getOverlayZIndex([target], container)).toBe(200);
        });

        test('should handle multiple nested stacking contexts', () => {
            root.innerHTML = `
                <div id="container">
                    <div style="position: relative; z-index: 10">        <!-- Relative stacking context -->
                        <div style="position: absolute; z-index: 50">    <!-- Absolute stacking context -->
                            <div id="target" style="z-index: 25" />      <!-- Non-stacking context -->
                        </div>
                    </div>
                </div>
            `;
            const container = root.querySelector<HTMLElement>('#container')!;
            const target = root.querySelector<HTMLElement>('#target')!;
            expect(getOverlayZIndex([target], container)).toBe(10);
        });

        test('should return max across multiple elements', () => {
            root.innerHTML = `
                <div id="container">
                    <div id="target1" style="z-index: 10"></div>        <!-- Non-stacking context -->
                    <div style="position: relative; z-index: 300">      <!-- Relative stacking context -->
                        <div id="target2" style="z-index: 500" />       <!-- Non-stacking context -->
                    </div>
                    <div style="display: flex">                         <!-- Non-stacking context -->
                        <div id="target3" style="z-index: 1000" />      <!-- Flex child stacking context -->
                    </div>
                </div>
            `;
            const container = root.querySelector<HTMLElement>('#container')!;
            const targets = [
                root.querySelector<HTMLElement>('#target1')!,
                root.querySelector<HTMLElement>('#target2')!,
                root.querySelector<HTMLElement>('#target3')!,
            ];

            expect(getOverlayZIndex(targets, container)).toBe(300);
        });

        test('should handle mixed stacking and non-stacking contexts', () => {
            root.innerHTML = `
                <div id="container">
                    <div style="z-index: 20">                               <!-- Non-stacking context -->
                        <div style="position: relative; z-index: 50">       <!-- Relative stacking context -->
                            <div style="z-index: 999">                      <!-- Non-stacking context -->
                                <div id="target" style="z-index: 888" />    <!-- Non-stacking context -->
                            </div>
                        </div>
                    </div>
                </div>
            `;
            const container = root.querySelector<HTMLElement>('#container')!;
            const target = root.querySelector<HTMLElement>('#target')!;
            expect(getOverlayZIndex([target], container)).toBe(50);
        });

        test('should return 0 for empty array or no z-index', () => {
            expect(getOverlayZIndex([], document.createElement('div'))).toBe(0);

            root.innerHTML = `<div id="container"><div id="target"></div></div>`;
            const container = root.querySelector<HTMLElement>('#container')!;
            const target = root.querySelector<HTMLElement>('#target')!;
            expect(getOverlayZIndex([target], container)).toBe(0);
        });
    });
});
