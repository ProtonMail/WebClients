import { useHistory } from 'react-router-dom';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { useLumoDispatch, useLumoSelector } from '../../../redux/hooks';
import { selectLatestRunsByScheduleId } from '../../../redux/selectors';
import { setScheduleEnabled } from '../../../redux/slices/schedules';
import type { ScheduleDetails } from '../types';
import { useRunScheduleNow } from '../useRunScheduleNow';
import { useScheduleRunState } from '../useScheduleRunState';
import { ScheduleRunPrimaryLabel } from './ScheduleRunPrimaryLabel';
import { ScheduleRunSecondaryLabel } from './ScheduleRunSecondaryLabel';
import { DeleteScheduledTaskPrompt } from './modals/DeleteScheduledTaskPrompt';

import './ScheduledTaskCard.scss';

interface ScheduledTaskCardProps {
    onDelete?: () => void | Promise<void>;
    onEdit?: () => void;
    schedule: ScheduleDetails;
    scheduleId: string;
}

export const ScheduledTaskCard = ({ onDelete, onEdit, schedule, scheduleId }: ScheduledTaskCardProps) => {
    const deleteTaskPrompt = useModalStateObject();
    const { isRunning, isPaused } = useScheduleRunState(scheduleId);
    const runControls = useRunScheduleNow(scheduleId);
    const dispatch = useLumoDispatch();
    const history = useHistory();
    const latestRun = useLumoSelector(selectLatestRunsByScheduleId)[scheduleId];
    const runLoading = isRunning || runControls.loading;

    const { recurrenceRule } = schedule;
    const taskDisplayName =
        schedule.name.trim() ||
        // translator: Display name for an untitled task.
        c('collider_2025:Label').t`Untitled task`;

    return (
        <>
            <div className="scheduled-task-card flex flex-column h-full px-5 py-4 border rounded-xl bg-norm">
                <div className="flex flex-nowrap items-center gap-2 w-full">
                    <h4 className="scheduled-task-card__title flex-1 m-0 text-semibold">{schedule.name}</h4>
                    {isRunning ? (
                        <LumoIcon
                            aria-hidden
                            className="scheduled-task-card__running-icon shrink-0"
                            name="LoaderCircle"
                            size={16}
                        />
                    ) : (
                        <span
                            aria-hidden
                            className={clsx('scheduled-task-card__status-dot shrink-0 rounded-full', {
                                'scheduled-task-card__status-dot--enabled': !isPaused,
                            })}
                        />
                    )}
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
                                    aria-busy={runLoading}
                                    className={clsx(
                                        'flex flex-row flex-nowrap items-center gap-2 w-full',
                                        runLoading && 'color-hint'
                                    )}
                                    disabled={isRunning || runControls.disabled}
                                    onClick={runControls.runNow}
                                >
                                    <LumoIcon aria-hidden name="Play" size={16} />
                                    <span>
                                        {
                                            // translator: Task action: "Running" means the task is starting or executing; "Run now" starts it immediately.
                                            runLoading
                                                ? c('collider_2025:Status').t`Running`
                                                : c('collider_2025:Action').t`Run now`
                                        }
                                    </span>
                                </DropdownMenuButton>
                                <DropdownMenuButton
                                    className="flex flex-row flex-nowrap items-center gap-2 w-full"
                                    onClick={() => dispatch(setScheduleEnabled(scheduleId, isPaused))}
                                >
                                    <LumoIcon aria-hidden name={isPaused ? 'RotateCw' : 'Pause'} size={16} />
                                    <span>
                                        {
                                            // translator: Task actions that resume or pause future scheduled executions.
                                            isPaused
                                                ? c('collider_2025:Action').t`Resume`
                                                : c('collider_2025:Action').t`Pause`
                                        }
                                    </span>
                                </DropdownMenuButton>
                                <DropdownMenuButton
                                    className="flex flex-row flex-nowrap items-center gap-2 w-full"
                                    onClick={() => onEdit?.()}
                                >
                                    <LumoIcon aria-hidden name="Pen" size={16} />
                                    <span>{c('collider_2025:Action').t`Edit`}</span>
                                </DropdownMenuButton>
                                <DropdownMenuButton
                                    className="flex flex-row flex-nowrap items-center gap-2 w-full"
                                    onClick={() =>
                                        history.push({
                                            pathname: latestRun ? `/c/${latestRun.id}` : `/schedules/${scheduleId}`,
                                            state: { expandedScheduleRuns: scheduleId },
                                        })
                                    }
                                >
                                    <LumoIcon aria-hidden name="RotateCcwClock" size={16} />
                                    <span>
                                        {
                                            // translator: Opens the list of past runs of a scheduled task.
                                            c('collider_2025:Action').t`Run history`
                                        }
                                    </span>
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

                <div className="flex flex-nowrap items-center justify-space-between gap-2 w-full mt-auto">
                    <ScheduleRunPrimaryLabel chip rule={recurrenceRule} scheduleId={scheduleId} />
                    <ScheduleRunSecondaryLabel
                        className="text-sm color-hint"
                        rule={recurrenceRule}
                        scheduleId={scheduleId}
                    />
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
