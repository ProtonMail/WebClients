import { useActiveBreakpoint } from '@proton/components';

export const useIsLumoSmallScreen = () => {
    const { viewportWidth } = useActiveBreakpoint();
    return {
        isSmallScreen: viewportWidth['<=small'],
        isMediumScreen: viewportWidth['<=medium'],
    };
};
