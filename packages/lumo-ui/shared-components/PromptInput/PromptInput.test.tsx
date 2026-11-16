import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import PromptInput from './PromptInput';

describe('PromptInput', () => {
    it('submits on Enter when there is trimmed content', () => {
        const onSubmit = vi.fn();
        render(<PromptInput value="hello" onChange={vi.fn()} onSubmit={onSubmit} />);

        fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('does not submit on Shift+Enter', () => {
        const onSubmit = vi.fn();
        render(<PromptInput value="hello" onChange={vi.fn()} onSubmit={onSubmit} />);

        fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', shiftKey: true });
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does not submit blank input', () => {
        const onSubmit = vi.fn();
        render(<PromptInput value="   " onChange={vi.fn()} onSubmit={onSubmit} />);

        fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows a stop button while busy and reports stop', () => {
        const onStop = vi.fn();
        render(<PromptInput value="hello" onChange={vi.fn()} onSubmit={vi.fn()} onStop={onStop} isGenerating />);

        fireEvent.click(screen.getByRole('button'));
        expect(onStop).toHaveBeenCalledTimes(1);
    });
});
