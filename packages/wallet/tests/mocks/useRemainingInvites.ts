import * as useRemainingInvitesModule from '../../store/hooks/useRemainingInvites';

export const mockUseRemainingInvites = (
    mockedValue?: Partial<ReturnType<typeof useRemainingInvitesModule.useRemainingInvites>>
) => {
    const spy = vi.spyOn(useRemainingInvitesModule, 'useRemainingInvites');

    spy.mockReturnValue([mockedValue?.[0] ?? { available: 10, used: 0 }, mockedValue?.[1] ?? false]);

    return spy;
};
