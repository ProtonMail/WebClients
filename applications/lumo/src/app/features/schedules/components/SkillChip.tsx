import { useHistory } from 'react-router-dom';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { useLumoFlags } from '../../../hooks/useLumoFlags';
import type { Skill } from '../../skills/types';

import './Chip.scss';

interface SkillChipProps {
    /** Current store metadata; absent when a saved selection cannot be resolved. */
    skill?: Pick<Skill, 'name' | 'description'>;
    /** Localized loading or unavailable status, also included in the description tooltip. */
    statusLabel?: string;
    /** Shows the unavailable icon and colors once loading has finished. */
    unavailable: boolean;
    /** Renders a side-panel row with an actions menu instead of a chip. */
    rows?: boolean;
    /** Removes this reference from the task without deleting the skill. */
    onRemove?: () => void;
}

export const SkillChip = ({ skill, statusLabel, unavailable, rows, onRemove }: SkillChipProps) => {
    const history = useHistory();
    const { customize } = useLumoFlags();
    // translator: Fallback chip label for a skill that was deleted or could not be decrypted.
    const label = skill?.name ?? c('collider_2025:Label').t`Unavailable skill`;
    // translator: Type label below a selected skill name in the task side panel, distinguishing it from an external connector.
    const typeLabel = c('collider_2025:Label').t`Skill`;

    return (
        <span
            className={clsx(
                rows
                    ? 'flex flex-nowrap items-center gap-3 py-2'
                    : clsx(
                          'schedule-chip schedule-chip--regular inline-flex flex-nowrap shrink-0 items-center gap-1.5 max-w-full border rounded',
                          onRemove && 'pr-1.5'
                      ),
                unavailable && (rows ? 'color-danger' : 'schedule-chip--unavailable')
            )}
        >
            <Tooltip
                openDelay={300}
                title={[skill?.description, statusLabel].filter(Boolean).join('\n\n') || undefined}
            >
                <span
                    className={clsx(
                        'inline-flex flex-nowrap items-center',
                        rows ? 'flex-1 min-w-0 gap-3' : 'min-w-0 gap-1.5'
                    )}
                    aria-label={statusLabel ? `${label}: ${statusLabel}` : label}
                >
                    <span className={clsx('inline-flex shrink-0', rows && 'p-2 rounded bg-weak')}>
                        {unavailable ? (
                            <LumoIcon
                                aria-hidden
                                name="CircleSlash"
                                color="var(--signal-danger-major-2)"
                                size={rows ? 16 : 14}
                                strokeWidth={2.5}
                            />
                        ) : (
                            <LumoIcon aria-hidden name="ScrollText" size={rows ? 16 : 14} />
                        )}
                    </span>
                    <span className="min-w-0">
                        <span
                            className={
                                rows ? 'block text-semibold text-ellipsis' : 'schedule-chip__label block text-ellipsis'
                            }
                        >
                            {label}
                        </span>
                        {rows && <span className="block text-sm color-weak">{statusLabel ?? typeLabel}</span>}
                    </span>
                </span>
            </Tooltip>

            {rows && onRemove ? (
                <SimpleDropdown
                    as="button"
                    type="button"
                    hasCaret={false}
                    content={<LumoIcon aria-hidden name="Ellipsis" size={16} />}
                    aria-label={
                        // translator: Accessible label for an actions menu in the scheduled task side panel. ${label} is the selected skill, sub-skill or connector name.
                        c('collider_2025:Action').t`Actions for ${label}`
                    }
                >
                    <DropdownMenu>
                        {customize && (
                            <DropdownMenuButton
                                className="flex flex-nowrap items-center gap-2 text-left"
                                onClick={() => history.push('/customize')}
                            >
                                <LumoIcon aria-hidden className="shrink-0" name="ExternalLink" size={16} />
                                <span>{
                                    // translator: Menu item opening Customize to manage skills used by a scheduled task.
                                    c('collider_2025:Action').t`Skill settings`
                                }</span>
                            </DropdownMenuButton>
                        )}
                        <DropdownMenuButton
                            className="flex flex-nowrap items-center gap-2 text-left color-danger"
                            onClick={onRemove}
                        >
                            <LumoIcon aria-hidden className="shrink-0" name="Trash" size={16} />
                            <span>{
                                // translator: Menu item removing the selected skill or connector from this scheduled task only; it remains available in settings.
                                c('collider_2025:Action').t`Remove from this task`
                            }</span>
                        </DropdownMenuButton>
                    </DropdownMenu>
                </SimpleDropdown>
            ) : (
                onRemove && (
                    <Button
                        icon
                        increasedClickArea
                        className="schedule-chip__remove inline-flex shrink-0 items-center justify-center p-0 border border-transparent rounded-sm"
                        size="small"
                        shape="ghost"
                        type="button"
                        aria-label={
                            // translator: Remove the skill named ${label} from this task; do not delete the skill.
                            c('collider_2025:Action').t`Remove ${label}`
                        }
                        onClick={onRemove}
                    >
                        <LumoIcon aria-hidden className="shrink-0" name="X" size={12} />
                    </Button>
                )
            )}
        </span>
    );
};
