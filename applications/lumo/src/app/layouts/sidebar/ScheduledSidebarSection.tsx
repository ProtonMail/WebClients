import { useHistory, useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { ScheduleSidebarLabel } from '../../features/schedules/components/ScheduleSidebarLabel';
import { useLumoSelector } from '../../redux/hooks';
import { selectLatestRunsByScheduleId, selectSchedulesSortedByLatestRun } from '../../redux/selectors';
import { CollapsibleSidebarSection } from './components/CollapsibleSidebarSection';
import { SidebarNavList } from './components/SidebarNavList';

export const ScheduledSidebarSection = ({ onItemClick }: { onItemClick?: () => void }) => {
    const history = useHistory();
    const conversationRoute = useRouteMatch<{ conversationId: string }>('/c/:conversationId');
    const scheduleRoute = useRouteMatch<{ scheduleId: string }>('/schedules/:scheduleId');
    const scheduleEntries = useLumoSelector(selectSchedulesSortedByLatestRun);
    const latestRuns = useLumoSelector(selectLatestRunsByScheduleId);
    const currentSpaceId = useLumoSelector((state) =>
        conversationRoute ? state.conversations[conversationRoute.params.conversationId]?.spaceId : undefined
    );

    const handleSchedulesClick = () => {
        onItemClick?.();
        history.push('/schedules');
    };

    return (
        <CollapsibleSidebarSection
            // translator: Collapsible sidebar heading above the user's scheduled tasks.
            label={c('collider_2025:Title').t`Scheduled`}
        >
            <div>
                {scheduleEntries.length > 0 && (
                    <SidebarNavList
                        items={scheduleEntries.slice(0, 5).map(([id, schedule]) => {
                            const run = latestRuns[id];
                            return {
                                id,
                                to: run ? `/c/${run.id}` : `/schedules/${id}`,
                                label: schedule.name,
                                trailingLabel: <ScheduleSidebarLabel rule={schedule.recurrenceRule} scheduleId={id} />,
                                isSelected: id === currentSpaceId || id === scheduleRoute?.params.scheduleId,
                            };
                        })}
                        onItemClick={onItemClick}
                    />
                )}
                {scheduleEntries.length > 5 && (
                    <button
                        className="flex items-center justify-center px-3 py-2 text-sm color-weak transition-colors hover:color-norm"
                        onClick={handleSchedulesClick}
                        type="button"
                    >
                        {
                            // translator: Opens the full list of scheduled tasks from the sidebar.
                            c('collider_2025:Button').t`See all`
                        }
                    </button>
                )}
                {scheduleEntries.length === 0 && (
                    // translator: Empty state beneath the Scheduled sidebar heading.
                    <div className="px-1.5 py-1 text-sm color-weak">
                        {c('collider_2025:Info').t`No scheduled tasks yet.`}
                    </div>
                )}
            </div>
        </CollapsibleSidebarSection>
    );
};
