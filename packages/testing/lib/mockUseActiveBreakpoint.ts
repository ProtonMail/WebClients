import * as useActiveBreakpointModule from '@proton/components/hooks/useActiveBreakpoint';

export const mockUseActiveBreakpoint = (value?: Partial<ReturnType<typeof useActiveBreakpointModule.default>>) => {
    const mockedUseActiveBreakpoint = jest.spyOn(useActiveBreakpointModule, 'default');

    const values = {
        breakpoint: 'desktop',
        isDesktop: true,
        isTablet: false,
        isMobile: false,
        isTinyMobile: false,
        ...value,
    };

    mockedUseActiveBreakpoint.mockReturnValue({
        ...values,
        isNarrow: values.isMobile || values.isTinyMobile,
    });

    return mockedUseActiveBreakpoint;
};
