import { fireEvent, render, screen } from '@testing-library/react';

import { SkillPickerOptions } from './SkillPickerOptions';

afterEach(() => jest.restoreAllMocks());

it('selects the clicked skill option', () => {
    const commands = [
        { skillId: 'one', handle: 'one', name: 'One', description: 'First description' },
        { skillId: 'two', handle: 'two', name: 'Two', description: 'Second description' },
    ];
    const onSelect = jest.fn();
    render(<SkillPickerOptions id="skills" commands={commands} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('option', { name: 'Two' }));
    expect(onSelect).toHaveBeenCalledWith(commands[1]);
});

it('shows the dark panel only while hovering a row and keeps descriptions accessible without it', () => {
    const reactErrors = jest.spyOn(console, 'error');
    const commands = [
        {
            skillId: 'writing',
            subSkillPath: 'skills/draft',
            handle: 'draft',
            name: 'Draft',
            description: 'Draft a document',
            group: 'Writing',
        },
        {
            skillId: 'writing',
            subSkillPath: 'skills/edit',
            handle: 'edit',
            name: 'Edit',
            description: 'Edit a document',
            group: 'Writing',
        },
    ];
    render(<SkillPickerOptions id="choices" commands={commands} onSelect={jest.fn()} />);
    const draft = screen.getByRole('option', { name: 'Draft' });
    expect(draft).not.toHaveAttribute('title');
    expect(draft).toHaveAttribute('aria-describedby', 'choices-description-0');
    expect(draft).toHaveAccessibleDescription('Draft a document');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.focus(draft);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.mouseEnter(draft);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Draft a document');
    fireEvent.mouseLeave(draft);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    const edit = screen.getByRole('option', { name: 'Edit' });
    fireEvent.mouseEnter(edit);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Edit a document');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Writing');
    fireEvent.click(edit);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(reactErrors.mock.calls.flat().join(' ')).not.toContain('changed size between renders');
});
