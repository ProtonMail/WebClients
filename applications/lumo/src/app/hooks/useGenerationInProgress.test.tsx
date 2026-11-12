import type { KeyboardEvent } from 'react';

import { act, renderHook } from '@testing-library/react';

import { generationRegistry } from '../services/generation/generationRegistry';
import useComposerInput from './useComposerInput';
import { useGenerationInProgress } from './useGenerationInProgress';

jest.mock('@proton/shared/lib/helpers/browser', () => ({ isMobile: () => false }));

afterEach(() => {
    act(() => generationRegistry.abortAll());
});

it('preserves the follow-up draft until Stop finalization releases the generation', () => {
    const send = jest.fn();
    const { result } = renderHook(() => {
        const isGenerating = useGenerationInProgress('chat');
        const input = useComposerInput({ isGenerating, onSubmitCallback: send, content: 'Follow-up question' });
        return { isGenerating, input };
    });
    expect(result.current.isGenerating).toBe(false);
    act(() => {
        generationRegistry.start('chat');
        generationRegistry.abort('chat');
    });
    expect(result.current.isGenerating).toBe(true);
    act(() => {
        result.current.input.handleSubmit();
        result.current.input.handleKeyDown({ key: 'Enter' } as KeyboardEvent<HTMLTextAreaElement>);
    });
    expect(send).not.toHaveBeenCalled();
    expect(result.current.input.value).toBe('Follow-up question');

    act(() => generationRegistry.finish('chat'));
    expect(result.current.isGenerating).toBe(false);
    act(() => result.current.input.handleSubmit());
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith('Follow-up question');
});

it('tracks the selected conversation and releases busy state on teardown', () => {
    generationRegistry.start('first');
    const { result, rerender } = renderHook(({ id }: { id: string | undefined }) => useGenerationInProgress(id), {
        initialProps: { id: 'first' as string | undefined },
    });
    expect(result.current).toBe(true);
    rerender({ id: 'second' });
    expect(result.current).toBe(false);
    act(() => generationRegistry.start('second'));
    expect(result.current).toBe(true);
    act(() => generationRegistry.abortAll());
    expect(result.current).toBe(false);
    rerender({ id: undefined });
    expect(result.current).toBe(false);
});
