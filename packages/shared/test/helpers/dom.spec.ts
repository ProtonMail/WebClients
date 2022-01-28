import { getMaxDepth, hasChildren } from '../../lib/helpers/dom';

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
