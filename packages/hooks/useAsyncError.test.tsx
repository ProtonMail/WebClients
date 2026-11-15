import { Component, type ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';

import useAsyncError from './useAsyncError';

class Boundary extends Component<{ children: ReactNode; onError: (error: Error) => void }, { failed: boolean }> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error: Error) {
        this.props.onError(error);
    }

    render() {
        return this.state.failed ? null : this.props.children;
    }
}

describe('useAsyncError', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return a function', () => {
        const { result } = renderHook(() => useAsyncError());
        expect(typeof result.current).toBe('function');
    });

    it('should not reach the error boundary until called', () => {
        const onError = vi.fn();

        renderHook(() => useAsyncError(), {
            wrapper: ({ children }) => <Boundary onError={onError}>{children}</Boundary>,
        });

        expect(onError).not.toHaveBeenCalled();
    });

    it('should throw the error into the nearest error boundary when called', () => {
        const onError = vi.fn();

        const { result } = renderHook(() => useAsyncError(), {
            wrapper: ({ children }) => <Boundary onError={onError}>{children}</Boundary>,
        });

        act(() => {
            result.current(new Error('Test error'));
        });

        expect(onError).toHaveBeenCalledWith(new Error('Test error'));
    });
});
