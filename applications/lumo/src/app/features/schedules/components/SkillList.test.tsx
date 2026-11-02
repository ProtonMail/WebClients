import { MemoryRouter } from 'react-router-dom';

import { fireEvent, render, screen } from '@testing-library/react';

import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { useLumoDispatch } from '../../../redux/hooks';
import type { Skill } from '../../skills/types';
import { useSkills } from '../../skills/useSkills';
import { SkillList } from './SkillList';

jest.mock('../../../hooks/useLumoFlags', () => ({ useLumoFlags: jest.fn() }));
jest.mock('../../../redux/hooks', () => ({ useLumoDispatch: jest.fn() }));
jest.mock('../../skills/useSkills', () => ({ useSkills: jest.fn() }));

const skill = {
    id: 'brief',
    name: 'Brief writer',
    instructions: 'Write a brief',
    description: 'Creates concise daily briefs.',
    enabled: true,
} as Skill;

beforeEach(() => {
    jest.mocked(useLumoFlags).mockReturnValue({ customAgents: true } as ReturnType<typeof useLumoFlags>);
    jest.mocked(useLumoDispatch).mockReturnValue(jest.fn());
    jest.mocked(useSkills).mockReturnValue({ status: 'ready', skills: [skill] });
});

it('keeps deleted skills visible and removable, passing only IDs', () => {
    const onChange = jest.fn();
    render(
        <MemoryRouter>
            <SkillList value={['brief', 'deleted']} onChange={onChange} />
        </MemoryRouter>
    );
    expect(screen.getByLabelText('Unavailable skill: Skill unavailable')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Unavailable skill' }));
    expect(onChange).toHaveBeenCalledWith(['brief']);
    expect(screen.getByText(/Some selected skills are unavailable/)).toBeVisible();
});

it.each(['hover', 'focus'])('shows descriptions on %s', async (interaction) => {
    render(
        <MemoryRouter>
            <SkillList value={['brief']} />
        </MemoryRouter>
    );
    if (interaction === 'focus') fireEvent.focus(screen.getByLabelText('Brief writer'));
    else fireEvent.mouseOver(screen.getByLabelText('Brief writer'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(skill.description);
});

it('shows a retry action for loading errors without losing selections', () => {
    jest.mocked(useSkills).mockReturnValue({ status: 'error', skills: [skill] });
    render(
        <MemoryRouter>
            <SkillList value={['brief']} onChange={jest.fn()} />
        </MemoryRouter>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load skills');
    expect(screen.getByRole('button', { name: 'Remove Brief writer' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(useLumoDispatch()).toHaveBeenCalled();
});

it('groups sub-skills, searches their descriptions, and saves only the selected reference', () => {
    HTMLElement.prototype.scrollIntoView = jest.fn();
    const plugin = {
        ...skill,
        id: 'writing',
        name: 'Writing',
        description: 'Write clear documents.',
        instructions: '',
        subSkills: [
            { path: 'skills/draft', name: 'Draft', description: 'Draft clear documents', enabled: true },
            { path: 'skills/edit', name: 'Edit', description: 'Edit a document', enabled: true },
        ],
    };
    jest.mocked(useSkills).mockReturnValue({ status: 'ready', skills: [plugin, { ...skill, id: 'brief' }] });
    const onChange = jest.fn();
    render(
        <MemoryRouter>
            <SkillList value={[]} onChange={onChange} />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add skill' }));
    expect(screen.getByText('Writing')).toBeVisible();
    expect(screen.queryByRole('option', { name: 'Writing' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Draft' })).toBeVisible();
    const search = screen.getByRole('textbox', { name: 'Search skills' });
    fireEvent.click(search);
    fireEvent.change(search, { target: { value: 'documents' } });
    expect(screen.queryByRole('option', { name: 'Brief writer' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: 'Draft' }));
    expect(onChange).toHaveBeenCalledWith(['writing/skills/draft']);
});

it('keeps disabled sub-skills visible and removable using current bundle metadata', () => {
    const plugin = {
        ...skill,
        id: 'writing',
        name: 'Writing',
        instructions: '',
        subSkills: [{ path: 'skills/draft', name: 'Draft', description: 'Draft documents', enabled: false }],
    };
    jest.mocked(useSkills).mockReturnValue({ status: 'ready', skills: [plugin] });
    const onChange = jest.fn();
    render(
        <MemoryRouter>
            <SkillList value={['writing/skills/draft']} onChange={onChange} />
        </MemoryRouter>
    );
    expect(screen.getByLabelText('Draft: Skill unavailable')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Draft' }));
    expect(onChange).toHaveBeenCalledWith([]);
});

it.each(['idle', 'loading'] as const)('keeps saved selections removable while skills are %s', (status) => {
    jest.mocked(useSkills).mockReturnValue({ status, skills: [skill] });
    const onChange = jest.fn();
    render(
        <MemoryRouter>
            <SkillList value={['brief']} onChange={onChange} />
        </MemoryRouter>
    );
    expect(screen.getByText('Loading skills')).toBeVisible();
    expect(screen.queryByText(/Some selected skills are unavailable/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add skill' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Brief writer' }));
    expect(onChange).toHaveBeenCalledWith([]);
});

it('uses the same handle winner as runtime for the name-sorted skills list', () => {
    const canonical = { ...skill, id: 'canonical', name: 'Weekly Report' };
    const other = { ...skill, id: 'other', name: 'Weekly-Report' };
    jest.mocked(useSkills).mockReturnValue({ status: 'ready', skills: [canonical, other] });
    render(
        <MemoryRouter>
            <SkillList value={[]} onChange={jest.fn()} />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add skill' }));
    expect(screen.getByRole('option', { name: 'Weekly Report' })).toBeVisible();
    expect(screen.queryByRole('option', { name: 'Weekly-Report' })).not.toBeInTheDocument();
});

it('distinguishes all-selected skills from an empty skills store', () => {
    render(
        <MemoryRouter>
            <SkillList value={['brief']} onChange={jest.fn()} />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add skill' }));
    expect(screen.getByText('All available skills are added.')).toBeVisible();
    expect(screen.queryByText('No skills available yet. Manage skills to add or enable them.')).not.toBeInTheDocument();
});

it('keeps the setup hint for an empty skills store', () => {
    jest.mocked(useSkills).mockReturnValue({ status: 'ready', skills: [] });
    render(
        <MemoryRouter>
            <SkillList value={[]} onChange={jest.fn()} />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add skill' }));
    expect(screen.getByText('No skills available yet. Manage skills to add or enable them.')).toBeVisible();
});
