import { useState } from 'react';

import { logger } from '@protontech/logger';
import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useAnnounce } from '@proton/components/components/liveAnnouncer/useAnnounce';
import useLoading from '@proton/hooks/useLoading';
import { toToggleState } from '@proton/meet/telemetry/dimensions';
import { TelemetryMeetActionsEvents, sendMeetActionsEvent } from '@proton/meet/telemetry/meetTelemetry';

import { useCaptionsAvailability } from '../../hooks/captions/useCaptionsAvailability';
import { useCaptionsConsentSkipped } from '../../hooks/captions/useCaptionsConsentSkipped';
import { useCaptionsPreference } from '../../hooks/captions/useCaptionsPreference';
import { CaptionsModal } from '../CaptionsModal/CaptionsModal';
import { announcementMessages } from '../MeetingAnnouncer/messages';

export const useLiveCaptionsToggle = () => {
    const { createNotification } = useNotifications();
    const announce = useAnnounce();
    const [loading, withLoading] = useLoading();
    const { wantsCaptions, setWantsCaptions } = useCaptionsPreference();
    const { isCaptionsDisabled } = useCaptionsAvailability();
    const { isConsentSkipped, skipConsent } = useCaptionsConsentSkipped();
    const checked = wantsCaptions && !isCaptionsDisabled;

    const [isCaptionsModalOpen, setIsCaptionsModalOpen] = useState(false);

    const setCaptions = (next: boolean) =>
        withLoading(
            setWantsCaptions(next).then(() => {
                announce(
                    next ? announcementMessages.liveCaptionsTurnedOn() : announcementMessages.liveCaptionsTurnedOff(),
                    { dedupeKey: `live-captions-${Date.now()}` }
                );
                return sendMeetActionsEvent(TelemetryMeetActionsEvents.captions_toggled, {
                    state: toToggleState(next),
                    captionsScope: 'self',
                });
            })
        ).catch((error) => {
            logger.error('Failed to update live captions', error);
            createNotification({
                type: 'error',
                text: c('Error').t`Failed to update live captions. Please try again.`,
            });
        });

    const onChange = () => {
        if (isCaptionsDisabled) {
            return;
        }
        // Confirm before turning on (unless the user opted out of the prompt); turn off directly.
        if (!checked) {
            if (isConsentSkipped()) {
                void setCaptions(true);
                return;
            }
            setIsCaptionsModalOpen(true);
            return;
        }

        void setCaptions(false);
    };

    const modals = isCaptionsModalOpen ? (
        <CaptionsModal
            onClose={() => setIsCaptionsModalOpen(false)}
            onConfirm={(dontShowAgain) => {
                setIsCaptionsModalOpen(false);
                if (dontShowAgain) {
                    skipConsent();
                }
                void setCaptions(true);
            }}
        />
    ) : null;

    return {
        checked,
        loading,
        disabled: isCaptionsDisabled,
        tooltip: isCaptionsDisabled ? c('Info').t`Host has disabled live captions for this meeting.` : undefined,
        onChange,
        modals,
    };
};
