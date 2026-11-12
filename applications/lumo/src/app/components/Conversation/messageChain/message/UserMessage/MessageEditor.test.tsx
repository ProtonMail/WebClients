import { act, fireEvent, render, screen } from '@testing-library/react';

import { useGenerationInProgress } from '../../../../../hooks/useGenerationInProgress';
import { generationRegistry } from '../../../../../services/generation/generationRegistry';
import MessageEditor from './MessageEditor';

jest.mock('../../../../../hooks/useChatLimitGate', () => ({ useChatLimitGate: () => ({ isBlocked: false }) }));

afterEach(() => {
    act(() => generationRegistry.abortAll());
});

it('keeps an edited draft until stopped generation cleanup finishes', () => {
    const edit = jest.fn();
    const Editor = () => {
        const isGenerating = useGenerationInProgress('chat');
        return (
            <MessageEditor
                messageContent="Original"
                handleEditMessage={edit}
                handleCancel={jest.fn()}
                isGenerating={isGenerating}
            />
        );
    };
    render(<Editor />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Edited question' } });
    act(() => {
        generationRegistry.start('chat');
        generationRegistry.abort('chat');
    });
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    fireEvent.keyDown(textarea, { key: 'Enter' });
    expect(edit).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('Edited question');
    act(() => generationRegistry.finish('chat'));
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(edit).toHaveBeenCalledTimes(1);
    expect(edit).toHaveBeenCalledWith('Edited question');
});
