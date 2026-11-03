import { useId, useRef } from 'react';

import { c } from 'ttag';

import { useElementSizeMatch } from '../../../hooks/useElementSizeMatch';
import type { ScheduleMap } from '../../../redux/selectors';
import type { SpaceId } from '../../../types';
import { batchItems } from '../../../util/batchItems';
import type { ScheduleDetails } from '../types';
import { ScheduledTaskCard } from './ScheduledTaskCard';
import { shouldShowColumnLayout } from './utils/layout';

import './ScheduledTaskGrid.scss';

interface ScheduledTaskGridProps {
    onDeleteSchedule?: (id: SpaceId) => void;
    onEditSchedule?: (id: SpaceId, schedule: ScheduleDetails) => void;
    schedules: ScheduleMap;
}

const ScheduledTaskGridContent = ({ onDeleteSchedule, onEditSchedule, schedules }: ScheduledTaskGridProps) => {
    const headerId = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const enableColumnLayout = useElementSizeMatch(containerRef, shouldShowColumnLayout);
    const columnCount = enableColumnLayout ? 1 : 2;
    const scheduleRows = batchItems(Object.entries(schedules), columnCount);

    return (
        <div className="scheduled-task-grid flex flex-column gap-4 w-full" ref={containerRef}>
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
                    <div
                        aria-rowindex={rowIndex + 1}
                        className="flex flex-nowrap gap-5 w-full"
                        key={rowIndex}
                        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                        role="row"
                    >
                        {Array.from({ length: columnCount }, (_, columnIndex) => {
                            const [id, schedule] = row[columnIndex] ?? [];

                            return (
                                <div
                                    aria-colindex={columnIndex + 1}
                                    className="flex-1 min-w-0"
                                    key={id ?? columnIndex}
                                    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                                    role={schedule ? 'gridcell' : undefined}
                                >
                                    {schedule && (
                                        <ScheduledTaskCard
                                            onDelete={() => onDeleteSchedule?.(id)}
                                            onEdit={() => onEditSchedule?.(id, schedule)}
                                            schedule={schedule}
                                            scheduleId={id}
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

export const ScheduledTaskGrid = (props: ScheduledTaskGridProps) =>
    Object.keys(props.schedules).length > 0 ? <ScheduledTaskGridContent {...props} /> : null;
