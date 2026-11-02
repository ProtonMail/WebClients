import type { Ref } from 'react';
import { useId, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Input } from '@proton/atoms/Input/Input';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import type { SkillCommand } from '../../skills/skillInvocation';
import { getSkillSelectionId } from '../../skills/skillSelection';
import { SkillPickerOptions } from './SkillPickerOptions';

import './ChipList.scss';
import './SkillList.scss';

interface SkillListReadyViewProps {
    /** Available commands, with sub-skills already grouped by bundle. */
    commands: SkillCommand[];
    /** Selected references to exclude from the picker. */
    value: string[];
    /** Receives the updated selection after adding a command. */
    onChange: (ids: string[]) => void;
    /** Add button ref used to restore focus after removing a selected chip. */
    buttonRef: Ref<HTMLButtonElement>;
}

export const SkillListReadyView = ({ commands, value, onChange, buttonRef }: SkillListReadyViewProps) => {
    const history = useHistory();
    const pickerId = useId();
    const [query, setQuery] = useState('');
    // Keep selected commands out of the picker; search names, descriptions and bundle names.
    const unselectedCommands = commands.filter((command) => !value.includes(getSkillSelectionId(command)));
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const matchingCommands = unselectedCommands.filter(({ name, description, group }) =>
        `${name} ${description} ${group ?? ''}`.toLocaleLowerCase().includes(normalizedQuery)
    );

    // translator: Empty picker when every enabled skill or sub-skill has already been added to this scheduled task.
    const allAddedLabel = c('collider_2025:Info').t`All available skills are added.`;
    // translator: Empty skill picker when no enabled skills or sub-skills exist; Manage skills opens Customize.
    const noSkillsLabel = c('collider_2025:Info').t`No skills available yet. Manage skills to add or enable them.`;

    return (
        <SimpleDropdown
            as="button"
            type="button"
            ref={buttonRef}
            hasCaret={false}
            className="schedule-chip-list__add-chip schedule-chip-list__add-chip--regular button-ghost-norm inline-flex flex-nowrap shrink-0 items-center border border-dashed rounded cursor-pointer interactive interactive--no-background gap-1.5"
            dropdownSize={{ width: '20em', maxWidth: '20em' }}
            dropdownClassName="schedule-skill-picker"
            onToggle={(open: boolean) => {
                if (open) {
                    setQuery('');
                }
            }}
            content={
                <>
                    <LumoIcon aria-hidden name="Plus" size={14} />
                    <span>{
                        // translator: Button opening the scheduled task skill picker; choices can be skills or individual sub-skills.
                        c('collider_2025:Action').t`Add skill`
                    }</span>
                </>
            }
        >
            <div className="flex flex-column flex-nowrap flex-auto w-full min-h-0">
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                <div className="shrink-0 w-full px-4 py-2" onClick={(event) => event.stopPropagation()}>
                    <Input
                        className="w-full"
                        value={query}
                        onValue={setQuery}
                        placeholder={
                            // translator: Search field in the scheduled task skill picker; matches skill names, descriptions and bundle names.
                            c('collider_2025:Placeholder').t`Search skills`
                        }
                        aria-label={
                            // translator: Search field in the scheduled task skill picker; matches skill names, descriptions and bundle names.
                            c('collider_2025:Label').t`Search skills`
                        }
                        prefix={<LumoIcon aria-hidden name="Search" size={16} className="color-hint" />}
                    />
                </div>
                {matchingCommands.length > 0 && (
                    <SkillPickerOptions
                        id={pickerId}
                        commands={matchingCommands}
                        onSelect={(command) => onChange([...value, getSkillSelectionId(command)])}
                    />
                )}
                {!matchingCommands.length && normalizedQuery && (
                    <p className="px-4 py-2 m-0 text-sm color-weak">{
                        // translator: Empty search result in the scheduled task skill picker.
                        c('collider_2025:Info').t`No matching skills`
                    }</p>
                )}
                {!unselectedCommands.length && !normalizedQuery && (
                    <div className="px-4 py-2 text-sm color-weak">
                        {commands.length ? allAddedLabel : noSkillsLabel}
                    </div>
                )}
                <DropdownMenu className="shrink-0">
                    <hr className="mx-3 mb-1" />
                    <DropdownMenuButton
                        className="flex flex-nowrap items-center gap-2 text-left"
                        onClick={() => history.push('/customize')}
                    >
                        <LumoIcon aria-hidden className="shrink-0" name="Settings" size={16} />
                        <span>{
                            // translator: Footer action opening Customize to create, enable or manage skills.
                            c('collider_2025:Action').t`Manage skills`
                        }</span>
                    </DropdownMenuButton>
                </DropdownMenu>
            </div>
        </SimpleDropdown>
    );
};
