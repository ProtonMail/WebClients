import { Redirect, useHistory, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import Loader from '@proton/components/components/loader/Loader';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';

import { useNativeComposerVisibilityApi } from '../../components/Composer/hooks/useNativeComposerVisibilityApi';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { useIsChatHistoryHydrating } from '../../hooks/useIsChatHistoryHydrating';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import { selectLatestRunsByScheduleId, selectSchedules } from '../../redux/selectors';
import { deleteSchedule, saveSchedule } from '../../redux/slices/schedules';
import type { SpaceId } from '../../types';
import { sendScheduleDeletedEvent } from '../../util/telemetry';
import { ConnectorList } from './components/ConnectorList';
import { ScheduleBreadcrumbs } from './components/ScheduleBreadcrumbs';
import { ScheduleRunPrimaryLabel } from './components/ScheduleRunPrimaryLabel';
import { ScheduleRunSecondaryLabel } from './components/ScheduleRunSecondaryLabel';
import { SkillList } from './components/SkillList';
import { ScheduledTaskEditorModal } from './components/modals/ScheduledTaskEditorModal';
import type { ScheduleDetails } from './types';
import { useRunScheduleNow } from './useRunScheduleNow';

import './ScheduleHomeView.scss';

export const ScheduleHomeView = () => {
    const { scheduleId } = useParams<{ scheduleId: string }>();
    const history = useHistory();
    const runControls = useRunScheduleNow(scheduleId);
    const dispatch = useLumoDispatch();
    const schedule = useLumoSelector(selectSchedules)[scheduleId];
    const latestRun = useLumoSelector(selectLatestRunsByScheduleId)[scheduleId];
    const isHydrating = useIsChatHistoryHydrating();
    const { createNotification } = useNotifications();
    const editor = useModalStateObject();

    useNativeComposerVisibilityApi({ hideComposer: true });

    const handleSave = (id: SpaceId, values: ScheduleDetails) => {
        try {
            dispatch(saveSchedule(id, values, 'edit'));
            return true;
        } catch (error) {
            // translator: Error notification when a scheduled task cannot be saved.
            const fallbackMessage = c('collider_2025:Error')
                .t`Could not save this task. Reload the page and try again.`;
            createNotification({ type: 'error', text: error instanceof Error ? error.message : fallbackMessage });
            return false;
        }
    };

    if (isHydrating) {
        return <Loader />;
    }

    if (!schedule) {
        return <Redirect to="/schedules" />;
    }

    return (
        <LumoLayoutWithDrawer
            drawer={{ disabled: true }}
            header={{ component: <ScheduleBreadcrumbs scheduleId={scheduleId} scheduleName={schedule.name} /> }}
        >
            <div className="flex-1 min-h-0 px-6 overflow-auto">
                <div className="scheduled-task-home flex flex-column gap-6 w-full mx-auto py-6">
                    {/* Schedule name and cadence */}
                    <div>
                        <div dir="auto">
                            <div className="inline-flex items-center justify-center mb-3 p-3 border lumo-border radius-12">
                                <LumoIcon aria-hidden name="Clock" size={24} />
                            </div>
                            <h1 className="m-0 mb-2 lumo-headline-small">{schedule.name}</h1>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 lumo-body-medium lumo-color-glyph-mid">
                            <ScheduleRunPrimaryLabel rule={schedule.recurrenceRule} scheduleId={scheduleId} />
                            <span aria-hidden>·</span>
                            <ScheduleRunSecondaryLabel rule={schedule.recurrenceRule} scheduleId={scheduleId} />
                        </div>
                    </div>

                    {/* Schedule instructions */}
                    <section className="p-4 border lumo-border radius-16 lumo-bg-panel">
                        <h2 className="m-0 mb-2 lumo-label-small lumo-color-glyph-mid">{
                            // translator: Heading above the instructions executed by a scheduled task.
                            c('collider_2025:Title').t`What it does`
                        }</h2>
                        <p dir="auto" className="m-0 text-ellipsis-four-lines">
                            {schedule.instructions}
                        </p>
                    </section>

                    {/* Schedule skills */}
                    {!!schedule.skillIdsOrSubSkillRefs?.length && (
                        <SkillList
                            value={schedule.skillIdsOrSubSkillRefs}
                            headerClassName="lumo-body-small lumo-color-glyph-mid"
                        />
                    )}

                    {/* Schedule connectors */}
                    {schedule.connectors.length > 0 && (
                        <ConnectorList
                            headerClassName="lumo-body-small lumo-color-glyph-mid"
                            value={schedule.connectors}
                        />
                    )}

                    {/* Schedule actions */}
                    <div className="flex gap-2">
                        <Button
                            color="norm"
                            disabled={runControls.disabled}
                            loading={runControls.loading}
                            onClick={runControls.runNow}
                        >
                            <span className="flex items-center gap-2">
                                <LumoIcon aria-hidden name="Play" size={16} />
                                {
                                    // translator: Starts a new run of a scheduled task immediately.
                                    c('collider_2025:Action').t`Run now`
                                }
                            </span>
                        </Button>
                        <Button onClick={() => editor.openModal(true)} shape="outline">
                            {c('collider_2025:Action').t`Edit`}
                        </Button>
                    </div>

                    {/* Empty state */}
                    {!latestRun && (
                        <p className="m-0 lumo-body-small lumo-color-glyph-mid">{
                            // translator: Empty state on a scheduled task's home page before its first run.
                            c('collider_2025:Info').t`No runs yet. Results from each run will open here.`
                        }</p>
                    )}
                </div>
            </div>

            {editor.render && (
                <ScheduledTaskEditorModal
                    {...editor.modalProps}
                    initialValues={schedule}
                    mode="edit"
                    onDelete={(id) => {
                        if (dispatch(deleteSchedule(id))) {
                            sendScheduleDeletedEvent();
                        }
                        history.replace('/schedules');
                    }}
                    onSave={handleSave}
                    spaceId={scheduleId}
                />
            )}
        </LumoLayoutWithDrawer>
    );
};
