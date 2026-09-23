import { fireEvent, render, screen } from '@testing-library/react';

import EditableText from './EditableText';

const openEditor = () => fireEvent.click(screen.getByTitle('Toggle edit'));
const close = () => fireEvent.click(screen.getByTitle('Close'));
const confirm = () => fireEvent.click(screen.getByTitle('Confirm'));
const type = (value: string) => fireEvent.change(screen.getByRole('textbox'), { target: { value } });

describe('EditableText', () => {
    it('submits what was typed', () => {
        const onSubmit = jest.fn();
        render(<EditableText initialText="" onSubmit={onSubmit} />);

        openEditor();
        type('someone@example.com');
        confirm();

        expect(onSubmit).toHaveBeenCalledWith('someone@example.com');
    });

    describe.each([
        ['an empty initial value', ''],
        // The admin user lookup passes userInfo.NotificationEmail straight through, which is null
        // when the user has none.
        ['a null initial value', null as unknown as string],
    ])('with %s', (_label, initialText) => {
        it('discards a draft that was closed instead of confirmed', () => {
            const onSubmit = jest.fn();
            render(<EditableText initialText={initialText} onSubmit={onSubmit} />);

            openEditor();
            type('someone@example.com');
            close();
            openEditor();

            expect(screen.getByRole('textbox')).toHaveValue('');
        });

        it('does not submit a stale draft after reopening the editor', () => {
            const onSubmit = jest.fn();
            render(<EditableText initialText={initialText} onSubmit={onSubmit} />);

            openEditor();
            type('someone@example.com');
            close();
            openEditor();
            confirm();

            expect(onSubmit).toHaveBeenCalledWith('');
        });

        it('submits the address typed after reopening the editor', () => {
            const onSubmit = jest.fn();
            render(<EditableText initialText={initialText} onSubmit={onSubmit} />);

            openEditor();
            type('first@example.com');
            close();
            openEditor();
            type('second@example.com');
            confirm();

            expect(onSubmit).toHaveBeenCalledWith('second@example.com');
        });
    });
});
