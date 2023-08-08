import * as useActiveBreakpointModule from '@proton/components/hooks/useActiveBreakpoint';

export const mockUseActiveBreakpoint = (value?: Partial<ReturnType<typeof useActiveBreakpointModule.default>>) => {
    const mockedUseActiveBreakpoint = jest.spyOn(useActiveBreakpointModule, 'default');

    const values = {
        breakpoint: 'desktop',
        isLargeDesktop: true,
        isMediumDesktop: false,
        isSmallDesktop: false,
        isTablet: false,
        isMobile: false,
        isTinyMobile: false,
        ...value,
    };

    mockedUseActiveBreakpoint.mockReturnValue({
        ...values,
        isNarrow: value?.isNarrow ?? (values.isMobile || values.isTinyMobile),
        isDesktop: value?.isNarrow ?? (values.isLargeDesktop || values.isMediumDesktop || values.isSmallDesktop),
    });

    return mockedUseActiveBreakpoint;
};
