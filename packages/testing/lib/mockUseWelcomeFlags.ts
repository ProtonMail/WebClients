import * as useWelcomeFlagsModule from '@proton/components/hooks/useWelcomeFlags';

export const mockUseWelcomeFlags = ([state, setDone]: [
    Partial<useWelcomeFlagsModule.WelcomeFlagsState>?,
    (() => void)?
] = []) => {
    const mockedUseWelcomeFlags = jest.spyOn(useWelcomeFlagsModule, 'default');
    mockedUseWelcomeFlags.mockReturnValue([
        { hasGenericWelcomeStep: true, isDone: false, isWelcomeFlow: false, ...state },
        setDone ?? jest.fn,
    ]);

    return mockedUseWelcomeFlags;
};
