import { Fragment, useEffect, useRef } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import type { SkillCommand } from '../../features/skills/skillInvocation';
import { LumoIcon } from '../LumoIcon/LumoIcon';
import type { SkillCommandState } from './hooks/useSkillCommandAutocomplete';

import './SkillCommandMenu.scss';

const MAX_MENU_HEIGHT = 320;
const ROW_HEIGHT = 32;
const GROUP_HEADER_HEIGHT = 28;

interface SkillCommandMenuProps {
    state: SkillCommandState;
    commands: SkillCommand[];
    selectedIndex: number;
    setSelectedIndex: (index: number) => void;
    onSelect: (command: SkillCommand) => void;
}

export const SkillCommandMenu = ({ state, commands, selectedIndex, setSelectedIndex, onSelect }: SkillCommandMenuProps) => {
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        listRef.current
            ?.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`)
            ?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    if (!state.isActive || !state.position || commands.length === 0) {
        return null;
    }

    const groupCount = new Set(commands.map((command) => command.group ?? '')).size;
    const estimatedHeight = Math.min(commands.length * ROW_HEIGHT + groupCount * GROUP_HEADER_HEIGHT + 8, MAX_MENU_HEIGHT);
    const top = Math.max(8, state.position.top - estimatedHeight - 8);
    const selected = commands[selectedIndex];

    return (
        <div className="skill-command-menu fixed z-[60] flex flex-nowrap items-start gap-2" style={{ top, left: state.position.left }}>
            <div
                ref={listRef}
                role="listbox"
                id="skill-command-menu"
                aria-label={c('collider_2025:Label').t`Skills`}
                className="skill-command-menu__list bg-norm border border-weak rounded-xl shadow-lifted"
                style={{ maxHeight: MAX_MENU_HEIGHT }}
            >
                {commands.map((command, index) => {
                    const startsGroup = index === 0 || commands[index - 1].group !== command.group;
                    return (
                        <Fragment key={`${command.skillId}-${command.handle}`}>
                            {startsGroup && command.group && (
                                <div className={clsx('skill-command-menu__group color-weak text-ellipsis', index > 0 && 'has-separator')}>
                                    {command.group}
                                </div>
                            )}
                            <button
                                type="button"
                                role="option"
                                data-index={index}
                                aria-selected={index === selectedIndex}
                                className={clsx(
                                    'skill-command-menu__option flex-nowrap items-center gap-2 text-left',
                                    index === selectedIndex && 'is-selected'
                                )}
                                // Keep focus in the textarea so the cursor position survives the click.
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => onSelect(command)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <LumoIcon name="ScrollText" size={14} className="shrink-0 color-weak" />
                                <span className="text-ellipsis">{command.handle}</span>
                            </button>
                        </Fragment>
                    );
                })}
            </div>
            {selected?.description && (
                <div className="skill-command-menu__detail" aria-hidden>
                    <p className="m-0">{selected.description}</p>
                    {selected.group && <p className="m-0 mt-1 text-xs opacity-70">{selected.group}</p>}
                </div>
            )}
        </div>
    );
};
