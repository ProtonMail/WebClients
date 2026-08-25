import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectCaptionsAgentPresent } from '@proton/meet/store/slices/participants/agentParticipantsSlice';

import { CAPTIONS_AGENT_WAIT_MS } from '../../constants';
import { retry } from '../../utils/retry';
import { useStableCallback } from '../useStableCallback';
import { useCaptionsPreference } from './useCaptionsPreference';
import { useIsWaitingForCaptionsAgent } from './useIsWaitingForCaptionsAgent';

export const useCaptionsAgentWaitTimeout = () => {
    const { createNotification } = useNotifications();
    const { setWantsCaptions } = useCaptionsPreference();
    const agentPresent = useMeetSelector(selectCaptionsAgentPresent);
    const waitingForCaptionsAgent = useIsWaitingForCaptionsAgent();

    // Captions that stopped and captions that never started share this timeout but not its wording.
    const agentEverPresent = useRef(false);
    agentEverPresent.current = agentEverPresent.current || agentPresent;

    // Stable, so an in-flight retry sees this render's value.
    const stillWaiting = useStableCallback(() => waitingForCaptionsAgent);

    const giveUpOnCaptions = useStableCallback(async () => {
        createNotification({
            type: 'error',
            text: agentEverPresent.current
                ? c('Error').t`Live captions have stopped.`
                : c('Error').t`Live captions couldn't be started.`,
        });

        // A failed write leaves the waiting state as it was, so the effect below would never arm a
        // second attempt: the retrying has to happen here.
        await retry(() => setWantsCaptions(false), {
            stopAfterFirstSuccess: true,
            shouldAttempt: stillWaiting,
            onFailure: (error) => {
                // eslint-disable-next-line no-console
                console.error('Failed to turn live captions off', error);
            },
        });
    });

    useEffect(() => {
        if (!waitingForCaptionsAgent) {
            return;
        }
        const timeout = setTimeout(giveUpOnCaptions, CAPTIONS_AGENT_WAIT_MS);
        return () => clearTimeout(timeout);
    }, [waitingForCaptionsAgent, giveUpOnCaptions]);
};
