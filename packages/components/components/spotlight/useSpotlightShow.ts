import { useContext, useEffect } from 'react';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useInstance from '@proton/hooks/useInstance';
import { isDialogOpen, isDropdownOpen, isModalOpen } from '@proton/shared/lib/busy';
import generateUID from '@proton/utils/generateUID';

import { SpotlightContext } from './Provider';

const useSpotlightShow = (show: boolean, delay = 0) => {
    const spotlightID = useInstance(() => generateUID());
    const { spotlight, addSpotlight } = useContext(SpotlightContext);

    // Do not show spotlight on small screens
    const { viewportWidth } = useActiveBreakpoint();

    useEffect(() => {
        // Delay spotlights to avoid conflicts with other top elements such as the offer modal
        // It makes the UX more attractive
        const timeout = setTimeout(() => {
            // Do not show spotlight if a modal, dialog or dropdown is open
            const isOverlayElementActive = isDialogOpen() || isModalOpen() || isDropdownOpen();

            if (show && !viewportWidth['<=small'] && !isOverlayElementActive) {
                addSpotlight(spotlightID);
            }
        }, delay);

        return () => clearTimeout(timeout);
    }, [show, !viewportWidth['<=small']]);

    // Return true if the current spotlight is the one to show
    return spotlight === spotlightID && show;
};

export default useSpotlightShow;
