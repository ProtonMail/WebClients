import { useId } from 'react';

import { c } from 'ttag';

import { useIsLumoSmallScreen } from '../../../hooks/useIsLumoSmallScreen';
import type { ScheduleMap } from '../../../redux/selectors';
import type { SpaceId } from '../../../types';
import { batchItems } from '../../../util/batchItems';
import type { ScheduleDetails } from '../types';
import { ScheduledTaskCard } from './ScheduledTaskCard';

import './ScheduledTaskGrid.scss';

interface ScheduledTaskGridProps {
    onDeleteSchedule?: (id: SpaceId) => void;
    onEditSchedule?: (id: SpaceId, schedule: ScheduleDetails) => void;
    schedules: ScheduleMap;
}

export const ScheduledTaskGrid = ({ onDeleteSchedule, onEditSchedule, schedules }: ScheduledTaskGridProps) => {
    const headerId = useId();
    const { isSmallScreen } = useIsLumoSmallScreen();
    const columnCount = isSmallScreen ? 1 : 2;
    const scheduleRows = batchItems(Object.entries(schedules), columnCount);

    if (scheduleRows.length === 0) {
        return null;
    }

    return (
        <div className="scheduled-task-grid flex flex-column gap-4 w-full">
            <h3 className="scheduled-task-grid__heading m-0 text-sm text-semibold color-hint" id={headerId}>
                {
                    // translator: Section heading for saved scheduled tasks.
                    c('collider_2025:Title').t`Your tasks`
                }
            </h3>
            <div
                aria-colcount={columnCount}
                aria-labelledby={headerId}
                aria-rowcount={scheduleRows.length}
                className="flex flex-column gap-2"
                role="grid"
            >
                {scheduleRows.map((row, rowIndex) => (
                    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                    <div
                        aria-rowindex={rowIndex + 1}
                        className="flex flex-nowrap gap-5 w-full"
                        key={rowIndex}
                        role="row"
                    >
                        {Array.from({ length: columnCount }, (_, columnIndex) => {
                            const [id, schedule] = row[columnIndex] ?? [];

                            return (
                                // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                                <div
                                    aria-colindex={columnIndex + 1}
                                    className="flex-1 min-w-0"
                                    key={id ?? columnIndex}
                                    role={schedule ? 'gridcell' : undefined}
                                >
                                    {schedule && (
                                        <ScheduledTaskCard
                                            onDelete={() => onDeleteSchedule?.(id)}
                                            onEdit={() => onEditSchedule?.(id, schedule)}
                                            schedule={schedule}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};
