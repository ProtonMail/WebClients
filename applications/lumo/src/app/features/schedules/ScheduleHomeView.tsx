import { Redirect, useHistory, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import Loader from '@proton/components/components/loader/Loader';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';

import { useNativeComposerVisibilityApi } from '../../components/Composer/hooks/useNativeComposerVisibilityApi';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { useIsChatHistoryHydrating } from '../../hooks/useIsChatHistoryHydrating';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import { selectLatestRunsByScheduleId, selectSchedules } from '../../redux/selectors';
import { deleteSchedule, saveSchedule } from '../../redux/slices/schedules';
import type { SpaceId } from '../../types';
import { ConnectorList } from './components/ConnectorList';
import { ScheduleBreadcrumbs } from './components/ScheduleBreadcrumbs';
import { ScheduleNextRunLabel } from './components/ScheduleNextRunLabel';
import { ScheduledTaskEditorModal } from './components/modals/ScheduledTaskEditorModal';
import { getScheduleCadenceLabel } from './components/utils/cadence-label';
import type { ScheduleDetails } from './types';

import './ScheduleHomeView.scss';

export const ScheduleHomeView = () => {
    const { scheduleId } = useParams<{ scheduleId: string }>();
    const history = useHistory();
    const dispatch = useLumoDispatch();
    const schedule = useLumoSelector(selectSchedules)[scheduleId];
    const latestRun = useLumoSelector(selectLatestRunsByScheduleId)[scheduleId];
    const isHydrating = useIsChatHistoryHydrating();
    const [userSettings] = useUserSettings();
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
                        <div className="inline-flex items-center justify-center mb-3 p-3 border border-weak rounded-lg">
                            <LumoIcon aria-hidden name="Clock" size={24} />
                        </div>
                        <h1 className="m-0 mb-2 text-bold">{schedule.name}</h1>
                        <div className="flex flex-wrap items-center gap-1.5 text-rg color-weak">
                            <LumoIcon aria-hidden name="Clock" size={14} />
                            <span>
                                {getScheduleCadenceLabel(schedule.recurrenceRule, getWeekStartsOn(userSettings))}
                            </span>
                            <span aria-hidden>·</span>
                            <ScheduleNextRunLabel rule={schedule.recurrenceRule} />
                        </div>
                    </div>

                    {/* Schedule instructions */}
                    <section className="p-4 border border-weak rounded-xl bg-norm">
                        <h2 className="m-0 mb-2 text-sm text-semibold color-weak">{
                            // translator: Heading above the instructions executed by a scheduled task.
                            c('collider_2025:Title').t`What it does`
                        }</h2>
                        <p className="m-0 text-ellipsis-four-lines">{schedule.instructions}</p>
                    </section>

                    {/* Schedule connectors */}
                    {schedule.connectors.length > 0 && (
                        <ConnectorList headerClassName="text-sm color-weak" value={schedule.connectors} />
                    )}

                    {/* Schedule actions */}
                    <div className="flex gap-2">
                        <Button color="norm">
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
                        <p className="m-0 text-sm color-weak">{
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
                        dispatch(deleteSchedule(id));
                        history.replace('/schedules');
                    }}
                    onSave={handleSave}
                    spaceId={scheduleId}
                />
            )}
        </LumoLayoutWithDrawer>
    );
};
