import { act, renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { getArtifactPromptPlaceholders } from '../../../constants/artifactPromptPlaceholders';
import { useArtifactModePlaceholder } from './useArtifactModePlaceholder';

vi.mock('../../../constants/artifactPromptPlaceholders', () => ({
    getArtifactPromptPlaceholders: vi.fn(),
}));

const mockedGetArtifactPromptPlaceholders = getArtifactPromptPlaceholders as Mock;

describe('useArtifactModePlaceholder', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockedGetArtifactPromptPlaceholders.mockReturnValue([
            'Write a professional email declining a meeting',
            'Write a Python script to dedupe a CSV by email',
            'Create a self-contained HTML pomodoro timer',
        ]);
    });

    afterEach(() => {
        vi.useRealTimers();
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
            vi.advanceTimersByTime(5000);
        });

        expect(result.current).toBe('Write a Python script to dedupe a CSV by email');

        act(() => {
            vi.advanceTimersByTime(5000);
        });

        expect(result.current).toBe('Create a self-contained HTML pomodoro timer');
    });

    it('resets to the first example when artifact mode is turned off', () => {
        const { result, rerender } = renderHook(({ isArtifactMode }) => useArtifactModePlaceholder(isArtifactMode), {
            initialProps: { isArtifactMode: true },
        });

        act(() => {
            vi.advanceTimersByTime(5000);
        });

        rerender({ isArtifactMode: false });
        expect(result.current).toBeUndefined();

        rerender({ isArtifactMode: true });
        expect(result.current).toBe('Write a professional email declining a meeting');
    });
});
