import { c } from 'ttag';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';

import './SchedulesEmptyState.scss';

export const SchedulesEmptyState = () => {
    return (
        <div className="schedules-empty-state flex flex-column items-center gap-3 mx-auto text-center">
            <div className="schedules-empty-state__icon flex items-center justify-center rounded-xl">
                <LumoIcon name="Timer" size={24} strokeWidth={1.4} />
            </div>
            <span className="text-lg text-semibold">{c('collider_2025:Title').t`No scheduled tasks yet`}</span>
        </div>
    );
};
