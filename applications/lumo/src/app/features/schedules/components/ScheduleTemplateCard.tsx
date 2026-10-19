import { useId } from 'react';

import type { IconName } from '../../../components/LumoIcon/LumoIcon';
import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';

import './ScheduleTemplateCard.scss';

interface ScheduleTemplateCardProps {
    title: string;
    description: string;
    scheduleLabel: string;
    icon: IconName;
    onClick: () => void;
}

export const ScheduleTemplateCard = ({
    title,
    description,
    scheduleLabel,
    icon,
    onClick,
}: ScheduleTemplateCardProps) => {
    const id = useId();

    return (
        <button
            aria-describedby={`${id}-description`}
            aria-labelledby={`${id}-title`}
            className="schedule-template-card flex gap-4 p-3 border border-transparent rounded-lg cursor-pointer interactive"
            onClick={onClick}
            type="button"
        >
            <div className="schedule-template-card__icon-container flex shrink-0 items-center justify-center border rounded">
                <LumoIcon aria-hidden name={icon} size={16} />
            </div>
            <div className="flex flex-column flex-1 gap-1 min-w-0 text-left">
                <h4 className="schedule-template-card__title text-semibold text-ellipsis" id={`${id}-title`}>
                    {title}
                </h4>
                <p className="m-0 text-rg color-weak" id={`${id}-description`}>
                    {description}
                </p>
                <div className="flex items-center gap-1.5 text-sm color-hint">
                    <LumoIcon name="Clock" size={13} />
                    <span>{scheduleLabel}</span>
                </div>
            </div>
        </button>
    );
};
