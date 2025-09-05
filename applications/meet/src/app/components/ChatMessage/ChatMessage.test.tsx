import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ChatMessage } from './ChatMessage';

describe('ChatMessage', () => {
    const placeholderText = 'Type an encrypted message...';

    it('renders with correct placeholder text', () => {
        const mockOnMessageSend = vi.fn();
        render(<ChatMessage onMessageSend={mockOnMessageSend} />);

        expect(screen.getByPlaceholderText(placeholderText)).toBeInTheDocument();
    });

    it('starts with empty message', () => {
        const mockOnMessageSend = vi.fn();
        render(<ChatMessage onMessageSend={mockOnMessageSend} />);

        const textarea = screen.getByPlaceholderText(placeholderText);
        expect(textarea).toHaveValue('');
    });

    it('allows user to type in textarea', async () => {
        const mockOnMessageSend = vi.fn();
        const user = userEvent.setup();
        render(<ChatMessage onMessageSend={mockOnMessageSend} />);

        const textarea = screen.getByPlaceholderText(placeholderText);
        await user.type(textarea, 'Hello world');

        expect(textarea).toHaveValue('Hello world');
    });

    it('calls onMessageSend with current message when send button is clicked', async () => {
        const mockOnMessageSend = vi.fn();
        const user = userEvent.setup();
        render(<ChatMessage onMessageSend={mockOnMessageSend} />);

        const textarea = screen.getByPlaceholderText(placeholderText);
        await user.type(textarea, 'Test message');

        const sendButton = screen.getByRole('button', { name: 'Send an encrypted message' });
        await user.click(sendButton);

        expect(mockOnMessageSend).toHaveBeenCalledWith('Test message');
    });

    it('clears message after sending via button click', async () => {
        const mockOnMessageSend = vi.fn();
        const user = userEvent.setup();
        render(<ChatMessage onMessageSend={mockOnMessageSend} />);

        const textarea = screen.getByPlaceholderText(placeholderText);
        await user.type(textarea, 'Test message');

        const sendButton = screen.getByRole('button', { name: 'Send an encrypted message' });
        await user.click(sendButton);

        expect(textarea).toHaveValue('');
    });

    it('disables send button when message is empty or only whitespace', async () => {
        const mockOnMessageSend = vi.fn();
        const user = userEvent.setup();
        render(<ChatMessage onMessageSend={mockOnMessageSend} />);

        const sendButton = screen.getByRole('button', { name: 'Send an encrypted message' });

        expect(sendButton).toBeDisabled();

        const textarea = screen.getByPlaceholderText(placeholderText);
        await user.type(textarea, '   ');
        expect(sendButton).toBeDisabled();

        await user.clear(textarea);
        await user.type(textarea, 'Hello');
        expect(sendButton).toBeEnabled();
    });

    it('calls onMessageSend when Enter key is pressed without Shift', async () => {
        const mockOnMessageSend = vi.fn();
        const user = userEvent.setup();
        render(<ChatMessage onMessageSend={mockOnMessageSend} />);

        const textarea = screen.getByPlaceholderText(placeholderText);
        await user.type(textarea, 'Test message');
        await user.keyboard('{Enter}');

        expect(mockOnMessageSend).toHaveBeenCalledWith('Test message');

        expect(textarea).toHaveValue('');
    });

    it('does not call onMessageSend when Shift+Enter is pressed', async () => {
        const mockOnMessageSend = vi.fn();
        const user = userEvent.setup();
        render(<ChatMessage onMessageSend={mockOnMessageSend} />);

        const textarea = screen.getByPlaceholderText(placeholderText) as HTMLTextAreaElement;
        await user.type(textarea, 'Test message');
        await user.keyboard('{Shift>}{Enter}{/Shift}');

        expect(mockOnMessageSend).not.toHaveBeenCalled();
        expect(textarea.value.trim()).toBe('Test message');
    });

    it('handles multiline messages with Shift+Enter', async () => {
        const mockOnMessageSend = vi.fn();
        const user = userEvent.setup();
        render(<ChatMessage onMessageSend={mockOnMessageSend} />);

        const textarea = screen.getByPlaceholderText(placeholderText);
        await user.type(textarea, 'Line 1');
        await user.keyboard('{Shift>}{Enter}{/Shift}');
        await user.type(textarea, 'Line 2');

        expect(mockOnMessageSend).not.toHaveBeenCalled();

        expect(textarea).toHaveValue('Line 1\nLine 2');

        const sendButton = screen.getByRole('button', { name: 'Send an encrypted message' });
        await user.click(sendButton);

        expect(mockOnMessageSend).toHaveBeenCalledWith('Line 1\nLine 2');
    });

    it('maintains focus on textarea after sending message via Enter', async () => {
        const mockOnMessageSend = vi.fn();
        const user = userEvent.setup();
        render(<ChatMessage onMessageSend={mockOnMessageSend} />);

        const textarea = screen.getByPlaceholderText(placeholderText);
        await user.type(textarea, 'Test');
        await user.keyboard('{Enter}');

        // The component should refocus the textarea after sending
        expect(textarea).toHaveFocus();
    });

    it('does not send empty or whitespace-only messages via Enter', async () => {
        const mockOnMessageSend = vi.fn();
        const user = userEvent.setup();
        render(<ChatMessage onMessageSend={mockOnMessageSend} />);

        const textarea = screen.getByPlaceholderText(placeholderText);

        // Try to send empty message
        await user.keyboard('{Enter}');
        expect(mockOnMessageSend).not.toHaveBeenCalled();

        // Try to send whitespace-only message
        await user.type(textarea, '   ');
        await user.keyboard('{Enter}');
        expect(mockOnMessageSend).not.toHaveBeenCalled();
    });
});
