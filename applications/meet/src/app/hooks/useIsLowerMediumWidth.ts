import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';

import { useMediaQuery } from './useMediaQuery';

const MEDIUM_BREAKPOINT_MIDPOINT_QUERY = '(max-width: 54.0625em)';

export const useIsLowerMediumWidth = () => {
    const { viewportWidth } = useActiveBreakpoint();
    const isBelowMediumMidpoint = useMediaQuery(MEDIUM_BREAKPOINT_MIDPOINT_QUERY);

    return viewportWidth.medium && isBelowMediumMidpoint;
};
