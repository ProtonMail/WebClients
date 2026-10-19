import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';

import './SchedulesPageHeader.scss';

interface SchedulesPageHeaderProps {
    onNewTaskClick?: () => void;
}

export const SchedulesPageHeader = ({ onNewTaskClick }: SchedulesPageHeaderProps) => {
    return (
        <div className="schedules-page-header flex flex-nowrap items-start gap-3 w-full">
            <div className="flex flex-column flex-1 gap-1 min-w-0">
                <h2 className="text-semibold">{c('collider_2025:Title').t`Scheduled tasks`}</h2>
                <p className="schedules-page-header__subtitle m-0 text-md">
                    {c('collider_2025:Info')
                        .t`Run tasks on a schedule or whenever you need them. Tasks run on this computer while ${LUMO_SHORT_APP_NAME} is open.`}
                </p>
            </div>
            <div className="flex flex-nowrap shrink-0 items-center gap-3">
                <Button aria-label={c('collider_2025:Button').t`Search`} className="shrink-0" icon shape="ghost">
                    <LumoIcon name="Search" size={20} />
                </Button>
                <Button className="shrink-0" color="norm" onClick={onNewTaskClick}>
                    <span className="flex flex-nowrap items-center gap-2">
                        <LumoIcon name="Plus" size={16} />
                        {c('collider_2025:Button').t`New task`}
                    </span>
                </Button>
            </div>
        </div>
    );
};
