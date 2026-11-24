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
import type { ScheduleCreatedSource } from '../../util/telemetry';
import { sendScheduleCreatedEvent, sendScheduleDeletedEvent } from '../../util/telemetry';
import { ScheduleTemplateGrid } from './components/ScheduleTemplateGrid';
import { ScheduledTaskGrid } from './components/ScheduledTaskGrid';
import { SchedulesEmptyState } from './components/SchedulesEmptyState';
import { SchedulesPageHeader } from './components/SchedulesPageHeader';
import { ScheduleLimitModal } from './components/modals/ScheduleLimitModal';
import { ScheduledTaskEditorModal } from './components/modals/ScheduledTaskEditorModal';
import { createScheduleDetailsFrom, getEmptyScheduleDetails } from './components/utils/schedules';
import type { ScheduleDetails, ScheduleTemplate } from './types';
import { useScheduleLimit } from './useScheduleLimit';

export const SchedulesView = () => {
    useNativeComposerVisibilityApi({ hideComposer: true });

    const dispatch = useLumoDispatch();
    const schedules = useLumoSelector(selectSchedules);
    const { createNotification } = useNotifications();
    const { checkCanCreateSchedule, scheduleLimitModal, scheduleLimitModalState } = useScheduleLimit();
    const [{ data, ...scheduledTaskEditorModalProps }, openScheduledTaskEditorModal, renderScheduledTaskEditorModal] =
        useModalStateWithData<
            { initialValues: ScheduleDetails; spaceId: SpaceId } & (
                | { mode: 'create'; source: ScheduleCreatedSource }
                | { mode: 'edit' }
            )
        >();

    const handleNewTaskClick = () => {
        if (!checkCanCreateSchedule()) return;
        openScheduledTaskEditorModal({
            initialValues: getEmptyScheduleDetails(),
            spaceId: newSpaceId(),
            mode: 'create',
            source: 'blank',
        });
    };

    const handleSelectTemplate = (template: ScheduleTemplate) => {
        if (!checkCanCreateSchedule()) return;
        openScheduledTaskEditorModal({
            initialValues: createScheduleDetailsFrom(template),
            spaceId: newSpaceId(),
            mode: 'create',
            source: 'template',
        });
    };

    const handleSaveSchedule = (id: SpaceId, schedule: ScheduleDetails) => {
        if (data?.mode !== 'edit' && !checkCanCreateSchedule()) return false;

        try {
            dispatch(saveSchedule(id, schedule, data?.mode ?? 'create'));
            if (data?.mode === 'create') {
                sendScheduleCreatedEvent({ source: data.source });
            }
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
        if (dispatch(deleteSchedule(scheduleId))) {
            sendScheduleDeletedEvent();
        }
    };

    return (
        <LumoLayoutWithDrawer drawer={{ disabled: true }}>
            <div className="flex-1 w-full min-h-0 px-8 pt-2 pb-10 overflow-auto lumo-color-glyph">
                <div
                    className="flex flex-column gap-8 w-full max-w-custom mx-auto"
                    style={{ '--max-w-custom': '60rem' }}
                >
                    <SchedulesPageHeader onNewTaskClick={handleNewTaskClick} />
                    {Object.keys(schedules).length === 0 && <SchedulesEmptyState />}
                    <ScheduledTaskGrid
                        onDeleteSchedule={handleDeleteSchedule}
                        onEditSchedule={handleEditSchedule}
                        schedules={schedules}
                    />
                    <ScheduleTemplateGrid onSelect={handleSelectTemplate} />
                </div>
            </div>

            {scheduleLimitModal.render && (
                <ScheduleLimitModal {...scheduleLimitModal.modalProps} {...scheduleLimitModalState} />
            )}

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
