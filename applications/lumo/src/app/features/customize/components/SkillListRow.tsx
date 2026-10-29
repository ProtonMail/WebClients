import { type ReactNode, useId } from 'react';

import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';

import { SkillActionsMenu } from './SkillActionsMenu';

import './SkillListRow.scss';

interface SkillListRowProps {
    icon: ReactNode;
    name: string;
    description?: string;
    enabled: boolean;
    /** The row's switch is off and locked, e.g. a skill inside a turned-off plugin. */
    locked?: boolean;
    onOpen: () => void;
    onEnabledChange: (enabled: boolean) => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

export const SkillListRow = ({
    icon,
    name,
    description,
    enabled,
    locked = false,
    onOpen,
    onEnabledChange,
    onEdit,
    onDelete,
}: SkillListRowProps) => {
    const toggleId = useId();

    return (
        <li className="skill-list-row flex flex-nowrap items-center gap-3">
            <button
                type="button"
                className="skill-list-row__main flex flex-nowrap items-center gap-3 flex-1 min-w-0 text-left"
                onClick={onOpen}
            >
                <span className="skill-list-row__icon flex shrink-0 items-center justify-center">{icon}</span>
                <span className="flex flex-column flex-nowrap flex-1 min-w-0">
                    <span className="skill-list-row__name text-ellipsis">{name}</span>
                    {description && <span className="skill-list-row__description text-ellipsis">{description}</span>}
                </span>
            </button>
            <Toggle
                id={toggleId}
                checked={enabled && !locked}
                disabled={locked}
                className="shrink-0"
                onChange={() => onEnabledChange(!enabled)}
                title={c('collider_2025:Action').t`Turn on ${name}`}
            />
            {onEdit && onDelete ? (
                <SkillActionsMenu onEdit={onEdit} onDelete={onDelete} />
            ) : (
                <span className="skill-actions-menu__placeholder shrink-0" aria-hidden />
            )}
        </li>
    );
};
