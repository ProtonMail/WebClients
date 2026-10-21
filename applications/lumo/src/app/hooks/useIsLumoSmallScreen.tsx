import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';

export const useIsLumoSmallScreen = () => {
    const { viewportWidth } = useActiveBreakpoint();
    return {
        isSmallScreen: viewportWidth['<=small'],
        isMediumScreen: viewportWidth['<=medium'],
    };
};
