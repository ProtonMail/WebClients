import { act, renderHook } from '@testing-library/react';

import { getArtifactPromptPlaceholders } from '../../../constants/artifactPromptPlaceholders';
import { useArtifactModePlaceholder } from './useArtifactModePlaceholder';

jest.mock('../../../constants/artifactPromptPlaceholders', () => ({
    getArtifactPromptPlaceholders: jest.fn(),
}));

const mockedGetArtifactPromptPlaceholders = getArtifactPromptPlaceholders as jest.Mock;

describe('useArtifactModePlaceholder', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockedGetArtifactPromptPlaceholders.mockReturnValue([
            'Write a professional email declining a meeting',
            'Write a Python script to dedupe a CSV by email',
            'Create a self-contained HTML pomodoro timer',
        ]);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('returns undefined when artifact mode is inactive', () => {
        const { result } = renderHook(() => useArtifactModePlaceholder(false));

        expect(result.current).toBeUndefined();
    });

    it('returns the first example when artifact mode is active', () => {
        const { result } = renderHook(() => useArtifactModePlaceholder(true));

        expect(result.current).toBe('Write a professional email declining a meeting');
    });

    it('cycles through examples while artifact mode stays active', () => {
        const { result } = renderHook(() => useArtifactModePlaceholder(true));

        act(() => {
            jest.advanceTimersByTime(5000);
        });

        expect(result.current).toBe('Write a Python script to dedupe a CSV by email');

        act(() => {
            jest.advanceTimersByTime(5000);
        });

        expect(result.current).toBe('Create a self-contained HTML pomodoro timer');
    });

    it('resets to the first example when artifact mode is turned off', () => {
        const { result, rerender } = renderHook(({ isArtifactMode }) => useArtifactModePlaceholder(isArtifactMode), {
            initialProps: { isArtifactMode: true },
        });

        act(() => {
            jest.advanceTimersByTime(5000);
        });

        rerender({ isArtifactMode: false });
        expect(result.current).toBeUndefined();

        rerender({ isArtifactMode: true });
        expect(result.current).toBe('Write a professional email declining a meeting');
    });
});
