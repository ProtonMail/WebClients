import { useHistory, useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { ScheduleSidebarLabel } from '../../features/schedules/components/ScheduleSidebarLabel';
import { getGroupAttentionKey, useAttentionKeys } from '../../providers/ConversationAttentionProvider';
import { useLumoSelector } from '../../redux/hooks';
import { selectLatestRunsByScheduleId, selectSchedulesSortedByLatestRun } from '../../redux/selectors';
import { CollapsibleSidebarSection } from './components/CollapsibleSidebarSection';
import { SidebarNavList } from './components/SidebarNavList';

const DEFAULT_SCHEDULE_LIMIT = 5;

export const ScheduledSidebarSection = ({ onItemClick }: { onItemClick?: () => void }) => {
    const history = useHistory();
    const conversationRoute = useRouteMatch<{ conversationId: string }>('/c/:conversationId');
    const scheduleRoute = useRouteMatch<{ scheduleId: string }>('/schedules/:scheduleId');
    const scheduleEntries = useLumoSelector(selectSchedulesSortedByLatestRun);
    const latestRuns = useLumoSelector(selectLatestRunsByScheduleId);
    const { bySpace: attentionBySpace } = useAttentionKeys();
    const currentSpaceId = useLumoSelector((state) =>
        conversationRoute ? state.conversations[conversationRoute.params.conversationId]?.spaceId : undefined
    );

    const visibleEntries = scheduleEntries.filter(
        ([id], index) => index < DEFAULT_SCHEDULE_LIMIT || attentionBySpace.has(id)
    );
    const sectionAttentionKey = getGroupAttentionKey(visibleEntries.map(([id]) => attentionBySpace.get(id)?.key));

    const handleSchedulesClick = () => {
        onItemClick?.();
        history.push('/schedules');
    };

    return (
        <CollapsibleSidebarSection
            // translator: Collapsible sidebar heading above the user's scheduled tasks.
            label={c('collider_2025:Title').t`Scheduled`}
            attentionKey={sectionAttentionKey}
        >
            <div>
                {scheduleEntries.length > 0 && (
                    <SidebarNavList
                        items={visibleEntries.map(([id, schedule]) => {
                            const attention = attentionBySpace.get(id);
                            const runId = attention?.conversationId ?? latestRuns[id]?.id;
                            return {
                                id,
                                to: runId ? `/c/${runId}` : `/schedules/${id}`,
                                label: schedule.name,
                                trailingLabel: <ScheduleSidebarLabel rule={schedule.recurrenceRule} scheduleId={id} />,
                                isSelected: id === currentSpaceId || id === scheduleRoute?.params.scheduleId,
                                attentionKey: attention?.key,
                            };
                        })}
                        onItemClick={onItemClick}
                    />
                )}
                {scheduleEntries.length > DEFAULT_SCHEDULE_LIMIT && (
                    <button
                        className="lumo-sidebar-section-more flex items-center justify-center px-3 py-2 lumo-body-small lumo-color-glyph-mid transition-colors"
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
                    <div className="px-3 py-2 lumo-body-small lumo-color-glyph-mid">
                        {c('collider_2025:Info').t`No scheduled tasks yet.`}
                    </div>
                )}
            </div>
        </CollapsibleSidebarSection>
    );
};
