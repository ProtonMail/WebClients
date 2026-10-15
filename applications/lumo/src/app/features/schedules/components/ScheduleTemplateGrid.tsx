import { useId, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { useIsLumoSmallScreen } from '../../../hooks/useIsLumoSmallScreen';
import { MOCK_SCHEDULE_TEMPLATES } from '../scheduleFixtures';
import { ScheduleTemplateCard } from './ScheduleTemplateCard';

function chunkIntoRows<T>(arr: readonly T[], columns: number): T[][] {
    if (columns <= 0) {
        return [];
    }

    return arr.reduce<T[][]>((acc, item, index) => {
        const rowIndex = Math.floor(index / columns);
        if (!acc[rowIndex]) {
            acc[rowIndex] = [];
        }
        acc[rowIndex].push(item);
        return acc;
    }, []);
}

export const ScheduleTemplateGrid = () => {
    const [templatesVisible, setTemplatesVisible] = useState(true);
    const headerId = useId();
    const { isSmallScreen } = useIsLumoSmallScreen();
    const columnCount = isSmallScreen ? 1 : 2;
    const templateRows = chunkIntoRows(MOCK_SCHEDULE_TEMPLATES, columnCount);

    const toggleLabel = templatesVisible
        ? c('collider_2025:Button').t`Hide templates`
        : c('collider_2025:Button').t`Show templates`;

    return (
        <div className="schedule-templates flex flex-column gap-4 w-full">
            <hr className="m-0 mb-4 border-weak border-top" />
            <div
                className={clsx('flex items-center gap-2', {
                    'justify-space-between': templatesVisible,
                })}
            >
                <h3 className={clsx('schedule-templates__heading text-sm text-semibold')} id={headerId}>
                    {templatesVisible
                        ? c('collider_2025:Title').t`Start from a template`
                        : c('collider_2025:Title').t`Templates hidden`}
                </h3>
                <button
                    type="button"
                    className="schedule-templates__toggle p-0 bg-transparent border border-transparent rounded-sm text-sm underline interactive cursor-pointer"
                    onClick={() => setTemplatesVisible((visible) => !visible)}
                >
                    {toggleLabel}
                </button>
            </div>
            {templatesVisible && (
                <div
                    aria-labelledby={headerId}
                    aria-rowcount={templateRows.length}
                    aria-colcount={columnCount}
                    className="flex flex-column gap-2"
                    role="grid"
                >
                    {templateRows.map((row, rowIndex) => (
                        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                        <div
                            key={rowIndex}
                            aria-rowindex={rowIndex + 1}
                            role="row"
                            className="flex flex-nowrap gap-5 w-full"
                        >
                            {Array.from({ length: columnCount }, (_, columnIndex) => {
                                const template = row[columnIndex];

                                return (
                                    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                                    <div
                                        key={template?.id ?? columnIndex}
                                        aria-colindex={columnIndex + 1}
                                        className="flex-1 min-w-0"
                                        role={template ? 'gridcell' : undefined}
                                    >
                                        {template && <ScheduleTemplateCard {...template} />}
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
