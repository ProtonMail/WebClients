import { type ReactNode, useId } from 'react';

import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';

import { SkillActionsMenu } from './SkillActionsMenu';

import './SkillListRow.scss';

interface SkillListRowProps {
    /** Left out for rows nested under a skill set, which already shows the icon. */
    icon?: ReactNode;
    name: string;
    /** Short tag after the name, e.g. where the skill came from. */
    badge?: string;
    description?: string;
    enabled: boolean;
    /** The row's switch is off and locked, e.g. a skill inside a turned-off plugin. */
    locked?: boolean;
    onOpen: () => void;
    onEnabledChange: (enabled: boolean) => void;
    onEdit?: () => void;
    onDelete?: () => void;
    /** Controls shown before the switch. */
    actions?: ReactNode;
    /** Rows nested under this one, e.g. the skills of a skill set. */
    children?: ReactNode;
    /** Label of the switch, defaults to turning on this row. */
    toggleTitle?: string;
}

export const SkillListRow = ({
    icon,
    name,
    badge,
    description,
    enabled,
    locked = false,
    onOpen,
    onEnabledChange,
    onEdit,
    onDelete,
    actions,
    children,
    toggleTitle,
}: SkillListRowProps) => {
    const toggleId = useId();

    return (
        <li className="skill-list-row">
            <div className="skill-list-row__row flex flex-nowrap items-center gap-3 py-2">
                <div className="flex flex-nowrap items-center gap-3 flex-1 min-w-0">
                    {icon && (
                        <span className="skill-list-row__icon flex shrink-0 items-center justify-center border radius-8 lumo-color-glyph lumo-bg-control-fill">
                            {icon}
                        </span>
                    )}
                    <div className="flex flex-column flex-nowrap flex-1 min-w-0">
                        <div className="flex flex-nowrap items-center gap-2 min-w-0">
                            <button
                                type="button"
                                className="skill-list-row__name bg-transparent p-0 min-w-0 lumo-title-small text-ellipsis text-left"
                                onClick={onOpen}
                            >
                                {name}
                            </button>
                            {badge && (
                                <span className="skill-list-row__badge py-px px-1.5 lumo-color-glyph-brand-text shrink-0 lumo-label-small">
                                    {badge}
                                </span>
                            )}
                        </div>
                        {description && (
                            <span className="skill-list-row__description lumo-body-small text-ellipsis lumo-color-glyph-mid">
                                {description}
                            </span>
                        )}
                    </div>
                </div>
                {actions}
                <Toggle
                    id={toggleId}
                    checked={enabled && !locked}
                    disabled={locked}
                    className="shrink-0"
                    onChange={() => onEnabledChange(!enabled)}
                    title={toggleTitle ?? c('collider_2025:Action').t`Turn on ${name}`}
                />
                <SkillActionsMenu onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} />
            </div>
            {children}
        </li>
    );
};
