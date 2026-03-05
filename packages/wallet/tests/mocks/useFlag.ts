import * as UseFlagModule from '@proton/unleash/useFlag';

export const mockUseFlag = (flagValue: boolean) => {
    const spy = vi.spyOn(UseFlagModule, 'useFlag');
    spy.mockReturnValue(flagValue);
    return spy;
};
