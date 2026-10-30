import { useEffect, useState } from 'react';

import { getActiveBreakpoint } from '@proton/components/hooks/useActiveBreakpoint';

const getIsSmallScreen = () => ['xsmall', 'small'].includes(getActiveBreakpoint());
const getIsMediumScreen = () => ['xsmall', 'small', 'medium'].includes(getActiveBreakpoint());

export const useIsLumoSmallScreen = () => {
    const [isSmallScreen, setIsSmallScreen] = useState(getIsSmallScreen);
    const [isMediumScreen, setIsMediumScreen] = useState(getIsMediumScreen);

    useEffect(() => {
        const updateBreakpoint = () => {
            setIsSmallScreen(getIsSmallScreen());
            setIsMediumScreen(getIsMediumScreen());
        };
        updateBreakpoint();
        window.addEventListener('resize', updateBreakpoint);
        return () => {
            window.removeEventListener('resize', updateBreakpoint);
        };
    }, []);

    return {
        isSmallScreen,
        isMediumScreen,
    };
};
