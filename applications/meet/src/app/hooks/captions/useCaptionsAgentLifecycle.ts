import { useEffect, useRef, useState } from 'react';

import { useMeetErrorReporting } from '@proton/meet';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectJoinedRoom } from '@proton/meet/store/slices/connectionSlice';
import { selectMeetingLinkName } from '@proton/meet/store/slices/currentMeeting';
import { selectCaptionsAgentPresent } from '@proton/meet/store/slices/participants/agentParticipantsSlice';

import { CAPTIONS_AGENT_DISABLE_GRACE_MS } from '../../constants';
import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { useStableCallback } from '../useStableCallback';
import { useCaptionsWantersCount } from './useCaptionsWantersCount';

// meet-core arbitrates which client actually asks meet-server, and a later-ranked client takes over
// if the agent never turns up, so every client calls these and none of them retries. What core does
// not decide is whether captions are wanted at all: a stop applies to the whole meeting, so it may
// only be sent once nobody wants them.
export const useCaptionsAgentLifecycle = () => {
    const meetCoreClient = useMeetCoreClient();
    const meetingLinkName = useMeetSelector(selectMeetingLinkName);
    const { reportMeetError } = useMeetErrorReporting();
    const joinedRoom = useMeetSelector(selectJoinedRoom);
    const wanters = useCaptionsWantersCount();
    const agentPresent = useMeetSelector(selectCaptionsAgentPresent);

    const wanted = joinedRoom && wanters > 0;

    // Demand disappearing is held briefly so a quick toggle doesn't dismiss an agent we are about to
    // want again; demand appearing is acted on at once. `null` until the hold has elapsed even once,
    // so joining a meeting nobody wants captions in doesn't dismiss an agent before the grace.
    const [settledWanted, setSettledWanted] = useState<boolean | null>(null);

    // What we last asked core for, so a change of demand is sent once rather than on every
    // participant update. Core's stagger outlives a render, so this cannot be state.
    const asked = useRef<boolean | null>(null);
    const inFlight = useRef(false);
    // Bumped when a call settles, so the effect below reruns and can send the opposite request if
    // demand flipped while core was staggering.
    const [revision, setRevision] = useState(0);

    const reportError = useStableCallback(reportMeetError);

    useEffect(() => {
        if (wanted) {
            setSettledWanted(true);
            return;
        }
        const timeout = setTimeout(() => setSettledWanted(false), CAPTIONS_AGENT_DISABLE_GRACE_MS);
        return () => clearTimeout(timeout);
    }, [wanted]);

    useEffect(() => {
        // Leaving drops the agent for us anyway, and the local preference is cleared afterwards,
        // which would otherwise read as fresh demand on the next join.
        if (!joinedRoom) {
            asked.current = null;
            return;
        }

        // Clearing the latch mid-call would have the settled call ask a second time.
        if (inFlight.current) {
            return;
        }

        // The agent is here and nobody has asked for it to go, so there is nothing outstanding —
        // and clearing the latch is what lets an agent that later drops out be asked for again.
        // This has to come before the latch check below, which would otherwise hold `true` from the
        // original request for as long as the agent stays. A stop we already sent doesn't count: the
        // agent is on its way out, so demand returning has to countermand it even though the agent
        // is still visible.
        if (settledWanted && agentPresent && asked.current !== false) {
            asked.current = null;
            return;
        }

        if (asked.current === settledWanted) {
            return;
        }

        // Nothing to stop: no agent in the room and no request of ours that could still be on its
        // way. Core would treat this as a no-op anyway, so this only saves the round trip.
        if (!settledWanted && !agentPresent && asked.current === null) {
            return;
        }

        const wantAgent = settledWanted === true;
        // Recorded before the call so a failure does not re-arm: another client's rank group takes
        // over from there, and `useCaptionsAgentWaitTimeout` surfaces it if nobody does.
        asked.current = wantAgent;
        inFlight.current = true;

        void (async () => {
            try {
                if (wantAgent) {
                    await meetCoreClient.requestClosedCaptions(meetingLinkName);
                } else {
                    await meetCoreClient.stopClosedCaptions(meetingLinkName);
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Failed to settle the closed captions agent', error);
                reportError(wantAgent ? 'Failed to request closed captions' : 'Failed to stop closed captions', {
                    context: { error },
                });
            } finally {
                inFlight.current = false;
                setRevision((count) => count + 1);
            }
        })();
    }, [joinedRoom, settledWanted, agentPresent, revision, meetCoreClient, meetingLinkName, reportError]);
};
