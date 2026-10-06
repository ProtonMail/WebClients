import { useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { toToggleState } from '@proton/meet/telemetry/dimensions';
import { TelemetryMeetActionsEvents, sendMeetActionsEvent } from '@proton/meet/telemetry/meetTelemetry';

import { useCaptionsAvailability } from '../../hooks/captions/useCaptionsAvailability';
import { useCaptionsConsentSkipped } from '../../hooks/captions/useCaptionsConsentSkipped';
import { useCaptionsPreference } from '../../hooks/captions/useCaptionsPreference';
import { CaptionsModal } from '../CaptionsModal/CaptionsModal';

export const useLiveCaptionsToggle = () => {
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { wantsCaptions, setWantsCaptions } = useCaptionsPreference();
    const { isCaptionsDisabled } = useCaptionsAvailability();
    const { isConsentSkipped, skipConsent } = useCaptionsConsentSkipped();
    const checked = wantsCaptions && !isCaptionsDisabled;

    const [isCaptionsModalOpen, setIsCaptionsModalOpen] = useState(false);

    const setCaptions = (next: boolean) =>
        withLoading(
            setWantsCaptions(next).then(() =>
                sendMeetActionsEvent(TelemetryMeetActionsEvents.captions_toggled, {
                    state: toToggleState(next),
                    captionsScope: 'self',
                })
            )
        ).catch((error) => {
            // eslint-disable-next-line no-console
            console.error('Failed to update live captions', error);
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
