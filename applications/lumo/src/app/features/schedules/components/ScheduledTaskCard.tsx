import { c } from 'ttag';

import { useModalStateObject } from '@proton/components';

import type { DropdownOptions } from '../../../components/DropdownMenu';
import DropdownMenu from '../../../components/DropdownMenu';
import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import type { ScheduleDetails } from '../types';
import { DeleteScheduledTaskPrompt } from './modals/DeleteScheduledTaskPrompt';

import './ScheduledTaskCard.scss';

interface ScheduledTaskCardProps {
    onDelete?: () => void;
    onEdit?: () => void;
    schedule: ScheduleDetails;
}

export const ScheduledTaskCard = ({ onDelete, onEdit, schedule }: ScheduledTaskCardProps) => {
    const deleteTaskPrompt = useModalStateObject();

    // TODO: Replace with actual cadence label
    const cadenceLabel = 'Test Cadence Label';
    const taskDisplayName = schedule.name.trim() || c('collider_2025:Label').t`Untitled task`;

    const menuOptions: DropdownOptions[] = [
        {
            label: c('collider_2025:Action').t`Edit`,
            icon: <LumoIcon aria-hidden name="Pen" size={16} />,
            onClick: () => {
                onEdit?.();
            },
        },
        {
            className: 'color-danger hover:color-danger',
            label: c('collider_2025:Action').t`Delete`,
            icon: <LumoIcon aria-hidden name="Trash" size={16} />,
            onClick: () => {
                deleteTaskPrompt.openModal(true);
            },
        },
    ];

    return (
        <>
            <div className="scheduled-task-card flex flex-column px-5 py-4 border rounded-xl bg-norm">
                <div className="flex flex-nowrap items-center gap-2 w-full">
                    <h4 className="scheduled-task-card__title flex-1 m-0 text-semibold">{schedule.name}</h4>
                    <span aria-hidden className="scheduled-task-card__status-dot shrink-0 rounded-full" />
                    <DropdownMenu
                        buttonContent={
                            <LumoIcon
                                aria-label={
                                    // translator: Opens actions for a saved scheduled task.
                                    c('collider_2025:Action').t`Task options`
                                }
                                name="EllipsisVertical"
                                size={16}
                            />
                        }
                        className="scheduled-task-card__menu-button"
                        options={menuOptions}
                        visibleOnHover
                    />
                </div>

                <p className="m-0 text-rg text-ellipsis-two-lines color-weak">{schedule.instructions}</p>

                <div className="flex flex-nowrap items-center justify-space-between w-full">
                    <span className="scheduled-task-card__schedule-chip shrink-0 text-sm">{cadenceLabel}</span>
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
