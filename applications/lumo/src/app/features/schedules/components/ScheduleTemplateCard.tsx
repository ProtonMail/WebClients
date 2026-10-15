import { useId } from 'react';

import { c } from 'ttag';

import type { IconName } from '../../../components/LumoIcon/LumoIcon';
import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';

interface ScheduleTemplateCardProps {
    id: string;
    title: string;
    description: string;
    scheduleLabel: string;
    icon: IconName;
}

export const ScheduleTemplateCard = ({ title, description, scheduleLabel, icon }: ScheduleTemplateCardProps) => {
    const id = useId();

    return (
        <button
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-description`}
            className="schedule-template-card flex gap-4 p-3 border border-transparent rounded-lg interactive cursor-pointer"
        >
            <div className="schedule-template-card__icon-container flex items-center justify-center shrink-0 border rounded">
                <LumoIcon className="schedule-template-card__icon" name={icon} size={16} />
                <LumoIcon className="schedule-template-card__icon-plus" name="Plus" size={16} />
            </div>
            <div className="flex flex-column gap-1 flex-1 min-w-0 text-left">
                <h4 className="schedule-template-card__title text-ellipsis text-semibold" id={`${id}-title`}>
                    {title}
                </h4>
                <p className="schedule-template-card__description m-0 text-rg" id={`${id}-description`}>
                    {description}
                </p>
                <div className="schedule-template-card__schedule-label flex items-center gap-1.5">
                    <LumoIcon name="Clock" size={13} />
                    <span>{scheduleLabel}</span>
                </div>
            </div>
            <div className="schedule-template-card__use-template px-3 py-1.5 border rounded">{c('collider_2025:Label')
                .t`Use template`}</div>
        </button>
    );
};
