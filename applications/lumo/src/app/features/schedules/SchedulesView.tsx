import { useNativeComposerVisibilityApi } from '../../components/Composer/hooks/useNativeComposerVisibilityApi';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { ScheduleTemplateGrid } from './components/ScheduleTemplateGrid';
import { SchedulesEmptyState } from './components/SchedulesEmptyState';
import { SchedulesPageHeader } from './components/SchedulesPageHeader';

import './SchedulesView.scss';

export const SchedulesView = () => {
    useNativeComposerVisibilityApi({ hideComposer: true });

    return (
        <LumoLayoutWithDrawer drawer={{ disabled: true }}>
            <div className="schedules-view flex flex-column items-center overflow-auto px-6 w-full">
                <div className="schedules-view__inner flex gap-8 w-full">
                    <SchedulesPageHeader />
                    <SchedulesEmptyState />
                    <ScheduleTemplateGrid />
                </div>
            </div>
        </LumoLayoutWithDrawer>
    );
};
