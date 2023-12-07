import * as useActiveBreakpointModule from '@proton/components/hooks/useActiveBreakpoint';
import { Breakpoints } from '@proton/components/hooks/useActiveBreakpoint';

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

export const mockUseActiveBreakpoint = (value?: {
    activeBreakpoint?: Breakpoints['activeBreakpoint'];
    viewportWidth: Partial<Breakpoints['viewportWidth']>;
}) => {
    const mockedUseActiveBreakpoint = jest.spyOn(useActiveBreakpointModule, 'default');

    const values: Breakpoints = {
        activeBreakpoint: value?.activeBreakpoint || mockDefaultBreakpoints.activeBreakpoint,
        viewportWidth: {
            ...mockDefaultBreakpoints.viewportWidth,
            ...value?.viewportWidth,
        },
    };

    mockedUseActiveBreakpoint.mockReturnValue(values);

    return mockedUseActiveBreakpoint;
};
