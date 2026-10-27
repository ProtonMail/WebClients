import { clsx } from 'clsx';
import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { ALWAYS_LOCAL_TIMEZONE_ID } from '../../../components/RecurrenceRuleFieldset/types';
import type { ScheduleDetails } from '../types';
import { ScheduleNextRunLabel } from './ScheduleNextRunLabel';
import { DeleteScheduledTaskPrompt } from './modals/DeleteScheduledTaskPrompt';
import { getScheduleCadenceLabel } from './utils/cadence-label';

import './ScheduledTaskCard.scss';

interface ScheduledTaskCardProps {
    onDelete?: () => void | Promise<void>;
    onEdit?: () => void;
    schedule: ScheduleDetails;
}

export const ScheduledTaskCard = ({ onDelete, onEdit, schedule }: ScheduledTaskCardProps) => {
    const deleteTaskPrompt = useModalStateObject();
    const [userSettings] = useUserSettings();

    const { recurrenceRule } = schedule;
    const cadenceLabel = getScheduleCadenceLabel(recurrenceRule, getWeekStartsOn(userSettings));
    const usesFixedTimezone = recurrenceRule.timezone !== ALWAYS_LOCAL_TIMEZONE_ID;
    const taskDisplayName =
        schedule.name.trim() ||
        // translator: Display name for an untitled task.
        c('collider_2025:Label').t`Untitled task`;

    return (
        <>
            <div className="scheduled-task-card flex flex-column px-5 py-4 border rounded-xl bg-norm">
                <div className="flex flex-nowrap items-center gap-2 w-full">
                    <h4 className="scheduled-task-card__title flex-1 m-0 text-semibold">{schedule.name}</h4>
                    <span aria-hidden className="scheduled-task-card__status-dot shrink-0 rounded-full" />
                    <div className="relative shrink-0 flex">
                        <SimpleDropdown
                            as={Button}
                            className={clsx('rounded-sm scheduled-task-card__menu-button')}
                            content={
                                <LumoIcon
                                    aria-label={
                                        // translator: Opens actions for a saved scheduled task.
                                        c('collider_2025:Action').t`Task options`
                                    }
                                    name="EllipsisVertical"
                                    size={16}
                                />
                            }
                            dropdownClassName="chat-dropdown-menu"
                            hasCaret={false}
                            icon
                            shape="ghost"
                            size="small"
                        >
                            <DropdownMenu>
                                <DropdownMenuButton
                                    className="flex flex-row flex-nowrap items-center gap-2 w-full"
                                    onClick={() => onEdit?.()}
                                >
                                    <LumoIcon aria-hidden name="Pen" size={16} />
                                    <span>{c('collider_2025:Action').t`Edit`}</span>
                                </DropdownMenuButton>
                                <hr className="mx-3 my-1" />
                                <DropdownMenuButton
                                    className="flex flex-row flex-nowrap items-center gap-2 w-full color-danger hover:color-danger"
                                    onClick={() => deleteTaskPrompt.openModal(true)}
                                >
                                    <LumoIcon aria-hidden name="Trash" size={16} />
                                    <span>{c('collider_2025:Action').t`Delete`}</span>
                                </DropdownMenuButton>
                            </DropdownMenu>
                        </SimpleDropdown>
                    </div>
                </div>

                <p className="m-0 text-rg text-ellipsis-two-lines color-weak">{schedule.instructions}</p>

                <div className="flex flex-nowrap items-center justify-space-between gap-2 w-full">
                    <Tooltip title={usesFixedTimezone ? `${cadenceLabel} (${recurrenceRule.timezone})` : cadenceLabel}>
                        <span className="scheduled-task-card__schedule-chip inline-flex flex-nowrap items-center gap-1 min-w-0 text-sm">
                            {usesFixedTimezone && <LumoIcon aria-hidden className="shrink-0" name="Globe" size={12} />}
                            <span className="min-w-0 text-ellipsis">{cadenceLabel}</span>
                        </span>
                    </Tooltip>
                    <ScheduleNextRunLabel className="text-sm color-weak" rule={recurrenceRule} />
                    <LumoIcon aria-hidden className="shrink-0 color-hint" name="LaptopMinimal" size={14} />
                </div>
            </div>

            {deleteTaskPrompt.render && (
                <DeleteScheduledTaskPrompt
                    {...deleteTaskPrompt.modalProps}
                    onConfirm={() => onDelete?.()}
                    taskName={taskDisplayName}
                />
            )}
        </>
    );
};
