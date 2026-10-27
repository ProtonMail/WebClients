import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useModalStateWithData } from '@proton/components/components/modalTwo/useModalState';

import { useNativeComposerVisibilityApi } from '../../components/Composer/hooks/useNativeComposerVisibilityApi';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import { selectSchedules } from '../../redux/selectors';
import { newSpaceId } from '../../redux/slices/core/spaces';
import { deleteSchedule, saveSchedule } from '../../redux/slices/schedules';
import type { SpaceId } from '../../types';
import { ScheduleTemplateGrid } from './components/ScheduleTemplateGrid';
import { ScheduledTaskGrid } from './components/ScheduledTaskGrid';
import { SchedulesEmptyState } from './components/SchedulesEmptyState';
import { SchedulesPageHeader } from './components/SchedulesPageHeader';
import { ScheduleLimitModal } from './components/modals/ScheduleLimitModal';
import { ScheduledTaskEditorModal } from './components/modals/ScheduledTaskEditorModal';
import { createScheduleDetailsFrom, getEmptyScheduleDetails } from './components/utils/schedules';
import type { ScheduleDetails, ScheduleTemplate } from './types';
import { useScheduleLimit } from './useScheduleLimit';

import './SchedulesView.scss';

export const SchedulesView = () => {
    useNativeComposerVisibilityApi({ hideComposer: true });

    const dispatch = useLumoDispatch();
    const schedules = useLumoSelector(selectSchedules);
    const { createNotification } = useNotifications();
    const { checkCanCreateSchedule, scheduleLimitModal } = useScheduleLimit();
    const [{ data, ...scheduledTaskEditorModalProps }, openScheduledTaskEditorModal, renderScheduledTaskEditorModal] =
        useModalStateWithData<{
            initialValues: ScheduleDetails;
            spaceId: SpaceId;
            mode: 'create' | 'edit';
        }>();

    const handleNewTaskClick = () => {
        if (!checkCanCreateSchedule()) return;
        openScheduledTaskEditorModal({
            initialValues: getEmptyScheduleDetails(),
            spaceId: newSpaceId(),
            mode: 'create',
        });
    };

    const handleSelectTemplate = (template: ScheduleTemplate) => {
        if (!checkCanCreateSchedule()) return;
        openScheduledTaskEditorModal({
            initialValues: createScheduleDetailsFrom(template),
            spaceId: newSpaceId(),
            mode: 'create',
        });
    };

    const handleSaveSchedule = (id: SpaceId, schedule: ScheduleDetails) => {
        if (data?.mode !== 'edit' && !checkCanCreateSchedule()) return false;

        try {
            dispatch(saveSchedule(id, schedule, data?.mode ?? 'create'));
        } catch (error) {
            // translator: Error notification when a scheduled task cannot be saved.
            const fallbackMessage = c('collider_2025:Error')
                .t`Could not save this task. Reload the page and try again.`;
            createNotification({
                type: 'error',
                text: error instanceof Error ? error.message : fallbackMessage,
            });
            return false;
        }
        return true;
    };

    const handleEditSchedule = (id: SpaceId, schedule: ScheduleDetails) => {
        openScheduledTaskEditorModal({ initialValues: schedule, spaceId: id, mode: 'edit' });
    };

    const handleDeleteSchedule = (scheduleId: SpaceId) => {
        dispatch(deleteSchedule(scheduleId));
    };

    return (
        <LumoLayoutWithDrawer drawer={{ disabled: true }}>
            <div className="schedules-view w-full px-6 overflow-auto">
                <SchedulesPageHeader onNewTaskClick={handleNewTaskClick} />
                {Object.keys(schedules).length === 0 && <SchedulesEmptyState />}
                <ScheduledTaskGrid
                    onDeleteSchedule={handleDeleteSchedule}
                    onEditSchedule={handleEditSchedule}
                    schedules={schedules}
                />
                <ScheduleTemplateGrid onSelect={handleSelectTemplate} />
            </div>

            {scheduleLimitModal.render && <ScheduleLimitModal {...scheduleLimitModal.modalProps} />}

            {renderScheduledTaskEditorModal && data && (
                <ScheduledTaskEditorModal
                    initialValues={data.initialValues}
                    key={data.spaceId}
                    mode={data.mode}
                    spaceId={data.spaceId}
                    onDelete={handleDeleteSchedule}
                    onSave={handleSaveSchedule}
                    {...scheduledTaskEditorModalProps}
                />
            )}
        </LumoLayoutWithDrawer>
    );
};
