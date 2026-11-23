import { c } from 'ttag';

import { LumoLink } from '../../../components/Links/LumoLink';
import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { getScheduleRunTimestampLabel } from './utils/run-timestamp-label';

import './ScheduleBreadcrumbs.scss';

interface ScheduleBreadcrumbsProps {
    scheduleId: string;
    scheduleName: string;
    createdAt?: string;
}

export const ScheduleBreadcrumbs = ({ scheduleId, scheduleName, createdAt }: ScheduleBreadcrumbsProps) => {
    return (
        <nav className="scheduled-run-breadcrumbs w-full min-w-0 px-2 lumo-body-medium">
            <div className="flex flex-nowrap items-center gap-2 min-w-0 text-ellipsis lumo-color-glyph">
                <LumoIcon aria-hidden className="shrink-0 lumo-color-glyph-mid" name="Clock" size={14} />
                <LumoLink
                    className="flex flex-nowrap items-center gap-2 text-ellipsis lumo-color-glyph-mid"
                    to="/schedules"
                >
                    {
                        // translator: Breadcrumb link to the scheduled tasks page.
                        c('collider_2025:Label').t`Scheduled`
                    }
                </LumoLink>
                <span aria-hidden className="shrink-0 lumo-color-glyph-mid">
                    /
                </span>
                <LumoIcon aria-hidden className="shrink-0 lumo-color-glyph-brand-text" name="Zap" size={14} />
                <LumoLink dir="auto" className="min-w-0 lumo-body-medium text-ellipsis" to={`/schedules/${scheduleId}`}>
                    {scheduleName}
                </LumoLink>
                {createdAt && (
                    <>
                        <span aria-hidden className="lumo-color-glyph-mid">
                            /
                        </span>
                        <span className="text-ellipsis lumo-color-glyph-mid">
                            {getScheduleRunTimestampLabel(createdAt)}
                        </span>
                    </>
                )}
            </div>
        </nav>
    );
};
