import type { Breakpoints } from '@proton/components/hooks/useActiveBreakpoint';

export const mockDefaultBreakpoints: Breakpoints = {
    activeBreakpoint: 'large',
    viewportWidth: {
        xsmall: false,
        small: false,
        medium: false,
        large: false,
        xlarge: false,
        '2xlarge': false,
        '<=small': false,
        '<=medium': false,
        '>=large': false,
    },
};
