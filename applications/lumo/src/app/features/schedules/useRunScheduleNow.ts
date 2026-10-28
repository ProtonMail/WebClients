import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';

import { useScheduleService } from '../../providers/ScheduleServiceContext';
import { useLumoSelector } from '../../redux/hooks';
import { scheduleConversationId } from '../../services/schedules/ConversationScheduleRunRepository';
import { STOPPED_SCHEDULE_SNAPSHOT } from '../../services/schedules/types';

const subscribeStopped = () => () => {};
const getStoppedSnapshot = () => STOPPED_SCHEDULE_SNAPSHOT;

/** Shared controls for the schedule home and the run drawer. */
export function useRunScheduleNow(scheduleId: string) {
    const service = useScheduleService();
    const snapshot = useSyncExternalStore(
        service?.subscribe ?? subscribeStopped,
        service?.getSnapshot ?? getStoppedSnapshot
    );
    const [user] = useUser();
    const history = useHistory();
    const { createNotification } = useNotifications();
    const [starting, setStarting] = useState(false);
    const inFlight = useRef(false);
    const [target, setTarget] = useState<{ conversationId: string; runId: string }>();
    const conversation = useLumoSelector((state) => (target ? state.conversations[target.conversationId] : undefined));
    const active = useRef({ service, scheduleId });
    useEffect(() => {
        active.current = { service, scheduleId };
        setTarget(undefined);
        setStarting(false);
        inFlight.current = false;
        return () => {
            active.current = { service: null, scheduleId: '' };
        };
    }, [service, scheduleId]);

    const notifyError = useCallback(
        () =>
            createNotification({
                type: 'error',
                text: c('collider_2025:Error').t`Could not start this task. Please try again.`,
            }),
        [createNotification]
    );

    useEffect(() => {
        if (!conversation) {
            const queued =
                target &&
                [...snapshot.pendingRuns, ...snapshot.unsettledRuns].some((run) => run.runId === target.runId);
            if (target && (snapshot.status === 'error' || (snapshot.status === 'ready' && !queued))) {
                setTarget(undefined);
                setStarting(false);
                inFlight.current = false;
                notifyError();
            }
            return;
        }
        setTarget(undefined);
        setStarting(false);
        inFlight.current = false;
        history.push({ pathname: `/c/${conversation.id}`, state: { expandedScheduleRuns: scheduleId } });
    }, [conversation, history, scheduleId, target, snapshot, notifyError]);

    const runNow = async () => {
        if (!service || !user?.ID || inFlight.current) return;
        inFlight.current = true;
        setStarting(true);
        try {
            const run = await service.runNow(scheduleId);
            if (active.current.service !== service || active.current.scheduleId !== scheduleId) return;
            setTarget({ conversationId: scheduleConversationId(user.ID, run.runId), runId: run.runId });
        } catch {
            if (active.current.service !== service || active.current.scheduleId !== scheduleId) return;
            inFlight.current = false;
            setStarting(false);
            notifyError();
        }
    };

    return { runNow, loading: starting, disabled: starting || snapshot.status !== 'ready' };
}
