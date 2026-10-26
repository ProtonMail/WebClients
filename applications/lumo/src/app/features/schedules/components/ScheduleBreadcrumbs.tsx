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
        <nav className="scheduled-run-breadcrumbs w-full min-w-0 px-2 text-rg">
            <div className="flex flex-nowrap items-center gap-2 min-w-0 text-ellipsis color-norm">
                <LumoIcon aria-hidden className="shrink-0 color-weak" name="Clock" size={14} />
                <LumoLink className="flex flex-nowrap items-center gap-2 color-weak text-ellipsis" to="/schedules">
                    {
                        // translator: Breadcrumb link to the scheduled tasks page.
                        c('collider_2025:Label').t`Scheduled`
                    }
                </LumoLink>
                <span aria-hidden className="shrink-0 color-hint">
                    /
                </span>
                <LumoIcon aria-hidden className="shrink-0 color-primary" name="Zap" size={14} />
                <LumoLink className="min-w-0 text-semibold text-ellipsis" to={`/schedules/${scheduleId}`}>
                    {scheduleName}
                </LumoLink>
                {createdAt && (
                    <>
                        <span aria-hidden className="color-hint">
                            /
                        </span>
                        <span className="color-weak text-ellipsis">{getScheduleRunTimestampLabel(createdAt)}</span>
                    </>
                )}
            </div>
        </nav>
    );
};
