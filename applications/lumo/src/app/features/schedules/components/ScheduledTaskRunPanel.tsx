import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';

import type { ConversationArtifactDrawerEntry } from '../../../components/Conversation/artifact/conversationArtifactDrawerList';
import { KnowledgeBasePanel } from '../../../components/Files/KnowledgeBase/KnowledgeBasePanel';
import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { useLumoMemoSelector, useLumoSelector } from '../../../redux/hooks';
import { selectConversationsBySpaceId, selectProvisionalAttachments } from '../../../redux/selectors';
import type { Conversation, Message } from '../../../types';
import { useRunScheduleNow } from '../useRunScheduleNow';
import { getScheduleRunHistoryLabel } from './utils/run-label';
import { getScheduleRunTimestampLabel } from './utils/run-timestamp-label';

import './ScheduledTaskRunPanel.scss';

interface ScheduledTaskRunPanelProps {
    conversation: Conversation;
    scheduleName: string;
    messageChain: Message[];
    artifacts: ConversationArtifactDrawerEntry[];
    onOpenArtifact: (id: string) => void;
    onClose: () => void;
}

export const ScheduledTaskRunPanel = ({
    conversation,
    scheduleName,
    messageChain,
    artifacts,
    onOpenArtifact,
    onClose,
}: ScheduledTaskRunPanelProps) => {
    const runControls = useRunScheduleNow(conversation.spaceId);
    const location = useLocation<{ expandedScheduleRuns?: string }>();
    const conversations = useLumoMemoSelector(selectConversationsBySpaceId, [conversation.spaceId]);
    const currentAttachments = useLumoSelector(selectProvisionalAttachments);
    const [showRuns, setShowRuns] = useState(location.state?.expandedScheduleRuns === conversation.spaceId);
    const runsId = useId();
    const filesContainerRef = useRef<HTMLDivElement>(null);
    const runs = Object.values(conversations).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    useEffect(() => {
        if (location.state?.expandedScheduleRuns === conversation.spaceId) setShowRuns(true);
    }, [location.key, location.state?.expandedScheduleRuns, conversation.spaceId]);

    return (
        <KnowledgeBasePanel
            currentAttachments={currentAttachments}
            drawerArtifacts={artifacts}
            filesContainerRef={filesContainerRef}
            headerActions={
                <Button
                    disabled={runControls.disabled}
                    loading={runControls.loading}
                    onClick={runControls.runNow}
                    shape="outline"
                    size="small"
                >
                    <span className="flex flex-nowrap items-center gap-1">
                        <LumoIcon aria-hidden name="Play" size={14} />
                        {
                            // translator: Starts a new run of a scheduled task immediately.
                            c('collider_2025:Action').t`Run now`
                        }
                    </span>
                </Button>
            }
            isModal
            messageChain={messageChain}
            onClose={onClose}
            onOpenArtifact={onOpenArtifact}
            spaceId={conversation.spaceId}
            title={scheduleName}
        >
            <section className="mb-4">
                <button
                    aria-controls={runsId}
                    aria-expanded={showRuns}
                    className="flex flex-nowrap items-center justify-space-between gap-2 w-full mb-1"
                    onClick={() => setShowRuns((previous) => !previous)}
                    type="button"
                >
                    <h3 className="text-rg text-semibold">
                        {
                            // translator: Expands the list of past runs of this scheduled task.
                            c('collider_2025:Title').t`Runs`
                        }
                        <span className="ml-1.5 text-normal color-hint">{runs.length}</span>
                    </h3>
                    <LumoIcon
                        aria-hidden
                        className="color-weak"
                        name={showRuns ? 'ChevronDown' : 'ChevronRight'}
                        size={16}
                    />
                </button>

                <div hidden={!showRuns} id={runsId}>
                    <p className="my-1.5 text-sm color-hint">{
                        // translator: Description of the scheduled task's run history.
                        c('collider_2025:Info').t`When this task ran.`
                    }</p>
                    <div className="flex flex-column flex-nowrap gap-1.5 mt-3">
                        {runs.map((run) => {
                            const statusLabel = getScheduleRunHistoryLabel(run.scheduleRun);
                            return (
                                <ButtonLike
                                    key={run.id}
                                    aria-current={run.id === conversation.id ? 'page' : undefined}
                                    as={Link}
                                    className={clsx(
                                        'scheduled-task-run-panel__run py-2 text-rg',
                                        run.id === conversation.id && 'scheduled-task-run-panel__run--current'
                                    )}
                                    color="weak"
                                    fullWidth
                                    selected={run.id === conversation.id}
                                    shape="ghost"
                                    size="small"
                                    to={{
                                        pathname: `/c/${run.id}`,
                                        state: { ...location.state, expandedScheduleRuns: conversation.spaceId },
                                    }}
                                >
                                    <span className="flex flex-nowrap items-center gap-2 w-full text-normal">
                                        <span className="shrink-0">{getScheduleRunTimestampLabel(run.createdAt)}</span>
                                        {statusLabel && (
                                            <>
                                                <span aria-hidden className="color-hint">
                                                    ·
                                                </span>
                                                <span className="color-hint text-wrap">{statusLabel}</span>
                                            </>
                                        )}
                                    </span>
                                </ButtonLike>
                            );
                        })}
                    </div>
                </div>
            </section>
        </KnowledgeBasePanel>
    );
};
