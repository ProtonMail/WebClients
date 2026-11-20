import useScheduleSendFeature from '@proton/mail-composer/components/composer/actions/scheduleSend/useScheduleSendFeature';

vi.mock('@proton/mail-composer/components/composer/actions/scheduleSend/useScheduleSendFeature', () => ({
    __esModule: true,
    default: vi.fn(),
}));

export const mockUseScheduleSendFeature = (value?: Partial<ReturnType<typeof useScheduleSendFeature>>) => {
    const mockedUseScheduleSendFeature = vi.mocked(useScheduleSendFeature);

    mockedUseScheduleSendFeature.mockReturnValue({
        canScheduleSend: false,
        canScheduleSendCustom: false,
        loading: false,
        ...value,
    });

    return mockedUseScheduleSendFeature;
};
