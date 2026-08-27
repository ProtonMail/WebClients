import { getMaxDepth, getScrollParent, hasChildren } from '../../lib/helpers/dom';

describe('hasChildren', () => {
    it('should return false for text node', () => {
        expect(hasChildren(document.createTextNode('text'))).toBe(false);
    });

    it('should return false for element', () => {
        expect(hasChildren(document.createElement('div'))).toBe(false);
    });

    it('should return true for element with children', () => {
        const div = document.createElement('div');
        div.appendChild(document.createElement('div'));
        expect(hasChildren(div)).toBe(true);
    });
});

describe('getMaxDepth', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="parent">
                <div id="child">
                    <div id="grandchild">
                        <div id="greatgrandchild">
                        </div>
                    </div>
                </div>
                <div></div>
            </div>
        `;
    });

    it('should return 1 for text node', () => {
        expect(getMaxDepth(document.createTextNode('text'))).toBe(1);
    });

    it('should return 1 for element', () => {
        expect(getMaxDepth(document.createElement('div'))).toBe(1);
    });

    it('should return 4 for parent with children', () => {
        const div = document.getElementById('parent');
        expect(getMaxDepth(div as HTMLDivElement)).toBe(4);
    });

    it('should return 3 for element with children', () => {
        const div = document.getElementById('child');
        expect(getMaxDepth(div as HTMLDivElement)).toBe(3);
    });

    it('should return 2 for element with grandchildren', () => {
        const div = document.getElementById('grandchild');
        expect(getMaxDepth(div as HTMLDivElement)).toBe(2);
    });

    it('should return 1 for element with greatgrandchildren', () => {
        const div = document.getElementById('greatgrandchild');
        expect(getMaxDepth(div as HTMLDivElement)).toBe(1);
    });
});

describe('getScrollParent', () => {
    // Nothing in the test DOM has a size, so overflow has to be faked.
    const makeScrollable = (element: HTMLElement) => {
        Object.defineProperty(element, 'scrollHeight', { value: 200, configurable: true });
        Object.defineProperty(element, 'clientHeight', { value: 100, configurable: true });
    };

    const makeScrollableHorizontally = (element: HTMLElement) => {
        Object.defineProperty(element, 'scrollWidth', { value: 200, configurable: true });
        Object.defineProperty(element, 'clientWidth', { value: 100, configurable: true });
    };

    const getElementById = (id: string) => document.getElementById(id) as HTMLElement;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="scroller" style="overflow: auto">
                <div id="wrapper" style="overflow: auto">
                    <div id="target"></div>
                </div>
            </div>
        `;
    });

    it('should skip an overflow ancestor that does not actually scroll', () => {
        makeScrollable(getElementById('scroller'));

        expect(getScrollParent(getElementById('target'))).toBe(getElementById('scroller'));
    });

    it('should return the nearest ancestor that scrolls', () => {
        makeScrollable(getElementById('scroller'));
        makeScrollable(getElementById('wrapper'));

        expect(getScrollParent(getElementById('target'))).toBe(getElementById('wrapper'));
    });

    it('should skip an ancestor that only scrolls horizontally', () => {
        makeScrollableHorizontally(getElementById('wrapper'));
        makeScrollable(getElementById('scroller'));

        expect(getScrollParent(getElementById('target'))).toBe(getElementById('scroller'));
    });

    it('should return the nearest ancestor that could scroll when nothing overflows yet', () => {
        expect(getScrollParent(getElementById('target'))).toBe(getElementById('wrapper'));
    });

    it('should prefer an ancestor scrolling horizontally over one that only could scroll', () => {
        makeScrollableHorizontally(getElementById('scroller'));

        expect(getScrollParent(getElementById('target'))).toBe(getElementById('scroller'));
    });

    it('should fall back to the scrolling root without any overflow ancestor', () => {
        document.body.innerHTML = `<div><div id="target"></div></div>`;

        expect(getScrollParent(getElementById('target'))).toBe(document.scrollingElement);
    });

    it('should fall back to the scrolling root without an element', () => {
        expect(getScrollParent(null)).toBe(document.scrollingElement);
    });
});
