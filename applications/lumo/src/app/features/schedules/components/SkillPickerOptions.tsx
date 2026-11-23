import { Fragment, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Popper } from '@proton/atoms/Popper/Popper';
import { usePopper } from '@proton/atoms/Popper/usePopper';
import { Scroll } from '@proton/atoms/Scroll/Scroll';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import type { SkillCommand } from '../../skills/skillInvocation';
import { getSkillSelectionId } from '../../skills/skillSelection';

interface SkillPickerOptionsProps {
    /** Available skill and sub-skill commands, ordered by group for display. */
    commands: SkillCommand[];
    /** Called when a skill or sub-skill option is selected. */
    onSelect: (command: SkillCommand) => void;
    /** Unique listbox ID, also used to link options to their descriptions. */
    id: string;
}

export const SkillPickerOptions = ({ commands, onSelect, id }: SkillPickerOptionsProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [hoveredId, setHoveredId] = useState<string>();
    const hovered = commands.find((command) => getSkillSelectionId(command) === hoveredId);
    const descriptionId = `${id}-description`;
    const { floating, position } = usePopper({
        reference: { mode: 'element', value: scrollRef.current },
        isOpen: !!hovered?.description,
        originalPlacement: 'right-start',
        availablePlacements: ['right-start', 'left-start', 'bottom-start', 'top-start'],
        offset: 8,
    });

    return (
        <>
            {/* Listbox view for the skill picker options */}
            <Scroll
                className="flex-auto min-h-0 max-h-custom overflow-hidden"
                style={{ '--max-h-custom': '20rem' }}
                customContainerRef={scrollRef}
                scrollContained
            >
                <div
                    id={id}
                    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                    role="listbox"
                    aria-label={
                        // translator: Heading or accessible list name for skills and sub-skills in the scheduled task editor or side panel.
                        c('collider_2025:Label').t`Skills`
                    }
                    className="pb-1"
                >
                    {commands.map((command, index) => (
                        <Fragment key={getSkillSelectionId(command)}>
                            {command.group && command.group !== commands[index - 1]?.group && (
                                <div
                                    className={clsx(
                                        'px-3 pt-2 pb-1 lumo-body-small lumo-color-glyph-mid',
                                        index > 0 && 'mt-1 border-top lumo-border'
                                    )}
                                >
                                    {command.group}
                                </div>
                            )}
                            <DropdownMenuButton
                                // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                                role="option"
                                aria-selected={false}
                                aria-label={command.name}
                                aria-describedby={command.description ? `${descriptionId}-${index}` : undefined}
                                className="flex flex-nowrap items-center gap-2 radius-8 text-left"
                                onClick={() => {
                                    setHoveredId(undefined);
                                    onSelect(command);
                                }}
                                onMouseEnter={() => {
                                    setHoveredId(getSkillSelectionId(command));
                                }}
                                onMouseLeave={() => setHoveredId(undefined)}
                            >
                                <LumoIcon aria-hidden className="shrink-0" name="ScrollText" size={16} />
                                <span className="text-ellipsis">{command.name}</span>
                                {command.description && (
                                    <span id={`${descriptionId}-${index}`} className="sr-only">
                                        {command.description}
                                    </span>
                                )}
                            </DropdownMenuButton>
                        </Fragment>
                    ))}
                </div>
            </Scroll>

            {/* Popper view for the skill description */}
            <Popper
                id={`${id}-preview`}
                divRef={floating}
                isOpen={!!hovered?.description}
                className="schedule-skill-picker__description lumo-bg-panel-inverse py-2.5 px-3 radius-8 lumo-body-small lumo-color-glyph-inverse pointer-events-none"
                style={{ position: 'fixed', top: position.top, left: position.left }}
            >
                <p className="m-0">{hovered?.description}</p>
                {hovered?.group && <p className="m-0 mt-1 lumo-body-small opacity-70">{hovered.group}</p>}
            </Popper>
        </>
    );
};
