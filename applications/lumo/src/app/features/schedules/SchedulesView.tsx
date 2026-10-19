import { useState } from 'react';

import { useModalStateWithData } from '@proton/components';

import { useNativeComposerVisibilityApi } from '../../components/Composer/hooks/useNativeComposerVisibilityApi';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { ScheduleTemplateGrid } from './components/ScheduleTemplateGrid';
import { ScheduledTaskGrid } from './components/ScheduledTaskGrid';
import { SchedulesEmptyState } from './components/SchedulesEmptyState';
import { SchedulesPageHeader } from './components/SchedulesPageHeader';
import { ScheduledTaskEditorModal } from './components/modals/ScheduledTaskEditorModal';
import type { ScheduleDetails, ScheduleTemplate } from './types';
import { createScheduleDetailsFrom, getEmptyScheduleDetails } from './utils';

import './SchedulesView.scss';

export const SchedulesView = () => {
    useNativeComposerVisibilityApi({ hideComposer: true });

    const [schedules, setSchedules] = useState<Map<string, ScheduleDetails>>(new Map());
    const [{ data, ...scheduledTaskEditorModalProps }, openScheduledTaskEditorModal, renderScheduledTaskEditorModal] =
        useModalStateWithData<{
            initialValues: ScheduleDetails;
            mode: 'create' | 'edit';
        }>();

    const handleNewTaskClick = () => {
        openScheduledTaskEditorModal({ initialValues: getEmptyScheduleDetails(), mode: 'create' });
    };

    const handleSelectTemplate = (template: ScheduleTemplate) => {
        openScheduledTaskEditorModal({ initialValues: createScheduleDetailsFrom(template), mode: 'create' });
    };

    const handleSaveSchedule = (schedule: ScheduleDetails) => {
        setSchedules((prev) => {
            const newSchedules = new Map(prev);
            newSchedules.set(schedule.id, schedule);
            return newSchedules;
        });
    };

    const handleEditSchedule = (schedule: ScheduleDetails) => {
        openScheduledTaskEditorModal({ initialValues: schedule, mode: 'edit' });
    };

    const handleDeleteSchedule = (scheduleId: string) => {
        setSchedules((prev) => {
            const newSchedules = new Map(prev);
            newSchedules.delete(scheduleId);
            return newSchedules;
        });
    };

    return (
        <LumoLayoutWithDrawer drawer={{ disabled: true }}>
            <div className="schedules-view w-full px-6 overflow-auto">
                <SchedulesPageHeader onNewTaskClick={handleNewTaskClick} />
                {schedules.size === 0 && <SchedulesEmptyState />}
                <ScheduledTaskGrid
                    onDeleteSchedule={handleDeleteSchedule}
                    onEditSchedule={handleEditSchedule}
                    schedules={[...schedules.values()]}
                />
                <ScheduleTemplateGrid onSelect={handleSelectTemplate} />
            </div>
            {renderScheduledTaskEditorModal && (
                <ScheduledTaskEditorModal
                    initialValues={data?.initialValues}
                    key={data?.initialValues?.id}
                    mode={data?.mode}
                    onDelete={handleDeleteSchedule}
                    onSave={handleSaveSchedule}
                    {...scheduledTaskEditorModalProps}
                />
            )}
        </LumoLayoutWithDrawer>
    );
};
