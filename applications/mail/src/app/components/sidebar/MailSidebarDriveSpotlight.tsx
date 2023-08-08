import React, { useCallback } from 'react';

import { addDays, fromUnixTime } from 'date-fns';

import Spotlight from '@proton/components/components/spotlight/Spotlight';
import { FeatureCode } from '@proton/components/containers';
import {
    useActiveBreakpoint,
    useDriveWindowsGASpotlight,
    useFeature,
    useSpotlightOnFeature,
    useUser,
    useWelcomeFlags,
} from '@proton/components/hooks';
import { isWindows } from '@proton/shared/lib/helpers/browser';

interface Props {
    renderDropdown: (hideSpotlight: () => void) => React.ReactElement;
}

/**
 * @deprecated Remove when operation is finished
 * MAILWEB-4357
 */
const MailSidebarDriveSpotlight = ({ renderDropdown }: Props) => {
    const [user] = useUser();
    const [spotlightProps, setShowSpotlight] = useDriveWindowsGASpotlight({ placement: 'bottom' });
    const isSpotlightActive = !!useFeature(FeatureCode.DriveWindowsGAMailSpotlightShown).feature?.Value;
    const { show, onDisplayed } = useSpotlightOnFeature(FeatureCode.DriveWindowsGAMailSpotlight, isSpotlightActive);
    const userAccountHasMoreThanTwoDays = new Date() > addDays(fromUnixTime(user.CreateTime), 2);

    const { isNarrow } = useActiveBreakpoint();
    const [{ isDone }] = useWelcomeFlags();
    const hideSpotlight = useCallback(() => setShowSpotlight(false), []);

    /**
     * 1. The spotlight is active
     * 2. User has not seen the spotlight yet
     * 3. User is on windows
     * 4. User is not on a mobile screen
     * 5. User has done the welcome flow
     * 6. User has created his account more than 2 days ago
     */
    const displaySpotlight =
        isSpotlightActive && show && isWindows() && !isNarrow && isDone && userAccountHasMoreThanTwoDays;

    if (displaySpotlight) {
        // Render children (AppsDropdown) with onDropdownClick to close the Spotlight
        return (
            <Spotlight {...spotlightProps} onDisplayed={onDisplayed}>
                {renderDropdown(hideSpotlight)}
            </Spotlight>
        );
    }

    return renderDropdown(hideSpotlight);
};

export default MailSidebarDriveSpotlight;
