import { useState } from 'react';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';

import { SettingToggle, type SettingToggleSize } from '../../atoms/SettingToggle/SettingToggle';
import { useCaptionsPreference } from '../../hooks/captions/useCaptionsPreference';
import { CaptionsModal } from '../CaptionsModal/CaptionsModal';

export const LiveCaptionsToggle = ({ size = 'large' }: { size?: SettingToggleSize }) => {
    const { createNotification } = useNotifications();
    const [loadingLiveCaptions, withLoadingLiveCaptions] = useLoading();
    const { wantsCaptions: enableLiveCaptions, setWantsCaptions } = useCaptionsPreference();

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
                size={size}
                loading={loadingLiveCaptions}
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
