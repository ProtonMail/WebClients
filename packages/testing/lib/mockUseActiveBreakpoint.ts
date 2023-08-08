import * as useActiveBreakpointModule from '@proton/components/hooks/useActiveBreakpoint';

type HookReturnType = ReturnType<typeof useActiveBreakpointModule.default>;
export const mockUseActiveBreakpoint = (value: Partial<HookReturnType>) => {
    const mockedUseActiveBreakpoint = jest.spyOn(useActiveBreakpointModule, 'default');

    mockedUseActiveBreakpoint.mockReturnValue({
        ...value,
    } as HookReturnType);

    return mockedUseActiveBreakpoint;
};
