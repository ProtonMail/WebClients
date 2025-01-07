import * as useFlagModule from '@proton/unleash/useFlag';

export const mockUseFlag = (flagValue: boolean) => {
    const spy = vi.spyOn(useFlagModule, 'default');
    spy.mockReturnValue(flagValue);
    return spy;
};
