import { useId, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { useIsLumoSmallScreen } from '../../../hooks/useIsLumoSmallScreen';
import { batchItems } from '../../../util/batchItems';
import { SCHEDULE_TEMPLATES } from '../constants';
import type { ScheduleTemplate } from '../types';
import { ScheduleTemplateCard } from './ScheduleTemplateCard';

import './ScheduleTemplateGrid.scss';

interface ScheduleTemplateGridProps {
    onSelect?: (template: ScheduleTemplate) => void;
}

export const ScheduleTemplateGrid = ({ onSelect }: ScheduleTemplateGridProps) => {
    const [templatesVisible, setTemplatesVisible] = useState(true);
    const headerId = useId();
    const { isSmallScreen } = useIsLumoSmallScreen();
    const columnCount = isSmallScreen ? 1 : 2;
    const templateRows = batchItems(SCHEDULE_TEMPLATES, columnCount);

    const toggleLabel = templatesVisible
        ? c('collider_2025:Button').t`Hide templates`
        : c('collider_2025:Button').t`Show templates`;

    return (
        <div className="schedule-template-grid flex flex-column flex-nowrap gap-4 w-full">
            <hr className="m-0 mb-4 border-top border-weak" />
            <div className="flex items-center justify-space-between gap-2">
                <h3 className={clsx('text-sm text-semibold color-hint')} id={headerId}>
                    {templatesVisible
                        ? c('collider_2025:Title').t`Start from a template`
                        : c('collider_2025:Title').t`Templates hidden`}
                </h3>
                <button
                    className="schedule-template-grid__toggle p-0 border border-transparent rounded-sm text-sm color-weak bg-transparent cursor-pointer interactive"
                    onClick={() => setTemplatesVisible((visible) => !visible)}
                    type="button"
                >
                    {toggleLabel}
                </button>
            </div>
            {templatesVisible && (
                <div
                    aria-colcount={columnCount}
                    aria-labelledby={headerId}
                    aria-rowcount={templateRows.length}
                    className="flex flex-column gap-2"
                    role="grid"
                >
                    {templateRows.map((row, rowIndex) => (
                        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                        <div
                            aria-rowindex={rowIndex + 1}
                            className="flex flex-nowrap gap-5 w-full"
                            key={rowIndex}
                            role="row"
                        >
                            {Array.from({ length: columnCount }, (_, columnIndex) => {
                                const template = row[columnIndex];

                                return (
                                    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                                    <div
                                        aria-colindex={columnIndex + 1}
                                        className="flex-1 min-w-0"
                                        key={template?.name ?? columnIndex}
                                        role={template ? 'gridcell' : undefined}
                                    >
                                        {template && (
                                            <ScheduleTemplateCard
                                                description={template.description}
                                                icon={template.icon}
                                                onClick={() => onSelect?.(template)}
                                                scheduleLabel={template.scheduleLabel}
                                                title={template.name}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
