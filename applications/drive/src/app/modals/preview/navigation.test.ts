import { describe, expect, it, jest } from '@jest/globals';

import { getNavigation } from './navigation';

describe('getNavigation', () => {
    it('should return undefined when previewableNodeUids is undefined', () => {
        const onNodeChange = jest.fn();
        const result = getNavigation('node1', undefined, onNodeChange);

        expect(result).toBeUndefined();
    });

    it('should return undefined when previewableNodeUids is an empty array', () => {
        const onNodeChange = jest.fn();
        const result = getNavigation('node1', [], onNodeChange);

        expect(result).toBeUndefined();
    });

    it('should return undefined when previewableNodeUids has only one element', () => {
        const onNodeChange = jest.fn();
        const result = getNavigation('node1', ['node1'], onNodeChange);

        expect(result).toBeUndefined();
    });

    it('should return undefined when nodeUid is not in previewableNodeUids', () => {
        const onNodeChange = jest.fn();
        const result = getNavigation('node3', ['node1', 'node2'], onNodeChange);

        expect(result).toBeUndefined();
    });

    describe('when navigation is supported', () => {
        it('should return navigation object with correct currentPosition and totalCount for first node', () => {
            const onNodeChange = jest.fn();
            const previewableNodeUids = ['node1', 'node2', 'node3'];
            const result = getNavigation('node1', previewableNodeUids, onNodeChange);

            expect(result).toBeDefined();
            expect(result?.currentPosition).toBe(1);
            expect(result?.totalCount).toBe(3);
        });

        it('should return navigation object with correct currentPosition and totalCount for middle node', () => {
            const onNodeChange = jest.fn();
            const previewableNodeUids = ['node1', 'node2', 'node3'];
            const result = getNavigation('node2', previewableNodeUids, onNodeChange);

            expect(result).toBeDefined();
            expect(result?.currentPosition).toBe(2);
            expect(result?.totalCount).toBe(3);
        });

        it('should return navigation object with correct currentPosition and totalCount for last node', () => {
            const onNodeChange = jest.fn();
            const previewableNodeUids = ['node1', 'node2', 'node3'];
            const result = getNavigation('node3', previewableNodeUids, onNodeChange);

            expect(result).toBeDefined();
            expect(result?.currentPosition).toBe(3);
            expect(result?.totalCount).toBe(3);
        });

        describe('loadPrevious', () => {
            it('should call onNodeChange with previous node when not at first position', () => {
                const onNodeChange = jest.fn();
                const previewableNodeUids = ['node1', 'node2', 'node3'];
                const result = getNavigation('node2', previewableNodeUids, onNodeChange);

                result?.loadPrevious();

                expect(onNodeChange).toHaveBeenCalledTimes(1);
                expect(onNodeChange).toHaveBeenCalledWith('node1');
            });

            it('should not call onNodeChange when at first position', () => {
                const onNodeChange = jest.fn();
                const previewableNodeUids = ['node1', 'node2', 'node3'];
                const result = getNavigation('node1', previewableNodeUids, onNodeChange);

                result?.loadPrevious();

                expect(onNodeChange).not.toHaveBeenCalled();
            });
        });

        describe('loadNext', () => {
            it('should call onNodeChange with next node when not at last position', () => {
                const onNodeChange = jest.fn();
                const previewableNodeUids = ['node1', 'node2', 'node3'];
                const result = getNavigation('node2', previewableNodeUids, onNodeChange);

                result?.loadNext();

                expect(onNodeChange).toHaveBeenCalledTimes(1);
                expect(onNodeChange).toHaveBeenCalledWith('node3');
            });

            it('should not call onNodeChange when at last position', () => {
                const onNodeChange = jest.fn();
                const previewableNodeUids = ['node1', 'node2', 'node3'];
                const result = getNavigation('node3', previewableNodeUids, onNodeChange);

                result?.loadNext();

                expect(onNodeChange).not.toHaveBeenCalled();
            });
        });
    });
});
