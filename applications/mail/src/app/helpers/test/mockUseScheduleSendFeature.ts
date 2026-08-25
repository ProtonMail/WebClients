import useScheduleSendFeature from '../../components/composer/actions/scheduleSend/useScheduleSendFeature';

jest.mock('../../components/composer/actions/scheduleSend/useScheduleSendFeature', () => ({
    __esModule: true,
    default: jest.fn(),
}));

export const mockUseScheduleSendFeature = (value?: Partial<ReturnType<typeof useScheduleSendFeature>>) => {
    const mockedUseScheduleSendFeature = jest.mocked(useScheduleSendFeature);

    mockedUseScheduleSendFeature.mockReturnValue({
        canScheduleSend: false,
        canScheduleSendCustom: false,
        loading: false,
        ...value,
    });

    return mockedUseScheduleSendFeature;
};
