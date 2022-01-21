import { countAllNodesRecursively } from '../../lib/helpers/dom';

describe('countAllNodesRecursively', () => {
    it('should count node', () => {
        expect(countAllNodesRecursively(document.createElement('div'))).toBe(1);
    });
});
