import { renderHook } from '@testing-library/react-hooks';

import { NodeType } from '@proton/drive';
import { UploadConflictStrategy, UploadConflictType } from '@proton/drive/modules/upload';

import { useUploadConflictModalState } from './useUploadConflictModalState';

describe('useUploadConflictModalState', () => {
    const mockOnResolve = jest.fn();
    const mockOnClose = jest.fn();
    const mockOnExit = jest.fn();

    const defaultProps = {
        name: 'test-file.txt',
        nodeType: NodeType.File,
        conflictType: UploadConflictType.Normal,
        onResolve: mockOnResolve,
        onClose: mockOnClose,
        onExit: mockOnExit,
        open: true,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should pass through modal props', () => {
        const { result } = renderHook((props) => useUploadConflictModalState(props), {
            initialProps: defaultProps,
        });

        expect(result.current.open).toBe(true);
        expect(result.current.onClose).toBe(mockOnClose);
        expect(result.current.onExit).toBe(mockOnExit);
        expect(result.current.name).toBe('test-file.txt');
        expect(result.current.nodeType).toBe(NodeType.File);
        expect(result.current.conflictType).toBe(UploadConflictType.Normal);
    });

    it('should call onResolve with correct strategy and applyAll flag', () => {
        const { result } = renderHook(() => useUploadConflictModalState(defaultProps));

        result.current.onResolve(UploadConflictStrategy.Replace, false);
        expect(mockOnResolve).toHaveBeenCalledWith(UploadConflictStrategy.Replace, false);

        result.current.onResolve(UploadConflictStrategy.Rename, true);
        expect(mockOnResolve).toHaveBeenCalledWith(UploadConflictStrategy.Rename, true);

        result.current.onResolve(UploadConflictStrategy.Skip, false);
        expect(mockOnResolve).toHaveBeenCalledWith(UploadConflictStrategy.Skip, false);
    });

    it('should call onResolve with Skip and applyAll true when onCancelAll is called', () => {
        const { result } = renderHook(() => useUploadConflictModalState(defaultProps));

        result.current.onCancelAll();

        expect(mockOnResolve).toHaveBeenCalledWith(UploadConflictStrategy.Skip, true);
    });
});
