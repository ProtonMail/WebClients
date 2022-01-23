import { countAllNodesRecursively, getMaxDepth } from '../../lib/helpers/dom';

describe('countAllNodesRecursively', () => {
    it('should count node', () => {
        expect(countAllNodesRecursively(document.createElement('div'))).toBe(1);
    });

    it('should count node with children', () => {
        expect(countAllNodesRecursively(document.createElement('div').appendChild(document.createElement('div')))).toBe(
            2
        );
    });

    it('should count node with children and grandchildren', () => {
        expect(
            countAllNodesRecursively(
                document
                    .createElement('div')
                    .appendChild(document.createElement('div').appendChild(document.createElement('div')))
            )
        ).toBe(3);
    });
});

describe('getMaxDepth', () => {
    it('should get max depth', () => {
        expect(getMaxDepth(document.createElement('div'))).toBe(1);
    });

    it('should get max depth with children', () => {
        expect(getMaxDepth(document.createElement('div').appendChild(document.createElement('div')))).toBe(2);
    });

    it('should get max depth with children and grandchildren', () => {
        expect(
            getMaxDepth(
                document
                    .createElement('div')
                    .appendChild(document.createElement('div').appendChild(document.createElement('div')))
            )
        ).toBe(3);
    });
});
