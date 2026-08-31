import { useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import useLoading from '@proton/hooks/useLoading';

import { SettingToggle } from '../../atoms/SettingToggle/SettingToggle';
import { useCaptionsAvailability } from '../../hooks/captions/useCaptionsAvailability';
import { useCaptionsPreference } from '../../hooks/captions/useCaptionsPreference';
import { CaptionsModal } from '../CaptionsModal/CaptionsModal';

export const LiveCaptionsToggle = () => {
    const { createNotification } = useNotifications();
    const [loadingLiveCaptions, withLoadingLiveCaptions] = useLoading();
    const { wantsCaptions, setWantsCaptions } = useCaptionsPreference();
    const { isCaptionsDisabled } = useCaptionsAvailability();
    const enableLiveCaptions = wantsCaptions && !isCaptionsDisabled;

    const [isCaptionsModalOpen, setIsCaptionsModalOpen] = useState(false);

    const setCaptions = (next: boolean) =>
        withLoadingLiveCaptions(setWantsCaptions(next)).catch((error) => {
            // eslint-disable-next-line no-console
            console.error('Failed to update live captions', error);
            createNotification({
                type: 'error',
                text: c('Error').t`Failed to update live captions. Please try again.`,
            });
        });

    const handleChange = () => {
        if (isCaptionsDisabled) {
            return;
        }
        // Confirm before turning on; turn off directly.
        if (!enableLiveCaptions) {
            setIsCaptionsModalOpen(true);
            return;
        }

        void setCaptions(false);
    };

    return (
        <>
            <SettingToggle
                id={`live-captions`}
                label={c('Action').t`Live captions`}
                ariaLabel={c('Alt').t`Live captions`}
                onChange={handleChange}
                checked={enableLiveCaptions}
                loading={loadingLiveCaptions}
                disabled={isCaptionsDisabled}
                tooltip={
                    isCaptionsDisabled ? c('Info').t`Host has disabled live captions for this meeting.` : undefined
                }
            />
            {isCaptionsModalOpen && (
                <CaptionsModal
                    onClose={() => setIsCaptionsModalOpen(false)}
                    onConfirm={() => {
                        setIsCaptionsModalOpen(false);
                        void setCaptions(true);
                    }}
                />
            )}
        </>
    );
};
